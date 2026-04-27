import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../db';
import Transaction from '../models/Transaction';
import Transfer from '../models/Transfer';
import Account from '../models/Account';
import User from '../models/User';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown error';

const resolveCurrentUser = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const email = authReq.auth?.email;

  if (!email) {
    res.status(401).json({ message: 'Missing authenticated user email' });
    return null;
  }

  const user = await User.findOne({ where: { Email: email } });

  if (!user) {
    res.status(403).json({
      message: 'Authenticated email was not found in the users table',
      email,
    });
    return null;
  }

  return user;
};

const isAdminUser = (dbRole: string, tokenRole: 'user' | 'admin' | undefined) =>
  dbRole.toLowerCase() === 'admin' || tokenRole === 'admin';

const includeAccount = {
  association: 'account' as const,
  include: [{ association: 'owner' as const }],
};

const includeTransfer = {
  association: 'transfer' as const,
  include: [
    { association: 'fromAccount' as const, include: [{ association: 'owner' as const }] },
    { association: 'toAccount' as const, include: [{ association: 'owner' as const }] },
  ],
};

// GET all transactions for current user
router.get('/', async (req: Request, res: Response) => {
  try {
    const currentUser = await resolveCurrentUser(req, res);
    if (!currentUser) return;

    const authReq = req as AuthenticatedRequest;
    const admin = isAdminUser(currentUser.Role, authReq.auth?.tokenRole);

    let transactions;

    if (admin) {
      transactions = await Transaction.findAll({
        include: [includeAccount, includeTransfer],
        order: [['Timestamp', 'DESC']]
      });
    } else {
      const userAccounts = await Account.findAll({
        where: { UserID: currentUser.UserID }
      });

      const accountIds = userAccounts.map(acc => acc.AccountID);

      transactions = await Transaction.findAll({
        where: {
          AccountID: { [Op.in]: accountIds },
          TransactionType: { [Op.in]: ['withdrawal', 'deposit', 'transfer'] },
        },
        include: [includeAccount, includeTransfer],
        order: [['Timestamp', 'DESC']]
      });
    }

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Error fetching transactions', error: errorMessage(error) });
  }
});

// POST a new transaction (withdrawal, deposit, or transfer)
router.post('/', async (req: Request, res: Response) => {
  try {
    const currentUser = await resolveCurrentUser(req, res);
    if (!currentUser) return;

    const authReq = req as AuthenticatedRequest;
    const admin = isAdminUser(currentUser.Role, authReq.auth?.tokenRole);

    const { AccountID, ToAccountID, Amount, Type } = req.body;

    if (!AccountID || !Amount || !Type) {
      res.status(400).json({ message: 'AccountID, Amount, and Type are required' });
      return;
    }

    if (!['withdraw', 'deposit', 'transfer'].includes(Type)) {
      res.status(400).json({ message: 'Type must be withdraw, deposit, or transfer' });
      return;
    }

    // Validate amount is positive
    if (Number(Amount) <= 0) {
      res.status(400).json({ message: 'Amount must be greater than 0' });
      return;
    }

    const sourceAccount = await Account.findByPk(AccountID);
    if (!sourceAccount) {
      res.status(404).json({ message: 'Account not found' });
      return;
    }

    if (!admin && sourceAccount.UserID !== currentUser.UserID) {
      res.status(403).json({ message: 'Not authorized to use this account' });
      return;
    }

    let targetAccount = null;
    if (Type === 'transfer') {
      if (!ToAccountID) {
        res.status(400).json({ message: 'ToAccountID is required for transfers' });
        return;
      }

      targetAccount = await Account.findByPk(ToAccountID);
      if (!targetAccount) {
        res.status(404).json({ message: 'To account not found' });
        return;
      }

      if (AccountID === ToAccountID) {
        res.status(400).json({ message: 'Cannot transfer to the same account' });
        return;
      }
    }

    if ((Type === 'withdraw' || Type === 'transfer') && Number(sourceAccount.Balance) < Number(Amount)) {
      res.status(400).json({ message: 'Insufficient balance' });
      return;
    }

    const createdPayload = await sequelize.transaction(async transaction => {
      if (Type === 'withdraw') {
        const created = await Transaction.create({
          AccountID,
          Amount,
          TransactionType: 'withdrawal',
          TransferID: null,
        }, { transaction });

        await sourceAccount.update({ Balance: Number(sourceAccount.Balance) - Number(Amount) }, { transaction });

        return [created];
      }

      if (Type === 'deposit') {
        const created = await Transaction.create({
          AccountID,
          Amount,
          TransactionType: 'deposit',
          TransferID: null,
        }, { transaction });

        await sourceAccount.update({ Balance: Number(sourceAccount.Balance) + Number(Amount) }, { transaction });

        return [created];
      }

      if (!targetAccount) {
        throw new Error('Missing target account');
      }

      const transfer = await Transfer.create({
        FromAccountID: sourceAccount.AccountID,
        ToAccountID: targetAccount.AccountID,
        Amount,
      }, { transaction });

      const withdrawRow = await Transaction.create({
        AccountID: sourceAccount.AccountID,
        Amount,
        TransactionType: 'transfer',
        TransferID: transfer.TransferID,
      }, { transaction });

      const depositRow = await Transaction.create({
        AccountID: targetAccount.AccountID,
        Amount,
        TransactionType: 'transfer',
        TransferID: transfer.TransferID,
      }, { transaction });

      await sourceAccount.update({ Balance: Number(sourceAccount.Balance) - Number(Amount) }, { transaction });
      await targetAccount.update({ Balance: Number(targetAccount.Balance) + Number(Amount) }, { transaction });

      return [withdrawRow, depositRow];
    });

    const hydrated = await Promise.all(
      createdPayload.map(item =>
        Transaction.findByPk(item.TransactionID, { include: [includeAccount, includeTransfer] })
      )
    );

    res.status(201).json(hydrated.length === 1 ? hydrated[0] : hydrated);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ message: 'Error creating transaction', error: errorMessage(error) });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../db';
import Transaction from '../models/Transaction';
import Transfer from '../models/Transfer';
import Account from '../models/Account';

const router = Router();

async function getUserAccountIds(userID: number): Promise<number[]> {
  const accounts = await Account.findAll({
    attributes: ['AccountID'],
    where: { UserID: userID },
  });
  return accounts.map((a) => a.AccountID);
}

// GET all transactions — admin sees all, regular user sees only their accounts' transactions
router.get('/', async (req: Request, res: Response) => {
  try {
    if (req.dbUser!.Role === 'admin') {
      const transactions = await Transaction.findAll({ order: [['Timestamp', 'DESC']] });
      res.json(transactions);
    } else {
      const accountIds = await getUserAccountIds(req.dbUser!.UserID);
      const transactions = await Transaction.findAll({
        where: { AccountID: { [Op.in]: accountIds } },
        order: [['Timestamp', 'DESC']],
      });
      res.json(transactions);
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions', error });
  }
});

// GET transactions for a specific account
router.get('/account/:accountId', async (req: Request<{ accountId: string }>, res: Response) => {
  try {
    const accountId = parseInt(req.params.accountId, 10);
    if (req.dbUser!.Role !== 'admin') {
      const accountIds = await getUserAccountIds(req.dbUser!.UserID);
      if (!accountIds.includes(accountId)) {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }
    }
    const transactions = await Transaction.findAll({
      where: { AccountID: accountId },
      order: [['Timestamp', 'DESC']],
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions', error });
  }
});

// POST /deposit — increase account balance and record transaction
router.post('/deposit', async (req: Request, res: Response) => {
  const { AccountID, Amount } = req.body;
  const amount = parseFloat(Amount);

  if (!AccountID || isNaN(amount) || amount <= 0) {
    res.status(400).json({ message: 'AccountID and a positive Amount are required' });
    return;
  }

  const account = await Account.findByPk(AccountID);
  if (!account) {
    res.status(404).json({ message: 'Account not found' });
    return;
  }
  if (req.dbUser!.Role !== 'admin' && account.UserID !== req.dbUser!.UserID) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const t = await sequelize.transaction();
  try {
    await account.increment('Balance', { by: amount, transaction: t });
    const tx = await Transaction.create(
      { AccountID, Amount: amount, TransactionType: 'deposit' },
      { transaction: t }
    );
    await t.commit();
    res.status(201).json(tx);
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: 'Error processing deposit', error });
  }
});

// POST /withdraw — decrease account balance and record transaction
router.post('/withdraw', async (req: Request, res: Response) => {
  const { AccountID, Amount } = req.body;
  const amount = parseFloat(Amount);

  if (!AccountID || isNaN(amount) || amount <= 0) {
    res.status(400).json({ message: 'AccountID and a positive Amount are required' });
    return;
  }

  const account = await Account.findByPk(AccountID);
  if (!account) {
    res.status(404).json({ message: 'Account not found' });
    return;
  }
  if (req.dbUser!.Role !== 'admin' && account.UserID !== req.dbUser!.UserID) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const currentBalance = parseFloat(account.Balance.toString());
  if (currentBalance < amount) {
    res.status(400).json({ message: 'Insufficient funds' });
    return;
  }

  const t = await sequelize.transaction();
  try {
    await account.decrement('Balance', { by: amount, transaction: t });
    const tx = await Transaction.create(
      { AccountID, Amount: amount, TransactionType: 'withdrawal' },
      { transaction: t }
    );
    await t.commit();
    res.status(201).json(tx);
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: 'Error processing withdrawal', error });
  }
});

// POST /transfer — move funds between two accounts atomically
router.post('/transfer', async (req: Request, res: Response) => {
  const { FromAccountID, ToAccountID, Amount } = req.body;
  const amount = parseFloat(Amount);

  if (!FromAccountID || !ToAccountID || isNaN(amount) || amount <= 0) {
    res.status(400).json({ message: 'FromAccountID, ToAccountID, and a positive Amount are required' });
    return;
  }
  if (FromAccountID === ToAccountID) {
    res.status(400).json({ message: 'Cannot transfer to the same account' });
    return;
  }

  const fromAccount = await Account.findByPk(FromAccountID);
  if (!fromAccount) {
    res.status(404).json({ message: 'Source account not found' });
    return;
  }
  if (req.dbUser!.Role !== 'admin' && fromAccount.UserID !== req.dbUser!.UserID) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const toAccount = await Account.findByPk(ToAccountID);
  if (!toAccount) {
    res.status(404).json({ message: 'Destination account not found' });
    return;
  }

  const currentBalance = parseFloat(fromAccount.Balance.toString());
  if (currentBalance < amount) {
    res.status(400).json({ message: 'Insufficient funds' });
    return;
  }

  const t = await sequelize.transaction();
  try {
    const transfer = await Transfer.create(
      { FromAccountID, ToAccountID, Amount: amount },
      { transaction: t }
    );
    await fromAccount.decrement('Balance', { by: amount, transaction: t });
    await toAccount.increment('Balance', { by: amount, transaction: t });
    await Transaction.create(
      { AccountID: FromAccountID, Amount: amount, TransactionType: 'transfer', TransferID: transfer.TransferID },
      { transaction: t }
    );
    await Transaction.create(
      { AccountID: ToAccountID, Amount: amount, TransactionType: 'transfer', TransferID: transfer.TransferID },
      { transaction: t }
    );
    await t.commit();
    res.status(201).json(transfer);
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: 'Error processing transfer', error });
  }
});

// GET a single transaction by ID
router.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const transaction = await Transaction.findByPk(id);
    if (!transaction) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }
    if (req.dbUser!.Role !== 'admin') {
      const accountIds = await getUserAccountIds(req.dbUser!.UserID);
      if (!accountIds.includes(transaction.AccountID)) {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }
    }
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transaction', error });
  }
});

export default router;

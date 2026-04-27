import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../db';
import Account from '../models/Account';
import User from '../models/User';
import Transaction from '../models/Transaction';
import Transfer from '../models/Transfer';
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

// GET all accounts
router.get('/', async (req: Request, res: Response) => {
  try {
    const currentUser = await resolveCurrentUser(req, res);
    if (!currentUser) return;

    const authReq = req as AuthenticatedRequest;
    const admin = isAdminUser(currentUser.Role, authReq.auth?.tokenRole);
    const where = admin ? undefined : { UserID: currentUser.UserID };
    const accounts = await Account.findAll({ where });

    res.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ message: 'Error fetching accounts', error: errorMessage(error) });
  }
});

// GET accounts for a specific user (used by transfers)
router.get('/user/:userId', async (req: Request<{ userId: string }>, res: Response) => {
  try {
    const currentUser = await resolveCurrentUser(req, res);
    if (!currentUser) return;

    const userId = parseInt(req.params.userId, 10);

    if (Number.isNaN(userId)) {
      res.status(400).json({ message: 'Invalid user ID' });
      return;
    }

    const targetUser = await User.findByPk(userId);
    if (!targetUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const accounts = await Account.findAll({
      where: { UserID: userId },
      attributes: ['AccountID', 'AccountType'],
    });

    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user accounts', error: errorMessage(error) });
  }
});

// GET a single account by ID
router.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const currentUser = await resolveCurrentUser(req, res);
    if (!currentUser) return;

    const authReq = req as AuthenticatedRequest;
    const admin = isAdminUser(currentUser.Role, authReq.auth?.tokenRole);
    const id = parseInt(req.params.id, 10);
    const account = await Account.findOne({
      where: admin ? { AccountID: id } : { AccountID: id, UserID: currentUser.UserID },
    });

    if (account) {
      res.json(account);
    } else {
      res.status(404).json({ message: 'Account not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching account', error: errorMessage(error) });
  }
});

// POST a new account
router.post('/', async (req: Request, res: Response) => {
  try {
    const currentUser = await resolveCurrentUser(req, res);
    if (!currentUser) return;

    const authReq = req as AuthenticatedRequest;
    const admin = isAdminUser(currentUser.Role, authReq.auth?.tokenRole);
    let targetUserId = currentUser.UserID;

    if (admin && req.body.UserID !== undefined) {
      const requestedUserId = Number(req.body.UserID);
      const targetUser = await User.findByPk(requestedUserId);
      if (!targetUser) {
        res.status(400).json({ message: `User with ID ${requestedUserId} does not exist` });
        return;
      }
      targetUserId = targetUser.UserID;
    }

    const accountPayload = {
      UserID: targetUserId,
      AccountType: req.body.AccountType,
      Balance: req.body.Balance,
    };

    if (!accountPayload.AccountType || accountPayload.Balance === undefined) {
      res.status(400).json({ message: 'AccountType and Balance are required' });
      return;
    }

    const newAccount = await Account.create(accountPayload);
    res.status(201).json(newAccount);
  } catch (error) {
    res.status(500).json({ message: 'Error creating account', error: errorMessage(error) });
  }
});

// PUT to update an account
router.put('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const currentUser = await resolveCurrentUser(req, res);
    if (!currentUser) return;

    const authReq = req as AuthenticatedRequest;
    const admin = isAdminUser(currentUser.Role, authReq.auth?.tokenRole);
    const id = parseInt(req.params.id, 10);
    const updatePayload = admin ? req.body : { ...req.body, UserID: currentUser.UserID };

    const [updated] = await Account.update(updatePayload, {
      where: admin ? { AccountID: id } : { AccountID: id, UserID: currentUser.UserID }
    });

    if (updated) {
      const updatedAccount = await Account.findOne({
        where: admin ? { AccountID: id } : { AccountID: id, UserID: currentUser.UserID },
      });
      res.status(200).json(updatedAccount);
    } else {
      res.status(404).json({ message: 'Account not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating account', error: errorMessage(error) });
  }
});

// DELETE an account
router.delete('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const currentUser = await resolveCurrentUser(req, res);
    if (!currentUser) return;

    const authReq = req as AuthenticatedRequest;
    const admin = isAdminUser(currentUser.Role, authReq.auth?.tokenRole);
    const id = parseInt(req.params.id, 10);

    const accountWhere = admin ? { AccountID: id } : { AccountID: id, UserID: currentUser.UserID };
    const account = await Account.findOne({ where: accountWhere });

    if (!account) {
      res.status(404).json({ message: 'Account not found' });
      return;
    }

    await sequelize.transaction(async transaction => {
      const relatedTransfers = await Transfer.findAll({
        where: {
          [Op.or]: [{ FromAccountID: id }, { ToAccountID: id }],
        },
        transaction,
      });

      for (const transfer of relatedTransfers) {
        const survivingTransaction = await Transaction.findOne({
          where: {
            TransferID: transfer.TransferID,
            AccountID: { [Op.ne]: id },
          },
          transaction,
        });

        if (survivingTransaction) {
          const updatedType = survivingTransaction.AccountID === transfer.FromAccountID ? 'withdrawal' : 'deposit';

          await survivingTransaction.update(
            {
              TransactionType: updatedType,
              TransferID: null,
            },
            { transaction }
          );
        }
      }

      await Transaction.destroy({
        where: { AccountID: id },
        transaction,
      });

      if (relatedTransfers.length > 0) {
        await Transfer.destroy({
          where: { TransferID: { [Op.in]: relatedTransfers.map(transfer => transfer.TransferID) } },
          transaction,
        });
      }

      await Account.destroy({
        where: accountWhere,
        transaction,
      });
    });

    res.status(204).send();
  } catch (error) {
    const errorText = errorMessage(error).toLowerCase();

    const isForeignKeyViolation =
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error as { name?: string }).name === 'SequelizeForeignKeyConstraintError';

    const hasPgForeignKeyCode =
      typeof error === 'object' &&
      error !== null &&
      (('original' in error &&
        typeof (error as { original?: { code?: string } }).original?.code === 'string' &&
        (error as { original?: { code?: string } }).original?.code === '23503') ||
        ('parent' in error &&
          typeof (error as { parent?: { code?: string } }).parent?.code === 'string' &&
          (error as { parent?: { code?: string } }).parent?.code === '23503'));

    const messageShowsForeignKeyViolation = errorText.includes('violates foreign key constraint');

    if (isForeignKeyViolation || hasPgForeignKeyCode || messageShowsForeignKeyViolation) {
      res.status(409).json({
        message: 'Cannot delete account because related transfers or transactions exist.',
        error: errorMessage(error),
      });
      return;
    }

    res.status(500).json({ message: 'Error deleting account', error: errorMessage(error) });
  }
});

export default router;

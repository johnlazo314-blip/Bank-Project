import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import Transaction from '../models/Transaction';
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

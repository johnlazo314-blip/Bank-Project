import { Router, Request, Response } from 'express';
import Account from '../models/Account';
import User from '../models/User';

const router = Router();

// GET all accounts — admin sees all, regular user sees only their own
router.get('/', async (req: Request, res: Response) => {
  try {
    if (req.dbUser!.Role === 'admin') {
      const accounts = await Account.findAll();
      res.json(accounts);
    } else {
      const accounts = await Account.findAll({ where: { UserID: req.dbUser!.UserID } });
      res.json(accounts);
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching accounts', error });
  }
});

// GET a single account by ID
router.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const account = await Account.findByPk(id);
    if (!account) {
      res.status(404).json({ message: 'Account not found' });
      return;
    }
    if (req.dbUser!.Role !== 'admin' && account.UserID !== req.dbUser!.UserID) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    res.json(account);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching account', error });
  }
});

// POST a new account — regular users can only create for themselves
router.post('/', async (req: Request, res: Response) => {
  try {
    const { UserID } = req.body;
    if (req.dbUser!.Role !== 'admin' && UserID !== req.dbUser!.UserID) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    const user = await User.findByPk(UserID);
    if (!user) {
      res.status(400).json({ message: `User with ID ${UserID} does not exist` });
      return;
    }
    const newAccount = await Account.create(req.body);
    res.status(201).json(newAccount);
  } catch (error) {
    res.status(500).json({ message: 'Error creating account', error });
  }
});

// PUT to update an account
router.put('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const account = await Account.findByPk(id);
    if (!account) {
      res.status(404).json({ message: 'Account not found' });
      return;
    }
    if (req.dbUser!.Role !== 'admin' && account.UserID !== req.dbUser!.UserID) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    // Prevent non-admins from reassigning the account to another user
    const { UserID: _stripped, ...safeBody } = req.body;
    const updatePayload = req.dbUser!.Role === 'admin' ? req.body : safeBody;
    const [updated] = await Account.update(updatePayload, { where: { AccountID: id } });
    if (updated) {
      const updatedAccount = await Account.findByPk(id);
      res.status(200).json(updatedAccount);
    } else {
      res.status(404).json({ message: 'Account not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating account', error });
  }
});

// DELETE an account
router.delete('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const account = await Account.findByPk(id);
    if (!account) {
      res.status(404).json({ message: 'Account not found' });
      return;
    }
    if (req.dbUser!.Role !== 'admin' && account.UserID !== req.dbUser!.UserID) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    await Account.destroy({ where: { AccountID: id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting account', error });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import Account from '../models/Account';
import User from '../models/User';

const router = Router();

// GET all accounts
router.get('/', async (req: Request, res: Response) => {
  try {
    const accounts = await Account.findAll();
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching accounts', error });
  }
});

// GET a single account by ID
router.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const account = await Account.findByPk(id);
    if (account) {
      res.json(account);
    } else {
      res.status(404).json({ message: 'Account not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching account', error });
  }
});

// POST a new account
router.post('/', async (req: Request, res: Response) => {
  try {
    const { UserID } = req.body;
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
    const [updated] = await Account.update(req.body, {
      where: { AccountID: id }
    });
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
    const deleted = await Account.destroy({ where: { AccountID: id } });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'Account not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting account', error });
  }
});

export default router;

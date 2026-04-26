import { Router, Request, Response } from 'express';
import User from '../models/User';

const router = Router();

// GET the authenticated user's own record
router.get('/me', (req: Request, res: Response) => {
  res.json(req.dbUser);
});

// GET all users — admin sees all, regular user sees only themselves
router.get('/', async (req: Request, res: Response) => {
  try {
    if (req.dbUser!.Role === 'admin') {
      const users = await User.findAll({
        attributes: ['UserID', 'FirstName', 'LastName', 'Email', 'Role']
      });
      res.json(users);
    } else {
      res.json([req.dbUser]);
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error });
  }
});

// GET a single user by ID
router.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (req.dbUser!.Role !== 'admin' && req.dbUser!.UserID !== id) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    const user = await User.findByPk(id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error });
  }
});

// POST a new user — admin only
router.post('/', async (req: Request, res: Response) => {
  try {
    if (req.dbUser!.Role !== 'admin') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    const newUser = await User.create(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error });
  }
});

// PUT to update a user
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (req.dbUser!.Role !== 'admin' && req.dbUser!.UserID !== id) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    // Prevent non-admins from changing their own Role
    const { Role: _stripped, ...safeBody } = req.body;
    const updatePayload = req.dbUser!.Role === 'admin' ? req.body : safeBody;
    const [updated] = await User.update(updatePayload, { where: { UserID: id } });
    if (updated) {
      const updatedUser = await User.findByPk(id);
      res.status(200).json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error });
  }
});

// DELETE a user — admin only
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (req.dbUser!.Role !== 'admin') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    const id = parseInt(req.params.id as string, 10);
    const deleted = await User.destroy({ where: { UserID: id } });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error });
  }
});

export default router;

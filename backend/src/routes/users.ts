import { Router, Request, Response } from 'express';
import User from '../models/User';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';

const router = Router();

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown error';

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const email = authReq.auth?.email;

    if (!email) {
      res.status(401).json({ message: 'Missing authenticated user email' });
      return;
    }

    const user = await User.findOne({
      where: { Email: email },
      attributes: ['UserID', 'FirstName', 'LastName', 'Email', 'Role'],
    });

    if (!user) {
      res.status(404).json({ message: `No user found for email ${email}` });
      return;
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching authenticated user', error: errorMessage(error) });
  }
});

// GET all users
router.get('/', async (_req: Request, res: Response) => {
  try {
    const users = await User.findAll({
      attributes: ['UserID', 'FirstName', 'LastName', 'Email', 'Role']
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error); // Log the full error to the backend console
    res.status(500).json({ message: 'Error fetching users', error: errorMessage(error) });
  }
});

// GET a single user by ID
router.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const user = await User.findByPk(id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: errorMessage(error) });
  }
});

// POST a new user
router.post('/', async (req: Request, res: Response) => {
  try {
    const newUser = await User.create(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: errorMessage(error) });
  }
});

// PUT to update a user
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const [updated] = await User.update(req.body, {
      where: { UserID: id }
    });
    if (updated) {
      const updatedUser = await User.findByPk(id);
      res.status(200).json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: errorMessage(error) });
  }
});

// DELETE a user
router.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  try {
    const deleted = await User.destroy({
      where: { UserID: id }
    });
    if (deleted) {
      res.status(204).send(); // No content
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: errorMessage(error) });
  }
});

export default router;

import { Request, Response, NextFunction } from 'express';
import User from '../models/User';

export const requireDbUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const email = (req as any).auth?.email;

  if (!email) {
    res.status(401).json({ message: 'Email claim missing from token' });
    return;
  }

  let user = await User.findOne({ where: { Email: email } });

  if (!user) {
    const fullName: string = (req as any).auth?.name ?? '';
    const [firstName, ...rest] = fullName.trim().split(' ');
    user = await User.create({
      FirstName: firstName || email.split('@')[0],
      LastName: rest.join(' ') || '-',
      Email: email,
      Role: 'user',
    });
  }

  req.dbUser = user;
  next();
};

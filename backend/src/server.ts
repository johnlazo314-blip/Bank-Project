import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDb } from './db';
import { checkJwt } from './middleware/auth';
import { requireDbUser } from './middleware/requireDbUser';
import userRoutes from './routes/users';
import accountRoutes from './routes/accounts';
import transactionRoutes from './routes/transactions';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/users', checkJwt, requireDbUser, userRoutes);
app.use('/api/accounts', checkJwt, requireDbUser, accountRoutes);
app.use('/api/transactions', checkJwt, requireDbUser, transactionRoutes);

app.get('/', (_req: Request, res: Response) => {
  res.send('NorthBank API is running!');
});

const startServer = async () => {
  try {
    await connectDb();
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

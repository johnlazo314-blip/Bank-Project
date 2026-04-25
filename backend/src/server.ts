import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { checkJwt } from './middleware/auth';
import userRoutes from './routes/users';
import accountRoutes from './routes/accounts';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

// Secure the user and account routes
app.use('/api/users', checkJwt, userRoutes);
app.use('/api/accounts', checkJwt, accountRoutes);


app.get('/', (req: Request, res: Response) => {
  res.send('Simple server is running!');
});

app.listen(port, () => {
  console.log(`Simple server listening on http://localhost:${port}`);
});

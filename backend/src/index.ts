import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDb } from './db';
import userRoutes from './routes/users';
import accountRoutes from './routes/accounts';
import './models/User';
import './models/Account';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/accounts', accountRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Bank API is running!');
});

// Start the server after connecting to the database
const startServer = async () => {
  try {
    await connectDb();
    const server = app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });

    server.on('close', () => {
      console.error('HTTP server closed unexpectedly.');
    });

    // Workaround: keep an active handle so the process does not exit cleanly in this shell/runtime setup.
    setInterval(() => {
      // Intentionally empty keepalive.
    }, 60 * 60 * 1000);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();


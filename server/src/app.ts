import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error.middleware.js';
import apiRoutes from './routes/index.js';

const app = express();

const allowedOrigins = [
  env.CLIENT_URL,
  /^https:\/\/drive-duplicate-scanner.*\.vercel\.app$/ 
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(o => typeof o === 'string' ? o === origin : o.test(origin))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.get('/', (_req, res) => {
  res.json({ message: 'Drive Duplicate Scanner API', status: 'Healthy' });
});

app.use('/api', apiRoutes);
app.use(errorHandler);

export default app;
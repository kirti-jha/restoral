import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth.routes';
import branchxRoutes from './routes/branchx.routes';
import userRoutes from './routes/user.routes';
import serviceRoutes from './routes/service.routes';
import commissionRoutes from './routes/commission.routes';
import reportRoutes from './routes/report.routes';
import notificationRoutes from './routes/notification.routes';
import { startBranchxPayoutSyncJob } from './jobs/branchxPayoutSync';
import { getUploadRoot } from './lib/uploads';
import { ensureRuntimeSchema } from './services/runtimeSchema.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://pay-in-pay-out.vercel.app',
  'https://rentsoftpro.com',
  'https://www.rentsoftpro.com',
];
const configuredAllowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set([...defaultAllowedOrigins, ...configuredAllowedOrigins]);

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  if (allowedOrigins.has(origin)) return true;
  if (/\.vercel\.app$/.test(origin)) return true;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  return false;
}

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;

  if (requestOrigin && isAllowedOrigin(requestOrigin)) {
    res.header('Access-Control-Allow-Origin', requestOrigin);
  }

  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(getUploadRoot()));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/commissions', commissionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);

app.use('/api/payment/v2/payout/callback', branchxRoutes);

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'payverse API is running', timestamp: new Date() });
});

// Serve Frontend static files only in non-production
if (process.env.NODE_ENV !== 'production') {
  const frontendDistPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDistPath));
  
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
        if (err) next();
      });
    } else {
      next();
    }
  });
}

// For Vercel, we export the app. For local development, we call listen.
const bootServer = async () => {
  try {
    if (process.env.NODE_ENV !== 'production') {
      await ensureRuntimeSchema();
      // Only start background jobs in local development
      startBranchxPayoutSyncJob();
    }
  } catch (error) {
    console.error('Server initialization error:', error);
  }
};

if (process.env.NODE_ENV !== 'production') {
  bootServer();
  app.listen(PORT, () => {
    console.log(`✅ payverse server running on http://localhost:${PORT}`);
  });
} else {
  console.log('🚀 Serverless function initialized');
}

export default app;

import express from 'express';
import cors from 'cors';
import { incidentRoutes } from './modules/incidents';
import { investigationLegacyRoutes, investigationRoutes } from './modules/investigations';
import { correctiveActionRoutes } from './modules/corrective-actions';
import { authRoutes } from './modules/auth';
import { analyticsRoutes } from './modules/analytics';
import { userRoutes } from './modules/users';
import { globalErrorHandler } from './middlewares/errorHandler.middleware'; // Import the handler
import { departmentRoutes } from './modules/departments';
import { adminRoutes } from './modules/admin';
import { managerRoutes } from './modules/manager';

const app = express();

/*
==========================================
Middleware
==========================================
*/

// Allow requests from the React frontend
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);

// Parse JSON request body
app.use(express.json());

/*
==========================================
Routes
==========================================
*/

// Route mounting
app.use('/api/incidents', investigationLegacyRoutes);
app.use('/api/v1/incidents', investigationLegacyRoutes);
app.use('/api/investigations', investigationRoutes);
app.use('/api/incidents', correctiveActionRoutes);
app.use('/api/v1/incidents', correctiveActionRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/v1/incidents', incidentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/manager', managerRoutes);

// Health Check Routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'KAIROS Backend is Running',
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'KAIROS HIMS Backend is running' });
});

// IMPORTANT: The Global Error Handler MUST be the last middleware!
// If any route or middleware above calls next(error), it will come here.
app.use(globalErrorHandler);

export default app;

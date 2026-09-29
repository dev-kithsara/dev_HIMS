import { Router } from 'express';
import { login } from './auth.controller';

const router = Router();

// Route: POST /api/auth/login
// Description: Authenticate user and get token
// Access: Public (Anyone can try to login)
router.post('/login', login);

export default router;

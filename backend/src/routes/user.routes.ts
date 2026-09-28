// backend/src/routes/user.routes.ts

import { Router } from 'express';
import { getDepartmentUsers, changeUserRole, getUsersByRole } from '../controllers/user.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';

const router = Router();

// Apply authentication to all routes in this file
router.use(authenticate);

// Route: GET /api/users/department
// Description: Get all users in the logged-in manager's department
// Access: MANAGER only
router.get('/department', authorizeRoles('MANAGER'), getDepartmentUsers);

// Route: PATCH /api/users/:id/role
// Description: Change a user's role (Promote/Demote)
// Access: MANAGER only
router.patch('/:id/role', authorizeRoles('MANAGER'), changeUserRole);

// Route: GET /api/users/role/:role
// Description: List all users with a given role
// Access: MANAGER / ADMIN
router.get('/role/:role', authorizeRoles('MANAGER', 'ADMIN'), getUsersByRole);

export default router;

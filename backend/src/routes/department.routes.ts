import { Router } from 'express';
import { getAllDepartments } from '../controllers/department.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, getAllDepartments);

export default router;
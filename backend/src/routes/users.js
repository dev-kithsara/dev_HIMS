const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

router.use(authenticate);

// List users (admin sees all; department_manager sees investigators + action_owners + own dept)
router.get('/', authorize('admin', 'department_manager'), async (req, res, next) => {
  try {
    let where = {};
    if (req.user.role === 'department_manager') {
      where = {
        OR: [
          { role: 'investigator' },
          { role: 'action_owner' },
          ...(req.user.department ? [{ department: req.user.department }] : [])
        ]
      };
    }
    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true, department: true, isActive: true, createdAt: true }
    });
    res.json({ data: users });
  } catch (err) { next(err); }
});

// List only investigators (for manager assignment)
router.get('/investigators', authorize('admin', 'department_manager'), async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'investigator', isActive: true },
      select: { id: true, name: true, email: true, role: true }
    });
    res.json({ data: users });
  } catch (err) { next(err); }
});

// List only action owners (for manager assignment)
router.get('/action-owners', authorize('admin', 'department_manager'), async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'action_owner', isActive: true },
      select: { id: true, name: true, email: true, role: true }
    });
    res.json({ data: users });
  } catch (err) { next(err); }
});

// Update own profile
router.put('/me', async (req, res, next) => {
  try {
    const schema  = z.object({ name: z.string().min(2).optional(), email: z.string().email().optional() });
    const data    = schema.parse(req.body);
    const updated = await prisma.user.update({ where: { id: req.user.id }, data });
    const { password: _, ...safe } = updated;
    res.json({ data: safe });
  } catch (err) { next(err); }
});

// Change password
router.put('/me/password', async (req, res, next) => {
  try {
    const schema = z.object({
      currentPassword: z.string(),
      newPassword:     z.string().min(6)
    });
    const { currentPassword, newPassword } = schema.parse(req.body);
    const valid = await bcrypt.compare(currentPassword, req.user.password);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
    res.json({ message: 'Password updated successfully' });
  } catch (err) { next(err); }
});

// Create user (admin only)
router.post('/', authorize('admin'), async (req, res, next) => {
  try {
    const schema = z.object({
      name:       z.string().min(2),
      email:      z.string().email(),
      password:   z.string().min(6),
      role:       z.enum(['admin', 'department_manager', 'investigator', 'action_owner', 'staff']),
      department: z.string().optional()
    });
    const data   = schema.parse(req.body);
    const hashed = await bcrypt.hash(data.password, 10);
    const user   = await prisma.user.create({ data: { ...data, password: hashed } });
    const { password: _, ...safe } = user;
    res.status(201).json({ data: safe });
  } catch (err) { next(err); }
});

// Update user role/department (admin only)
router.put('/:id/role', authorize('admin'), async (req, res, next) => {
  try {
    const schema = z.object({
      role:       z.enum(['admin', 'department_manager', 'investigator', 'action_owner', 'staff']),
      department: z.string().optional().nullable()
    });
    const { role, department } = schema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data:  { role, department: department ?? null }
    });
    const { password: _, ...safe } = user;
    res.json({ data: safe });
  } catch (err) { next(err); }
});

// Toggle user active status (admin only)
router.put('/:id/toggle-active', authorize('admin'), async (req, res, next) => {
  try {
    const current = await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!current) return res.status(404).json({ error: 'User not found' });
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data:  { isActive: !current.isActive }
    });
    const { password: _, ...safe } = user;
    res.json({ data: safe });
  } catch (err) { next(err); }
});

module.exports = router;

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const baseWhere = { deletedAt: null };

    if (req.user.role === 'department_manager') {
      if (req.user.department) baseWhere.department = req.user.department;
    } else if (req.user.role === 'investigator') {
      baseWhere.investigation = { investigatedBy: req.user.id };
    } else if (req.user.role === 'action_owner') {
      baseWhere.actions = { some: { assignedTo: req.user.id } };
    } else if (req.user.role === 'staff') {
      baseWhere.reportedBy = req.user.id;
    }
    // admin sees all

    const promises = [
      prisma.incident.count({ where: baseWhere }),
      prisma.incident.count({ where: { ...baseWhere, status: 'OPEN'          } }),
      prisma.incident.count({ where: { ...baseWhere, status: 'ACCEPTED'      } }),
      prisma.incident.count({ where: { ...baseWhere, status: 'INVESTIGATING' } }),
      prisma.incident.count({ where: { ...baseWhere, status: 'PENDING_ACTION'} }),
      prisma.incident.count({ where: { ...baseWhere, status: 'UNDER_REVIEW'  } }),
      prisma.incident.count({ where: { ...baseWhere, status: 'CLOSED'        } }),
      prisma.incident.count({ where: { ...baseWhere, status: 'REJECTED'      } }),
      prisma.incident.groupBy({
        by: ['severity'],
        where: baseWhere,
        _count: { severity: true }
      }),
      prisma.incident.groupBy({
        by: ['category'],
        where: { ...baseWhere, category: { not: null } },
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } },
        take: 5
      }),
      prisma.incident.findMany({
        where:   baseWhere,
        orderBy: { createdAt: 'desc' },
        take:    5,
        select:  { id: true, title: true, severity: true, status: true, createdAt: true, isRejected: true, rejectionComment: true }
      })
    ];

    let overdueActionsPromise  = Promise.resolve([]);
    let upcomingActionsPromise = Promise.resolve([]);

    if (req.user.role === 'investigator' || req.user.role === 'action_owner') {
      const now = new Date();
      overdueActionsPromise = prisma.incidentAction.findMany({
        where: {
          assignedTo: req.user.id,
          status:     { not: 'COMPLETED' },
          dueDate:    { lt: now }
        },
        include: { incident: { select: { id: true, title: true } } },
        orderBy: { dueDate: 'asc' }
      });
      upcomingActionsPromise = prisma.incidentAction.findMany({
        where: {
          assignedTo: req.user.id,
          status:     { not: 'COMPLETED' },
          dueDate:    { gte: now }
        },
        include: { incident: { select: { id: true, title: true } } },
        orderBy: { dueDate: 'asc' },
        take: 5
      });
    }

    promises.push(overdueActionsPromise, upcomingActionsPromise);

    const [
      total, open, accepted, investigating, pendingAction, underReview, closed, rejected,
      bySeverity, byCategory, recent,
      overdueActions, upcomingActions
    ] = await Promise.all(promises);

    const severityMap = Object.fromEntries(
      bySeverity.map(s => [s.severity, s._count.severity])
    );

    const isActionRole = req.user.role === 'investigator' || req.user.role === 'action_owner';

    res.json({
      data: {
        total, open, accepted, investigating, pendingAction, underReview, closed, rejected,
        // legacy field for backward compatibility
        inProgress: investigating,
        bySeverity: {
          LOW:      severityMap.LOW      || 0,
          MEDIUM:   severityMap.MEDIUM   || 0,
          HIGH:     severityMap.HIGH     || 0,
          CRITICAL: severityMap.CRITICAL || 0
        },
        topCategories:   byCategory.map(c => ({ category: c.category, count: c._count.category })),
        recentIncidents: recent,
        overdueActions:  isActionRole ? overdueActions  : undefined,
        upcomingActions: isActionRole ? upcomingActions : undefined
      }
    });
  } catch (err) { next(err); }
});

module.exports = router;

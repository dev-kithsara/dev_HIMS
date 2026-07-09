const { PrismaClient } = require('@prisma/client');
const { z }   = require('zod');
const axios   = require('axios');
const prisma  = new PrismaClient();

// ── Schemas ────────────────────────────────────────────────────────────────
const incidentSchema = z.object({
  title:       z.string().min(5).max(255),
  description: z.string().min(10),
  severity:    z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  category:    z.string().optional(),
  location:    z.string().optional(),
  department:  z.string().optional(),
});

const actionSchema = z.object({
  actionTaken: z.string().min(5),
  assignedTo:  z.number().int().optional(),
  priority:    z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
  dueDate:     z.string().optional(),
  status:      z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE']).optional().default('PENDING')
});

const investigationSchema = z.object({
  findings:          z.string().optional(),
  evidence:          z.string().optional(),
  evidenceFiles:     z.array(z.string()).optional(),
  investigatedBy:    z.number().int().optional(),
  investigationDate: z.string().optional()
});

const rootCauseSchema = z.object({
  rootCauseCategory:   z.enum(['Human Error', 'System/Technology Failure', 'Process/Protocol Gap', 'Communication Failure', 'Equipment/Device Failure', 'Environmental Factor', 'Training Deficiency', 'Unknown']),
  description:         z.string().min(10),
  contributingFactors: z.string().optional(),
  causalChain:         z.string().optional()
});

const controlSchema = z.object({
  controlType:        z.enum(['Preventive', 'Detective', 'Corrective']),
  description:        z.string().min(5),
  owner:              z.number().int().optional(),
  implementationDate: z.string().optional(),
  status:             z.enum(['PLANNED', 'IN_PROGRESS', 'IMPLEMENTED', 'VERIFIED']).optional().default('PLANNED')
});

const reviewSchema = z.object({
  reviewerId:          z.number().int().optional(),
  reviewNotes:         z.string().optional(),
  effectivenessRating: z.number().int().min(1).max(5).optional(),
  reviewDate:          z.string().optional()
});

const closureSchema = z.object({
  closureSummary: z.string().min(10),
  lessonsLearned: z.string().optional(),
  closedBy:       z.number().int().optional(),
  closureDate:    z.string()
});

// ── Helpers ────────────────────────────────────────────────────────────────
const getIncidentOrFail = async (id) => {
  const inc = await prisma.incident.findFirst({
    where: { id: parseInt(id), deletedAt: null }
  });
  if (!inc) {
    const err = new Error('Incident not found');
    err.status = 404;
    throw err;
  }
  return inc;
};

const notifyAI = async (incidentId) => {
  try {
    await axios.post(
      `${process.env.AI_SERVICE_URL}/api/ai/process`,
      { incident_id: incidentId },
      { headers: { 'X-API-Key': process.env.AI_API_KEY }, timeout: 3000 }
    );
  } catch (e) {
    console.warn('AI notification failed (non-fatal):', e.message);
  }
};

// ── Role-based where clause builder ────────────────────────────────────────
const buildRoleWhere = (user) => {
  const where = { deletedAt: null };
  if (user.role === 'department_manager') {
    if (user.department) where.department = user.department;
  } else if (user.role === 'investigator') {
    where.investigation = { investigatedBy: user.id };
  } else if (user.role === 'action_owner') {
    where.actions = { some: { assignedTo: user.id } };
  } else if (user.role === 'staff') {
    where.reportedBy = user.id;
  }
  // admin sees all — no extra filter
  return where;
};

// ── List ───────────────────────────────────────────────────────────────────
exports.list = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status, severity, department, category } = req.query;
    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const where = buildRoleWhere(req.user);

    if (status)     where.status     = status;
    if (severity)   where.severity   = severity;
    if (department && req.user.role === 'admin') where.department = department;
    if (category)   where.category   = category;
    if (search) {
      where.OR = [
        { title:       { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: { reporter: { select: { id: true, name: true, email: true } } }
      }),
      prisma.incident.count({ where })
    ]);

    res.json({
      data: incidents,
      meta: {
        page:  parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) { next(err); }
};

exports.listLessonsLearned = async (req, res, next) => {
  try {
    const { search } = req.query;
    const where = {
      status: 'CLOSED',
      deletedAt: null,
      closure: {
        is: {
          lessonsLearned: { not: '' }
        }
      }
    };

    if (search) {
      where.OR = [
        { title:       { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { closure: { is: { lessonsLearned: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    const incidents = await prisma.incident.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        closure:   true,
        rootCause: true,
        reporter:  { select: { id: true, name: true } }
      }
    });

    res.json({ data: incidents });
  } catch (err) { next(err); }
};

// ── Create ─────────────────────────────────────────────────────────────────
exports.create = async (req, res, next) => {
  try {
    const incidentData = incidentSchema.parse(req.body);
    const incident = await prisma.incident.create({
      data: { ...incidentData, reportedBy: req.user.id, status: 'OPEN' },
      include: { reporter: { select: { id: true, name: true } } }
    });
    // Kick off AI embedding immediately (fire-and-forget)
    notifyAI(incident.id);
    res.status(201).json({ data: incident });
  } catch (err) { next(err); }
};

// ── Get by ID ──────────────────────────────────────────────────────────────
exports.getById = async (req, res, next) => {
  try {
    await getIncidentOrFail(req.params.id);
    const incident = await prisma.incident.findFirst({
      where: { id: parseInt(req.params.id), deletedAt: null },
      include: {
        reporter:      { select: { id: true, name: true, email: true } },
        actions:       { include: { assignee: { select: { id: true, name: true } } } },
        investigation: { include: { investigator: { select: { id: true, name: true } } } },
        rootCause:     true,
        controls:      { include: { controlOwner: { select: { id: true, name: true } } } },
        review:        { include: { reviewer: { select: { id: true, name: true } } } },
        closure:       { include: { closer: { select: { id: true, name: true } } } }
      }
    });
    res.json({ data: incident });
  } catch (err) { next(err); }
};

// ── Update ─────────────────────────────────────────────────────────────────
exports.update = async (req, res, next) => {
  try {
    const inc  = await getIncidentOrFail(req.params.id);
    if (inc.status === 'CLOSED') {
      return res.status(422).json({ error: 'Cannot edit a closed incident' });
    }
    const data    = incidentSchema.partial().parse(req.body);
    const updated = await prisma.incident.update({ where: { id: inc.id }, data: { ...data, aiProcessed: false } });
    notifyAI(inc.id);
    res.json({ data: updated });
  } catch (err) { next(err); }
};

// ── Soft Delete ────────────────────────────────────────────────────────────
exports.softDelete = async (req, res, next) => {
  try {
    await getIncidentOrFail(req.params.id);
    await prisma.incident.update({
      where: { id: parseInt(req.params.id) },
      data:  { deletedAt: new Date() }
    });
    res.json({ message: 'Incident deleted successfully' });
  } catch (err) { next(err); }
};

// ── Export CSV ─────────────────────────────────────────────────────────────
exports.exportCsv = async (req, res, next) => {
  try {
    const where = buildRoleWhere(req.user);
    const incidents = await prisma.incident.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { reporter: { select: { name: true } } }
    });
    const headers = ['ID', 'Title', 'Severity', 'Status', 'Category', 'Department', 'Reporter', 'Created At'];
    const rows = incidents.map(i => [
      i.id,
      `"${(i.title || '').replace(/"/g, '""')}"`,
      i.severity,
      i.status,
      i.category   || '',
      i.department || '',
      i.reporter?.name || '',
      i.createdAt.toISOString()
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=incidents.csv');
    res.send(csv);
  } catch (err) { next(err); }
};

// ── Actions ────────────────────────────────────────────────────────────────
exports.addAction = async (req, res, next) => {
  try {
    await getIncidentOrFail(req.params.id);
    const data   = actionSchema.parse(req.body);
    const action = await prisma.incidentAction.create({
      data: { ...data, incidentId: parseInt(req.params.id) }
    });
    res.status(201).json({ data: action });
  } catch (err) { next(err); }
};

exports.getActions = async (req, res, next) => {
  try {
    await getIncidentOrFail(req.params.id);
    const actions = await prisma.incidentAction.findMany({
      where:   { incidentId: parseInt(req.params.id) },
      include: { assignee: { select: { id: true, name: true } } }
    });
    res.json({ data: actions });
  } catch (err) { next(err); }
};

exports.updateAction = async (req, res, next) => {
  try {
    // action_owner can only update their own assigned actions
    const actionId = parseInt(req.params.aId);
    if (req.user.role === 'action_owner') {
      const action = await prisma.incidentAction.findUnique({ where: { id: actionId } });
      if (!action || action.assignedTo !== req.user.id) {
        return res.status(403).json({ error: 'You can only update actions assigned to you' });
      }
    }
    const data   = actionSchema.partial().parse(req.body);
    const action = await prisma.incidentAction.update({
      where: { id: actionId },
      data
    });
    res.json({ data: action });
  } catch (err) { next(err); }
};

// ── Investigation ──────────────────────────────────────────────────────────
exports.addInvestigation = async (req, res, next) => {
  try {
    await getIncidentOrFail(req.params.id);
    const data = investigationSchema.parse(req.body);
    const inv  = await prisma.incidentInvestigation.upsert({
      where:  { incidentId: parseInt(req.params.id) },
      update: data,
      create: { ...data, incidentId: parseInt(req.params.id) }
    });
    res.status(201).json({ data: inv });
  } catch (err) { next(err); }
};

exports.getInvestigation = async (req, res, next) => {
  try {
    const inv = await prisma.incidentInvestigation.findUnique({
      where: { incidentId: parseInt(req.params.id) }
    });
    res.json({ data: inv });
  } catch (err) { next(err); }
};

exports.uploadEvidence = async (req, res, next) => {
  try {
    await getIncidentOrFail(req.params.id);
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    const fileUrls = req.files.map(file => `/uploads/${file.filename}`);
    res.status(200).json({ data: fileUrls });
  } catch (err) { next(err); }
};

// ── Root Cause ─────────────────────────────────────────────────────────────
exports.addRootCause = async (req, res, next) => {
  try {
    await getIncidentOrFail(req.params.id);
    const data = rootCauseSchema.parse(req.body);
    const rc   = await prisma.incidentRootCause.upsert({
      where:  { incidentId: parseInt(req.params.id) },
      update: data,
      create: { ...data, incidentId: parseInt(req.params.id) }
    });
    res.status(201).json({ data: rc });
  } catch (err) { next(err); }
};

exports.getRootCause = async (req, res, next) => {
  try {
    const rc = await prisma.incidentRootCause.findUnique({
      where: { incidentId: parseInt(req.params.id) }
    });
    res.json({ data: rc });
  } catch (err) { next(err); }
};

// ── Controls ───────────────────────────────────────────────────────────────
exports.addControl = async (req, res, next) => {
  try {
    await getIncidentOrFail(req.params.id);
    const data = controlSchema.parse(req.body);
    const ctrl = await prisma.incidentControl.create({
      data: { ...data, incidentId: parseInt(req.params.id) }
    });
    res.status(201).json({ data: ctrl });
  } catch (err) { next(err); }
};

exports.getControls = async (req, res, next) => {
  try {
    const controls = await prisma.incidentControl.findMany({
      where: { incidentId: parseInt(req.params.id) }
    });
    res.json({ data: controls });
  } catch (err) { next(err); }
};

// ── Review ─────────────────────────────────────────────────────────────────
exports.addReview = async (req, res, next) => {
  try {
    await getIncidentOrFail(req.params.id);
    const data   = reviewSchema.parse(req.body);
    const review = await prisma.incidentReview.upsert({
      where:  { incidentId: parseInt(req.params.id) },
      update: data,
      create: { ...data, incidentId: parseInt(req.params.id) }
    });
    await prisma.incident.update({
      where: { id: parseInt(req.params.id) },
      data:  { status: 'UNDER_REVIEW' }
    });
    res.status(201).json({ data: review });
  } catch (err) { next(err); }
};

exports.getReview = async (req, res, next) => {
  try {
    const review = await prisma.incidentReview.findUnique({
      where: { incidentId: parseInt(req.params.id) }
    });
    res.json({ data: review });
  } catch (err) { next(err); }
};

// ── Close ──────────────────────────────────────────────────────────────────
exports.closeIncident = async (req, res, next) => {
  try {
    const inc = await getIncidentOrFail(req.params.id);
    if (inc.status === 'CLOSED') {
      return res.status(409).json({ error: 'Incident is already closed' });
    }
    const review = await prisma.incidentReview.findUnique({
      where: { incidentId: inc.id }
    });
    if (!review) {
      return res.status(422).json({ error: 'Cannot close: Review must be completed first' });
    }
    const data    = closureSchema.parse(req.body);
    const closure = await prisma.incidentClosure.upsert({
      where:  { incidentId: inc.id },
      update: data,
      create: { ...data, incidentId: inc.id }
    });
    await prisma.incident.update({
      where: { id: inc.id },
      data:  { status: 'CLOSED', aiProcessed: false }
    });
    notifyAI(inc.id);
    res.json({ data: closure, message: 'Incident closed successfully' });
  } catch (err) { next(err); }
};

exports.getClosure = async (req, res, next) => {
  try {
    const closure = await prisma.incidentClosure.findUnique({
      where: { incidentId: parseInt(req.params.id) }
    });
    res.json({ data: closure });
  } catch (err) { next(err); }
};

// ── Timeline ───────────────────────────────────────────────────────────────
exports.getTimeline = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const [inc, actions, inv, rc, controls, review, closure] = await Promise.all([
      prisma.incident.findFirst({ where: { id, deletedAt: null } }),
      prisma.incidentAction.findMany({ where: { incidentId: id }, orderBy: { createdAt: 'asc' } }),
      prisma.incidentInvestigation.findUnique({ where: { incidentId: id } }),
      prisma.incidentRootCause.findUnique({ where: { incidentId: id } }),
      prisma.incidentControl.findMany({ where: { incidentId: id }, orderBy: { createdAt: 'asc' } }),
      prisma.incidentReview.findUnique({ where: { incidentId: id } }),
      prisma.incidentClosure.findUnique({ where: { incidentId: id } })
    ]);

    const timeline = [];
    if (inc)     timeline.push({ type: 'CREATED',      date: inc.createdAt,      data: { title: inc.title, severity: inc.severity } });
    actions.forEach(a => timeline.push({ type: 'ACTION',       date: a.createdAt,      data: { action: a.actionTaken, status: a.status } }));
    if (inv)     timeline.push({ type: 'INVESTIGATION', date: inv.createdAt,     data: { findings: inv.findings } });
    if (rc)      timeline.push({ type: 'ROOT_CAUSE',   date: rc.createdAt,       data: { category: rc.rootCauseCategory } });
    controls.forEach(c => timeline.push({ type: 'CONTROL',     date: c.createdAt,      data: { type: c.controlType } }));
    if (review)  timeline.push({ type: 'REVIEWED',     date: review.createdAt,   data: { rating: review.effectivenessRating } });
    if (closure) timeline.push({ type: 'CLOSED',       date: closure.createdAt,  data: { summary: closure.closureSummary } });

    timeline.sort((a, b) => new Date(a.date) - new Date(b.date));
    res.json({ data: timeline });
  } catch (err) { next(err); }
};

// ── Analytics ─────────────────────────────────────────────────────────────
exports.getRootCauseAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate, department, severity } = req.query;

    const where = {
      deletedAt: null,
      rootCause: { isNot: null }
    };

    // department_manager can only see their dept
    if (req.user.role === 'department_manager' && req.user.department) {
      where.department = req.user.department;
    } else if (department) {
      where.department = department;
    }
    if (severity) where.severity = severity;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate)   where.createdAt.lte = new Date(endDate);
    }

    const incidents = await prisma.incident.findMany({
      where,
      include: { rootCause: true }
    });

    const totalIncidents = incidents.length;
    const categoriesMap = {};
    incidents.forEach(inc => {
      const cat = inc.rootCause.rootCauseCategory || 'Unknown';
      if (!categoriesMap[cat]) {
        categoriesMap[cat] = { category: cat, count: 0, subcategories: {}, incidents: [] };
      }
      categoriesMap[cat].count++;
      const sub = inc.category || 'Unassigned';
      if (!categoriesMap[cat].subcategories[sub]) categoriesMap[cat].subcategories[sub] = 0;
      categoriesMap[cat].subcategories[sub]++;
      categoriesMap[cat].incidents.push({
        id: inc.id, title: inc.title, severity: inc.severity,
        department: inc.department, category: inc.category, createdAt: inc.createdAt
      });
    });

    const distribution = Object.values(categoriesMap).map(item => {
      const subList = Object.entries(item.subcategories)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
      return {
        category: item.category,
        count: item.count,
        percentage: totalIncidents > 0 ? parseFloat(((item.count / totalIncidents) * 100).toFixed(1)) : 0,
        subcategories: subList,
        incidents: item.incidents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
      };
    }).sort((a, b) => b.count - a.count);

    const now = new Date();
    const ninetyDaysAgo    = new Date(now.getTime() - 90  * 24 * 60 * 60 * 1000);
    const oneEightyDaysAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    const allIncidentsForTrends = await prisma.incident.findMany({
      where: { deletedAt: null, rootCause: { isNot: null } },
      include: { rootCause: true }
    });

    const recentCounts = {};
    const priorCounts  = {};
    allIncidentsForTrends.forEach(inc => {
      const cat     = inc.rootCause.rootCauseCategory || 'Unknown';
      const created = new Date(inc.createdAt);
      if (created >= ninetyDaysAgo) {
        recentCounts[cat] = (recentCounts[cat] || 0) + 1;
      } else if (created >= oneEightyDaysAgo && created < ninetyDaysAgo) {
        priorCounts[cat] = (priorCounts[cat] || 0) + 1;
      }
    });

    let highestIncreaseCategory   = 'None';
    let highestIncreasePercentage = 0;
    Object.keys(recentCounts).forEach(cat => {
      const recent = recentCounts[cat] || 0;
      const prior  = priorCounts[cat]  || 0;
      let pct = 0;
      if (prior > 0)       pct = Math.round(((recent - prior) / prior) * 100);
      else if (recent > 0) pct = 100;
      if (pct > highestIncreasePercentage) {
        highestIncreasePercentage = pct;
        highestIncreaseCategory   = cat;
      }
    });

    const mostCommonRootCause = distribution.length > 0 ? distribution[0].category : 'None';
    res.json({
      data: {
        totalIncidents, mostCommonRootCause,
        highestIncrease: { category: highestIncreaseCategory, percentage: highestIncreasePercentage },
        distribution
      }
    });
  } catch (err) { next(err); }
};

exports.getControlEffectiveness = async (req, res, next) => {
  try {
    const incidents = await prisma.incident.findMany({
      where: { deletedAt: null, controls: { some: {} } },
      include: { controls: true, review: true }
    });

    const departments  = ['Emergency Department', 'ICU', 'General Ward', 'Operating Theatre', 'Pharmacy', 'Radiology'];
    const controlTypes = ['Preventive', 'Detective', 'Corrective'];

    const grid = {};
    departments.forEach(dept => {
      grid[dept] = {};
      controlTypes.forEach(type => {
        grid[dept][type] = { sum: 0, count: 0, avg: 0, incidents: [] };
      });
    });

    incidents.forEach(inc => {
      const dept = inc.department || 'Other';
      if (!grid[dept]) {
        grid[dept] = {};
        controlTypes.forEach(type => {
          grid[dept][type] = { sum: 0, count: 0, avg: 0, incidents: [] };
        });
      }
      const rating = inc.review?.effectivenessRating;
      inc.controls.forEach(ctrl => {
        const type = ctrl.controlType;
        if (grid[dept][type]) {
          if (rating !== null && rating !== undefined) {
            grid[dept][type].sum   += rating;
            grid[dept][type].count += 1;
          }
          grid[dept][type].incidents.push({
            id: inc.id, title: inc.title, severity: inc.severity, rating: rating || 'Unrated'
          });
        }
      });
    });

    const data = [];
    Object.keys(grid).forEach(dept => {
      Object.keys(grid[dept]).forEach(type => {
        const cell = grid[dept][type];
        cell.avg = cell.count > 0 ? parseFloat((cell.sum / cell.count).toFixed(1)) : 0;
        data.push({
          department: dept, controlType: type,
          averageRating: cell.avg, totalControls: cell.incidents.length,
          ratedControls: cell.count, incidents: cell.incidents.slice(0, 5)
        });
      });
    });

    res.json({ data });
  } catch (err) { next(err); }
};

// ── NEW: Accept Incident (OPEN → ACCEPTED) ────────────────────────────────
exports.acceptIncident = async (req, res, next) => {
  try {
    const inc = await getIncidentOrFail(req.params.id);
    if (inc.status !== 'OPEN') {
      return res.status(422).json({ error: 'Only OPEN incidents can be accepted' });
    }
    if (req.user.role === 'department_manager' && req.user.department && inc.department && inc.department !== req.user.department) {
      return res.status(403).json({ error: 'Access denied: incident is not in your department' });
    }
    const updated = await prisma.incident.update({
      where: { id: inc.id },
      data:  { status: 'ACCEPTED', isRejected: false, rejectionComment: null }
    });
    res.json({ data: updated, message: 'Incident accepted successfully' });
  } catch (err) { next(err); }
};

// ── NEW: Reject Incident (OPEN → REJECTED) ────────────────────────────────
exports.rejectIncident = async (req, res, next) => {
  try {
    const inc = await getIncidentOrFail(req.params.id);
    if (inc.status !== 'OPEN') {
      return res.status(422).json({ error: 'Only OPEN incidents can be rejected' });
    }
    if (req.user.role === 'department_manager' && req.user.department && inc.department && inc.department !== req.user.department) {
      return res.status(403).json({ error: 'Access denied: incident is not in your department' });
    }
    const { comment } = req.body;
    if (!comment) return res.status(400).json({ error: 'Rejection comment is required' });
    const updated = await prisma.incident.update({
      where: { id: inc.id },
      data:  { status: 'REJECTED', isRejected: true, rejectionComment: comment }
    });
    res.json({ data: updated, message: 'Incident rejected' });
  } catch (err) { next(err); }
};

// ── NEW: Assign Investigator (ACCEPTED → INVESTIGATING) ───────────────────
exports.assignInvestigator = async (req, res, next) => {
  try {
    const inc = await getIncidentOrFail(req.params.id);
    if (inc.status !== 'ACCEPTED') {
      return res.status(422).json({ error: 'Incident must be ACCEPTED before assigning an investigator' });
    }
    if (req.user.role === 'department_manager' && req.user.department && inc.department && inc.department !== req.user.department) {
      return res.status(403).json({ error: 'Access denied: incident is not in your department' });
    }
    const { investigatorId } = req.body;
    if (!investigatorId) return res.status(400).json({ error: 'investigatorId is required' });
    await prisma.incidentInvestigation.upsert({
      where:  { incidentId: inc.id },
      update: { investigatedBy: parseInt(investigatorId) },
      create: { incidentId: inc.id, investigatedBy: parseInt(investigatorId) }
    });
    const updated = await prisma.incident.update({
      where: { id: inc.id },
      data:  { status: 'INVESTIGATING' }
    });
    res.json({ data: updated, message: 'Investigator assigned successfully' });
  } catch (err) { next(err); }
};

// ── NEW: Assign Action Owner (INVESTIGATING → PENDING_ACTION) ─────────────
exports.assignActionOwner = async (req, res, next) => {
  try {
    const inc = await getIncidentOrFail(req.params.id);
    if (inc.status !== 'INVESTIGATING') {
      return res.status(422).json({ error: 'Incident must be in INVESTIGATING status to assign an action owner' });
    }
    if (req.user.role === 'department_manager' && req.user.department && inc.department && inc.department !== req.user.department) {
      return res.status(403).json({ error: 'Access denied: incident is not in your department' });
    }
    const { actionOwnerId, actionDescription } = req.body;
    if (!actionOwnerId) return res.status(400).json({ error: 'actionOwnerId is required' });
    await prisma.incidentAction.create({
      data: {
        incidentId:  inc.id,
        actionTaken: actionDescription || 'Implement corrective actions as per investigation findings',
        assignedTo:  parseInt(actionOwnerId),
        priority:    'HIGH',
        status:      'PENDING'
      }
    });
    const updated = await prisma.incident.update({
      where: { id: inc.id },
      data:  { status: 'PENDING_ACTION' }
    });
    res.json({ data: updated, message: 'Action owner assigned successfully' });
  } catch (err) { next(err); }
};

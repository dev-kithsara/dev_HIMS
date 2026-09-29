// backend/prisma/seed.ts

import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Hash the default password for all demo users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 2. Create or Update (Upsert) the Department
  // Upsert means: If it exists, update it. If not, create it. This prevents duplicate errors.
  const dept = await prisma.department.upsert({
    where: { name: 'Cardiology' },
    update: {},
    create: { name: 'Cardiology' },
  });

  // 3. Define our Demo Users covering all Roles
  const usersData = [
    { email: 'admin@hospital.com', name: 'System Admin', role: Role.ADMIN },
    { email: 'manager@hospital.com', name: 'Dr. Manager', role: Role.MANAGER },
    { email: 'staff@hospital.com', name: 'Kamal Perera', role: Role.STAFF },
    { email: 'investigator@hospital.com', name: 'Nimal Investigator', role: Role.INVESTIGATOR },
    { email: 'actionowner@hospital.com', name: 'Sunil Action Owner', role: Role.ACTION_OWNER },
  ];

  // 4. Upsert all users and store their created records in an array
  const createdUsers = [];
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { password: hashedPassword, role: u.role }, // Ensure password and role are correct
      create: { ...u, password: hashedPassword, departmentId: dept.id },
    });
    createdUsers.push(user);
  }

  // Extract specific users for easy reference when creating incidents
  const staff = createdUsers.find((u) => u.role === 'STAFF')!;
  const investigator = createdUsers.find((u) => u.role === 'INVESTIGATOR')!;
  const actionOwner = createdUsers.find((u) => u.role === 'ACTION_OWNER')!;

  // 5. Define Incidents covering EVERY state in the State Machine
  const incidentsData = [
    {
      title: 'Slippery Floor (OPEN)',
      description: 'Water leaked near ward 2.',
      severity: 'LOW',
      category: 'SAFETY',
      location: 'Ward 2 Corridor',
      status: 'OPEN',
      departmentId: dept.id,
      reporterId: staff.id,
    },
    {
      title: 'Broken Equipment (ACCEPTED)',
      description: 'ECG machine not turning on.',
      severity: 'MEDIUM',
      category: 'EQUIPMENT',
      location: 'ICU',
      status: 'ACCEPTED',
      departmentId: dept.id,
      reporterId: staff.id,
    },
    {
      title: 'Medication Error (INVESTIGATING)',
      description: 'Wrong dosage given to patient.',
      severity: 'HIGH',
      category: 'CLINICAL',
      location: 'Ward 5',
      status: 'INVESTIGATING',
      departmentId: dept.id,
      reporterId: staff.id,
      investigatorId: investigator.id,
    },
    {
      title: 'Fire Alarm Fault (PENDING_ACTION)',
      description: 'Alarm ringing without fire.',
      severity: 'MEDIUM',
      category: 'FACILITY',
      location: 'Main Lobby',
      status: 'PENDING_ACTION',
      departmentId: dept.id,
      reporterId: staff.id,
      investigatorId: investigator.id,
      actionOwnerId: actionOwner.id, // Must have an action owner
    },
    {
      title: 'Power Outage (UNDER_REVIEW)',
      description: 'Backup generator failed.',
      severity: 'CRITICAL',
      category: 'FACILITY',
      location: 'Entire Block B',
      status: 'UNDER_REVIEW',
      departmentId: dept.id,
      reporterId: staff.id,
      investigatorId: investigator.id,
      actionOwnerId: actionOwner.id,
    },
    {
      title: 'Patient Fall (CLOSED)',
      description: 'Patient fell from bed.',
      severity: 'HIGH',
      category: 'SAFETY',
      location: 'Ward 3',
      status: 'CLOSED',
      departmentId: dept.id,
      reporterId: staff.id,
      investigatorId: investigator.id,
      actionOwnerId: actionOwner.id,
    },
    {
      title: 'False Report (REJECTED)',
      description: 'Someone pressed the emergency button by mistake.',
      severity: 'LOW',
      category: 'OTHER',
      location: 'Reception',
      status: 'REJECTED',
      rejectionReason: 'Verified via CCTV that it was an accidental press by a visitor.',
      departmentId: dept.id,
      reporterId: staff.id,
    },
  ];

  // 6. Insert incidents into the database
  // We use a loop instead of createMany because Prisma createMany doesn't support 'upsert' easily
  for (const inc of incidentsData) {
    // We use the title as a unique identifier for the seed script (assuming titles are unique here)
    // If you don't have a unique constraint on title, we just create them (might cause duplicates if run multiple times)
    await prisma.incident.create({
      data: inc as any,
    });
  }

  const configs = [
    {
      key: 'INCIDENT.CATEGORIES',
      category: 'INCIDENT',
      value: ['CLINICAL', 'SAFETY', 'EQUIPMENT', 'FACILITY', 'OTHER'],
      description: 'Approved incident categories used by forms, analytics, and AI features.',
    },
    {
      key: 'INCIDENT.SLA_HOURS',
      category: 'WORKFLOW',
      value: { LOW: 72, MEDIUM: 48, HIGH: 24, CRITICAL: 4 },
      description: 'Resolution SLA thresholds by severity.',
    },
    {
      key: 'AI.SENSITIVE_FIELDS',
      category: 'AI_GOVERNANCE',
      value: ['reporter.email', 'description', 'attachments.filePath'],
      description: 'Fields masked or excluded from unauthorized AI views and prompts.',
    },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value, description: config.description },
      create: config,
    });
  }

  await prisma.aiModelVersion.upsert({
    where: {
      modelName_version: {
        modelName: 'incident-risk-classifier',
        version: '1.0.0',
      },
    },
    update: {},
    create: {
      modelName: 'incident-risk-classifier',
      version: '1.0.0',
      datasetVersion: 'seed-dataset-v1',
      trainingDate: new Date(),
      metrics: { accuracy: 0.86, f1: 0.83 },
      accuracy: 0.86,
      driftScore: 0.04,
      latencyMs: 120,
      status: 'APPROVED',
      createdById: createdUsers.find((user) => user.role === Role.ADMIN)?.id,
    },
  });

  console.log('✅ Database seeded successfully with all roles and incident states!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

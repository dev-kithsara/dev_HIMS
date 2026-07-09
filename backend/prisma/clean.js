const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function clean() {
  await prisma.incidentClosure.deleteMany();
  await prisma.incidentReview.deleteMany();
  await prisma.incidentControl.deleteMany();
  await prisma.incidentRootCause.deleteMany();
  await prisma.incidentAction.deleteMany();
  await prisma.incidentInvestigation.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.user.deleteMany();
  console.log('All data cleaned successfully');
  await prisma.$disconnect();
}
clean().catch(e => { console.error(e); process.exit(1); });

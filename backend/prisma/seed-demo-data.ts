import {
  ActionEffectiveness,
  ActionItemStatus,
  ActionPriority,
  ActionReviewStatus,
  ActionType,
  ControlEffectiveness,
  IncidentStatus,
  InvestigationReviewStatus,
  InvestigationStatus,
  PrismaClient,
  ReviewOutcome,
  Role,
  Severity,
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const DAY = 24 * 60 * 60 * 1000;

const departmentDefinitions = [
  { name: 'Cardiology', description: 'Cardiac care and diagnostics' },
  { name: 'Emergency Department', description: 'Emergency and triage services' },
  { name: 'Surgery', description: 'Operating theatre and surgical services' },
  { name: 'Pharmacy', description: 'Medication supply and clinical pharmacy' },
  { name: 'Facilities', description: 'Building, utility, and maintenance services' },
];

const categoryOptions = [
  { category: 'CLINICAL', subcategory: 'Medication Error', locations: ['Ward 5', 'ICU', 'Treatment Room'] },
  { category: 'SAFETY', subcategory: 'Near Miss', locations: ['Ward 2 Corridor', 'Ward 3', 'Reception'] },
  { category: 'EQUIPMENT', subcategory: 'Device Failure', locations: ['Diagnostics Room', 'ICU', 'Procedure Room'] },
  { category: 'FACILITY', subcategory: 'Fire or Alarm', locations: ['Main Lobby', 'Block B', 'Plant Room'] },
  { category: 'COMMUNICATION', subcategory: 'Handover Failure', locations: ['Nurses Station', 'Admissions Desk', 'Ward 1'] },
];

const titles = [
  'Medication reconciliation discrepancy', 'Wet floor near clinical area', 'Infusion pump alarm fault',
  'Delayed escalation during handover', 'Emergency exit obstruction', 'Patient identification near miss',
  'Temperature monitoring variance', 'Damaged trolley brake', 'Power interruption during clinic',
  'Missing controlled-drug signature', 'Clinical documentation delay', 'Oxygen cylinder storage concern',
];

const statuses: IncidentStatus[] = [
  IncidentStatus.OPEN, IncidentStatus.ACCEPTED, IncidentStatus.INVESTIGATING,
  IncidentStatus.PENDING_ACTION, IncidentStatus.UNDER_REVIEW, IncidentStatus.CLOSED,
  IncidentStatus.REJECTED,
];
const severities: Severity[] = [Severity.LOW, Severity.MEDIUM, Severity.HIGH, Severity.CRITICAL];

const atDaysAgo = (days: number, hour = 9) => {
  const date = new Date(Date.now() - days * DAY);
  date.setHours(hour, (days * 13) % 60, 0, 0);
  return date;
};

async function main() {
  console.log('Creating repeatable DEMO dataset (84 incidents)…');
  const password = await bcrypt.hash('password123', 10);

  const departments = await Promise.all(departmentDefinitions.map((department) =>
    prisma.department.upsert({ where: { name: department.name }, update: { description: department.description, isActive: true }, create: department })
  ));

  const people = await Promise.all(departments.flatMap((department) => [
    { email: `demo.manager.${department.id}@hospital.test`, name: `${department.name} Demo Manager`, role: Role.MANAGER, departmentId: department.id },
    { email: `demo.staff.${department.id}@hospital.test`, name: `${department.name} Demo Reporter`, role: Role.STAFF, departmentId: department.id },
    { email: `demo.investigator.${department.id}@hospital.test`, name: `${department.name} Demo Investigator`, role: Role.INVESTIGATOR, departmentId: department.id },
    { email: `demo.owner.${department.id}@hospital.test`, name: `${department.name} Demo Action Owner`, role: Role.ACTION_OWNER, departmentId: department.id },
  ].map((person) => prisma.user.upsert({
    where: { email: person.email },
    update: { name: person.name, role: person.role, departmentId: person.departmentId, isActive: true },
    create: { ...person, password },
  }))));

  const personFor = (departmentId: number, role: Role) => people.find((person) => person.departmentId === departmentId && person.role === role)!;
  let actionsCreated = 0;
  let investigationsCreated = 0;

  for (let index = 1; index <= 84; index += 1) {
    const department = departments[(index - 1) % departments.length];
    const profile = categoryOptions[(index * 3) % categoryOptions.length];
    const status = statuses[(index - 1) % statuses.length];
    const severity = severities[(index * 5) % severities.length];
    const reportedAt = atDaysAgo(index + 1, 8 + (index % 9));
    const occurrenceAt = new Date(reportedAt.getTime() - (2 + (index % 14)) * 60 * 60 * 1000);
    const reporter = personFor(department.id, Role.STAFF);
    const investigator = personFor(department.id, Role.INVESTIGATOR);
    const actionOwner = personFor(department.id, Role.ACTION_OWNER);
    const manager = personFor(department.id, Role.MANAGER);
    const referenceId = `DEMO-2026-${String(index).padStart(3, '0')}`;
    const title = `${titles[(index - 1) % titles.length]} — demo case ${String(index).padStart(3, '0')}`;
    const needsInvestigation = [IncidentStatus.INVESTIGATING, IncidentStatus.PENDING_ACTION, IncidentStatus.UNDER_REVIEW, IncidentStatus.CLOSED].includes(status);
    const needsAction = [IncidentStatus.PENDING_ACTION, IncidentStatus.UNDER_REVIEW, IncidentStatus.CLOSED].includes(status);
    const isClosed = status === IncidentStatus.CLOSED;

    const incident = await prisma.incident.upsert({
      where: { referenceId },
      update: {
        title, description: `Demonstration record ${index}: ${profile.category.toLowerCase()} event recorded for workflow, filter, and analytics testing.`,
        severity, category: profile.category, subcategory: profile.subcategory,
        location: profile.locations[index % profile.locations.length], status, occurrenceAt, reportedAt,
        departmentId: department.id, reporterId: reporter.id,
        investigatorId: needsInvestigation ? investigator.id : null,
        actionOwnerId: needsAction ? actionOwner.id : null,
        investigationReviewStatus: isClosed || status === IncidentStatus.PENDING_ACTION ? InvestigationReviewStatus.APPROVED : InvestigationReviewStatus.NOT_SUBMITTED,
        rootCause: needsAction ? 'Demonstration root cause: inconsistent preventive controls and delayed escalation.' : null,
        rootCauseCategory: needsAction ? 'PROCESS_CONTROL' : null,
        riskScore: severity === Severity.CRITICAL ? 0.92 : severity === Severity.HIGH ? 0.71 : severity === Severity.MEDIUM ? 0.43 : 0.18,
        riskLevel: severity === Severity.CRITICAL ? 'CRITICAL' : severity === Severity.HIGH ? 'HIGH' : severity === Severity.MEDIUM ? 'MEDIUM' : 'LOW',
        rejectionReason: status === IncidentStatus.REJECTED ? 'Demo report rejected after duplicate and evidence review.' : null,
        closedAt: isClosed ? atDaysAgo(Math.max(1, index - 8)) : null,
        closureSummary: isClosed ? 'Demo closure completed after actions, control verification, and management review.' : null,
      },
      create: {
        referenceId, title, description: `Demonstration record ${index}: ${profile.category.toLowerCase()} event recorded for workflow, filter, and analytics testing.`,
        severity, category: profile.category, subcategory: profile.subcategory, location: profile.locations[index % profile.locations.length],
        status, occurrenceAt, reportedAt, departmentId: department.id, reporterId: reporter.id,
        investigatorId: needsInvestigation ? investigator.id : null, actionOwnerId: needsAction ? actionOwner.id : null,
        investigationReviewStatus: isClosed || status === IncidentStatus.PENDING_ACTION ? InvestigationReviewStatus.APPROVED : InvestigationReviewStatus.NOT_SUBMITTED,
        rootCause: needsAction ? 'Demonstration root cause: inconsistent preventive controls and delayed escalation.' : null,
        rootCauseCategory: needsAction ? 'PROCESS_CONTROL' : null,
        riskScore: severity === Severity.CRITICAL ? 0.92 : severity === Severity.HIGH ? 0.71 : severity === Severity.MEDIUM ? 0.43 : 0.18,
        riskLevel: severity === Severity.CRITICAL ? 'CRITICAL' : severity === Severity.HIGH ? 'HIGH' : severity === Severity.MEDIUM ? 'MEDIUM' : 'LOW',
        rejectionReason: status === IncidentStatus.REJECTED ? 'Demo report rejected after duplicate and evidence review.' : null,
        closedAt: isClosed ? atDaysAgo(Math.max(1, index - 8)) : null,
        closureSummary: isClosed ? 'Demo closure completed after actions, control verification, and management review.' : null,
      },
    });

    if (needsInvestigation) {
      await prisma.investigation.upsert({
        where: { incidentId: incident.id },
        update: { leadInvestigatorId: investigator.id, status: isClosed || status === IncidentStatus.PENDING_ACTION ? InvestigationStatus.APPROVED : InvestigationStatus.SUBMITTED, startDate: occurrenceAt, endDate: atDaysAgo(Math.max(1, index - 5)), method: 'FIVE_WHYS', findingsSummary: 'Demo findings summarise the event chronology and contributing controls.' },
        create: { incidentId: incident.id, leadInvestigatorId: investigator.id, status: isClosed || status === IncidentStatus.PENDING_ACTION ? InvestigationStatus.APPROVED : InvestigationStatus.SUBMITTED, startDate: occurrenceAt, endDate: atDaysAgo(Math.max(1, index - 5)), method: 'FIVE_WHYS', findingsSummary: 'Demo findings summarise the event chronology and contributing controls.' },
      });
      investigationsCreated += 1;
    }

    if (needsAction) {
      await prisma.correctiveActionItem.deleteMany({ where: { incidentId: incident.id, title: { startsWith: 'DEMO action:' } } });
      const actionStatus = isClosed ? ActionItemStatus.COMPLETED : index % 3 === 0 ? ActionItemStatus.IN_PROGRESS : ActionItemStatus.OPEN;
      await prisma.correctiveActionItem.create({
        data: {
          incidentId: incident.id, ownerId: actionOwner.id, title: `DEMO action: strengthen control ${index}`,
          description: 'Demonstration corrective action used for action-owner queues and due-date analytics.',
          type: index % 2 ? ActionType.CORRECTIVE : ActionType.PREVENTIVE,
          priority: severity === Severity.CRITICAL ? ActionPriority.CRITICAL : severity === Severity.HIGH ? ActionPriority.HIGH : ActionPriority.MEDIUM,
          status: actionStatus, dueDate: atDaysAgo(index - (index % 4 === 0 ? -3 : 2)),
          completedAt: isClosed ? atDaysAgo(Math.max(1, index - 7)) : null,
          reviewStatus: isClosed ? ActionReviewStatus.VERIFIED : ActionReviewStatus.ACTIVE,
          effectiveness: isClosed ? ActionEffectiveness.EFFECTIVE : ActionEffectiveness.NOT_ASSESSED,
          effectivenessScore: isClosed ? 86 : null,
        },
      });
      await prisma.controlAssessment.deleteMany({ where: { incidentId: incident.id } });
      await prisma.controlAssessment.create({
        data: { incidentId: incident.id, controlType: 'Demo preventive control', effectiveness: isClosed ? ControlEffectiveness.EFFECTIVE : ControlEffectiveness.PARTIALLY_EFFECTIVE, ownerId: actionOwner.id, status: isClosed ? 'VERIFIED' : 'IN_PROGRESS' },
      });
      actionsCreated += 1;
    }

    if (isClosed) {
      const existingReview = await prisma.managementReview.findFirst({ where: { incidentId: incident.id, comments: 'Demo management review' } });
      if (!existingReview) await prisma.managementReview.create({ data: { incidentId: incident.id, reviewerId: manager.id, outcome: ReviewOutcome.APPROVED, comments: 'Demo management review', lessonsLearned: 'Reinforce control checks at team huddles.' } });
    }
  }

  console.log(`Demo data ready: 84 incidents, ${investigationsCreated} investigation records, ${actionsCreated} corrective actions.`);
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());

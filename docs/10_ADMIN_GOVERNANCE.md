# Admin Governance and Operations

## Role and permission matrix

| Capability | ADMIN | MANAGER | INVESTIGATOR | ACTION_OWNER | STAFF |
|---|---:|---:|---:|---:|---:|
| View enterprise analytics | Yes | Own department | No | No | No |
| View incident | All departments | Own department | Assigned | Assigned | Reported by self |
| Create incident | Yes | No | No | No | Yes |
| Manage incident workflow | Yes | Own department | Investigation only | Corrective action only | No |
| Correct incident record | Yes, reason + audit required | No | No | No | No |
| Manage users and roles | Yes | Limited roles in own department | No | No | No |
| Manage departments | Yes | No | No | No | No |
| View/export audit events | Yes | No | No | No | No |
| Manage configuration and AI models | Yes | No | No | No | No |

The database, API validators, JWT authorization, seed data, and frontend types use the validated roles `ADMIN`, `MANAGER`, `INVESTIGATOR`, `ACTION_OWNER`, and `STAFF`. ADMIN may pass protected role gates, but each request and business change is audited.

## Admin workspace

Sign in with the seeded development account `admin@hospital.com` and the development password defined in `prisma/seed.ts`. The Admin workspace provides:

- Cross-department incident filtering by department, severity, status, category, search text, and date.
- Controlled corrections with a mandatory reason and preserved before/after values.
- User creation, role/department assignment, updates, and reversible deactivation.
- Department creation, updates, and deactivation without deleting incident history.
- Audit filtering and authenticated CSV export.
- Incident data-quality metrics and records excluded from model training.
- Governed incident categories, SLA thresholds, and sensitive-field rules.
- AI model version registration, health indicators, approval, deployment, rejection, retirement, and rollback history.

## Security controls

- Evidence is stored under `uploads/evidence`, never exposed as a public static directory, validated for type and size, and served only after incident authorization.
- `AI.SENSITIVE_FIELDS` controls fields redacted by the training-preview service. Masking is the default for AI-bound records.
- Deactivated users cannot authenticate. Admin cannot deactivate their own account.
- Admin API access and authentication, incident workflow, corrections, user, department, configuration, and model changes are written to `AuditLog`.
- Production must use a unique `JWT_SECRET`, TLS at the reverse proxy, database encryption/backup controls, and least-privilege database credentials.

## Deployment, backup, and recovery

1. Back up PostgreSQL before deployment (`pg_dump` or the platform snapshot mechanism).
2. Deploy application images and run `npx prisma migrate deploy` inside the backend container.
3. Run the seed only for a development/test environment.
4. Verify `/health`, Admin login, dashboard metrics, audit writes, and authenticated evidence access.
5. Restore by rolling back application images and restoring the matching database snapshot. AI model artifacts and external evidence storage must be included in the same recovery point.

## Acceptance and test checklist

- Verify every role against every protected endpoint, including cross-department denial and ADMIN override.
- Confirm an Admin correction without a reason is rejected and a valid correction stores before/after values.
- Confirm deactivation preserves historical relationships and blocks the user at login.
- Confirm evidence type/size validation, path traversal rejection, and unauthorized download denial.
- Confirm AI training preview redacts configured sensitive paths.
- Exercise model submit, approve, deploy, reject, rollback, and retirement transitions and inspect the audit trail.
- Load-test core incident APIs independently from future long-running AI jobs; AI work should run asynchronously before production use.
- Run backup/restore, container restart, health monitoring, and rollback drills in the target environment.

Operational penetration, concurrency, availability, and stakeholder UAT are release gates. They require a production-like target and cannot be established by application code alone.

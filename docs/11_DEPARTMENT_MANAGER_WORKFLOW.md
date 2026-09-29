# Department Manager Workflow

## Scope

The Manager workspace is restricted to the department embedded in the authenticated JWT. An `ADMIN` may use the same services as an audited override; a Manager cannot read, edit, assign, export, or analyse another department's records.

## Workflow

1. A Manager accepts, rejects, or requests revision of a submitted incident with a mandatory comment.
2. Only an accepted incident can be assigned to an active Investigator in the same department.
3. The Investigator submits root-cause findings for Manager review. The Manager approves the findings or returns them with comments.
4. Action Owner assignment and CAPA creation remain blocked until the investigation is approved.
5. The Manager may create multiple corrective or preventive actions with an owner, priority, due date, status, and audited change reason.
6. Existing-control effectiveness, required improvements, management review, lessons learned, and dissemination schedules are recorded as structured data.
7. Closure is allowed only when actions are complete, controls are verified, and the latest management review is approved. A closed incident can be reopened only with a reason, while closure history remains available.

## Manager UI changes

- **Dashboard:** submitted, investigating, overdue-action, review-pending, high-risk, and closed queues; incident-frequency, root-cause, control-effectiveness, resolution-time, and ageing views.
- **Incident Register:** department-scoped server search, status/severity/category filtering, sorting, pagination, and authorized CSV export.
- **Incident Workspace:** audited decision and editing controls, department-only assignment lists, investigation review, CAPA, controls, management review, dissemination, predictive-risk explanation/override, similar-incident context, closure, and reopen.
- **My Team:** active department members only; role delegation remains constrained to Staff, Investigator, and Action Owner.

## API

All endpoints below require `MANAGER` authentication and are rooted at `/api/manager`:

- `GET /dashboard`
- `GET /incidents` and `GET /incidents/export`
- `GET /incidents/:id` and `GET /incidents/:id/recommendations`
- `PATCH /incidents/:id/decision` and `PATCH /incidents/:id`
- `POST /incidents/:id/assign-investigator`
- `POST /incidents/:id/investigation-review`
- `POST /incidents/:id/actions` and `PATCH /incidents/:id/actions/:actionId`
- `POST /incidents/:id/controls`, `/reviews`, and `/lessons`
- `POST /incidents/:id/close`, `/reopen`, and `/risk-override`

## Verification

Run `npx prisma migrate deploy` before restarting the backend. Both `backend` and `frontend` must pass `npm run build`.

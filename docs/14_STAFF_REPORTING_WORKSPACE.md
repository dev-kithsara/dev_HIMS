# Staff Reporting Workspace

## Security and ownership

- Every `/api/staff` route requires an authenticated `STAFF` user.
- Incident list and detail queries always include `reporterId = signed-in user ID`.
- The legacy department register no longer permits Staff access.
- Submitted evidence is served only after the incident authorization check.
- Drafts use a one-private-draft-per-reporter data model and are never returned to Manager queues.

## Reporting workflow

1. Staff saves an incomplete private draft without submitting it.
2. The form loads active departments and approved dependent category/sub-category values.
3. Staff enters a separate occurrence date/time; the server records the report timestamp.
4. Optional JPG, PNG, and PDF evidence can be previewed and removed before submission.
5. Submission validates required fields and creates a unique reference such as `HIMS-2026-000123`.
6. The live My Incidents register supports search plus status, severity, category, and date filters.
7. Manager decisions and major workflow milestones appear in an ownership-safe timeline.
8. A revision request identifies editable fields. The API rejects changes to any other field and preserves a version snapshot on resubmission.

## Optional assistance

The local assistance endpoint provides:

- explainable category and dependent sub-category suggestions;
- an editable starting-severity suggestion;
- a privacy-safe duplicate notice without exposing another reporter or incident record;
- completeness guidance for missing context;
- an editable title and summary suggestion.

Suggestions never update or submit the form automatically. Staff must explicitly accept, dismiss, correct, or edit them. Feedback is stored for evaluation, and core submission continues to work when assistance is not used.

## Main endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/staff/reporting-config` | Active departments and approved classification hierarchy |
| GET | `/api/staff/incidents` | Search and filter owned reports only |
| POST | `/api/staff/incidents` | Validate and submit a report with evidence |
| GET | `/api/staff/incidents/:id` | Owned detail, comments, timeline, notifications, and versions |
| PATCH | `/api/staff/incidents/:id/resubmit` | Controlled revision and versioned resubmission |
| GET/PUT/DELETE | `/api/staff/draft` | Load, save, or discard the private draft |
| POST | `/api/staff/assist` | Optional local report guidance |
| POST | `/api/staff/ai-feedback` | Record explicit human decisions about suggestions |

## Verification checklist

- Confirm Staff A cannot list or open Staff B's report.
- Confirm inactive departments and invalid category/sub-category pairs are rejected.
- Confirm a future occurrence time is rejected.
- Confirm draft save does not create a submitted incident.
- Confirm evidence type, size, count, preview/remove, and authorized viewing behavior.
- Confirm a Manager revision comment and editable-field list are visible to the reporter.
- Confirm unrequested revision fields are rejected and resubmission creates a new version.
- Confirm report submission works without calling the assistance endpoint.

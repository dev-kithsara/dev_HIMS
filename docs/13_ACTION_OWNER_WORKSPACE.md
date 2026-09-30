# Action Owner Workspace

## Purpose

The Action Owner module turns corrective work into independently assigned, traceable action records. It replaces the previous single incident-level corrective-action text field while keeping the legacy API available for compatibility.

## Security boundary

- Every `/api/action-owner` endpoint requires the `ACTION_OWNER` role.
- Queries include `ownerId = signed-in user ID`; an owner cannot read, update, or download evidence for another owner's action.
- Evidence supports JPG, PNG, and PDF files up to 5 MB and is served only through an authenticated ownership check.
- Progress, evidence, returns, resubmissions, Manager verification, and AI feedback are stored as audit-capable records.

## Workflow

1. A Department Manager creates one or more `IMMEDIATE`, `CORRECTIVE`, or `PREVENTIVE` action items after approving the investigation.
2. The Action Owner sees only assigned work and filters it by progress, priority, due-soon, or overdue state.
3. The owner records progress notes and uploads supporting evidence.
4. Completion requires verification notes and changes the review state to `COMPLETED_PENDING_VERIFICATION`.
5. The Manager either verifies effectiveness or returns the action with a mandatory reason.
6. Returned work is revised and resubmitted. Verified work becomes locked.
7. Incident review, management approval, and closure are blocked until every required action is complete and Manager-verified.

## Assistance and notifications

- Due-soon and overdue notifications are calculated from live due dates without automatically changing workflow state.
- Completion risk uses transparent local rules and exposes its factors and model version.
- Similar-action ranking uses local text similarity over records the signed-in owner is authorized to see.
- Recommendations use Manager-verified effective actions and include source incident references.
- Owners can accept or dismiss results; the feedback and model version are recorded.

## Main endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/action-owner/dashboard` | Assigned queue, filters, summary, notifications |
| GET | `/api/action-owner/actions/:id` | Authorized action workspace |
| PATCH | `/api/action-owner/actions/:id/progress` | Save progress or complete with verification notes |
| POST | `/api/action-owner/actions/:id/evidence` | Upload authorized evidence |
| GET | `/api/action-owner/actions/:id/evidence/:evidenceId` | Secure evidence download |
| POST | `/api/action-owner/actions/:id/resubmit` | Resubmit returned work |
| GET | `/api/action-owner/actions/:id/ai-insights` | Risk, similar actions, and recommendations |
| POST | `/api/action-owner/actions/:id/ai-feedback` | Record accept/dismiss feedback |
| POST | `/api/manager/incidents/:id/actions/:actionId/review` | Manager return or verification |

## Validation checklist

- Build the backend and frontend.
- Apply `20260930100000_add_action_owner_workspace`.
- Confirm an Action Owner can open only their own action IDs.
- Confirm completion without verification notes is rejected.
- Confirm secure evidence access rejects a different owner.
- Confirm Manager return/resubmit and verify paths appear in the history timeline.
- Confirm incident review and closure reject incomplete or unverified actions.

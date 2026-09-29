# API Reference

## Incidents (Manager Workflow)
- `GET /api/incidents/department/:departmentId` - Get all incidents for a department
- `PATCH /api/incidents/:id/accept` - Accept an OPEN incident
- `PATCH /api/incidents/:id/reject` - Reject an OPEN incident (Body: `{ reason: string }`)
- `PATCH /api/incidents/:id/assign-investigator` - Assign investigator (Body: `{ investigatorId: number }`)
- `PATCH /api/incidents/:id/assign-action-owner` - Assign action owner (Body: `{ actionOwnerId: number }`)
- `PATCH /api/incidents/:id/review` - Mark as UNDER_REVIEW
- `PATCH /api/incidents/:id/close` - Close the incident
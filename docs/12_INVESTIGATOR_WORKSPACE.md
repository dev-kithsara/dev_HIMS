# Investigator Workspace

## Security boundary

Every investigation endpoint validates that the incident is assigned to the signed-in Investigator. Dashboard searches, workspaces, evidence references, related-incident links, AI summaries, clusters, and similar-incident results use only authorized assigned records. Cross-assignment access returns `403`.

## Structured workflow

1. A Manager assigns an accepted incident to an active Investigator in the same department.
2. Opening the workspace creates one structured `Investigation` record for the incident.
3. Draft saves preserve incomplete work without changing the incident state.
4. The lead Investigator may add active department team members, approved methods and dates, multiple contributing factors, witnesses, evidence references, and chronological events.
5. RCA stores category, sub-category, description, method, detailed analysis, and a systemic-issue flag.
6. Submission validates required fields and locks the record while Manager review is pending.
7. Manager approval permanently locks the approved version. A return-for-revision unlocks the same record, increments its revision number, displays the Manager comment, and permits resubmission.

## Explainable AI assistance

The initial implementation is a deterministic, explainable rules foundation:

- Similar incidents are ranked only from incidents assigned to the Investigator, with scores and matched fields.
- Cluster summaries group authorized cases by category and location.
- Method suggestions explain why Five Whys, Fishbone, or Fault Tree may fit.
- Evidence and timeline summaries use authorized metadata and never overwrite human findings.
- Every result includes a model version and accepts useful, dismiss, or override feedback.

## API

All structured routes require `INVESTIGATOR` and are rooted at `/api/investigations`:

- `GET /dashboard`
- `GET /:id`, `PUT /:id/draft`, `POST /:id/submit`
- `GET /:id/candidates`, `POST /:id/team`, `DELETE /:id/team/:userId`
- `POST /:id/witnesses`, `/timeline`, `/evidence`, and `/links`
- `GET /:id/ai-insights`, `POST /:id/ai-feedback`

The original `/api/incidents/investigator` and `/api/incidents/:id/root-cause` contracts remain available for compatibility.

## UAT checklist

- Confirm an Investigator sees only assigned cases and cross-assignment access is denied.
- Save an incomplete draft and confirm incident status does not advance.
- Add/remove an eligible team member; reject an inactive or cross-department user.
- Record dates, method, findings, multiple factors, witnesses, evidence, and timeline events.
- Confirm incomplete submission lists missing fields.
- Submit, confirm editing is locked, return from Manager with comments, revise, and resubmit.
- Approve from Manager and confirm findings remain locked.
- Check similarity scores, matched fields, cluster contents, source authorization, method reasons, summaries, model version, and AI feedback audit events.

## AI relevance evaluation

Review a known sample and record precision-oriented usefulness feedback. Measure whether top-ranked results share expected category, location, severity, or root-cause fields. Document false positives, sparse-history limitations, and the fact that this rules baseline is not a clinical decision model.

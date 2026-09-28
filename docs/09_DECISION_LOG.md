# Architecture Decision Record (ADR)

## 1. Incident Workflow State Machine
*   **Decision:** We implemented a strict State Machine for the incident lifecycle (OPEN -> ACCEPTED -> INVESTIGATING -> PENDING_ACTION -> UNDER_REVIEW -> CLOSED).
*   **Reason:** To ensure data integrity and prevent invalid state transitions. We validate the current state in the Service Layer before performing any action.

## 2. Separate Endpoints for Workflow Actions
*   **Decision:** Instead of a single `PATCH /incidents/:id` endpoint, we created explicit endpoints (e.g., `/accept`, `/reject`).
*   **Reason:** To clearly separate business logic, enforce specific validation rules (e.g., rejection reason is mandatory), and improve API readability.
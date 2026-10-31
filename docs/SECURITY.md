# BloodConnect — Security, Privacy & Safety Guidelines

## 1. Authentication & Password Security
- Passwords are encrypted using modern hashing algorithms (`bcrypt` / `argon2`) with salted rounds. Plaintext passwords are never logged, printed, or saved in storage.
- JWT tokens use short-lived expiration (60 minutes). Signature keys are loaded strictly from environment configuration (`SECRET_KEY`).

## 2. Server-Side Role-Based Access Control (RBAC)
Role verification is applied on the server on every protected endpoint using dependency injection (`get_current_active_user`, `require_role(...)`).
Frontend role filtering is treated solely as a UI convenience; API security does not depend on client-side state.

## 3. Hospital Tenant Isolation
Every query accessing hospital-specific records (`InventoryLot`, `InventoryBalance`, `InventoryTransaction`, `BloodRequest`) strictly binds the query with `hospital_id == current_user.hospital_id`.
Staff from Hospital A attempting to fetch or modify data belonging to Hospital B immediately triggers HTTP 403 Forbidden and records an unauthorized access warning in `AuditLog`.

## 4. Requester Privacy & Minimal PII
- Public discovery shows only available quantities and verified hospital details. No individual donor or patient identities are ever exposed publicly.
- Blood request tracking is performed using cryptographic random UUID tokens (`tracking_token`), allowing the requester to check progress without exposing patient medical details to unauthorized parties.

## 5. Audit Logging
Every privileged mutation (hospital approval/suspension, inventory manual adjustment, reservation cancellation, staff creation) writes an immutable record to the `AuditLog` table containing the actor ID, action type, IP/metadata, and target ID.

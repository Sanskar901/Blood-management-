# BloodConnect — REST API Specification (`/api/v1`)

All endpoints adhere to OpenAPI 3.0 standards and return standard JSON responses with structured error codes.

---

## 1. Authentication & Users (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Register as a public requester or initial hospital admin application. |
| `POST` | `/api/v1/auth/login` | Public | OAuth2-compatible password login. Returns JWT access token. |
| `GET` | `/api/v1/auth/me` | Authenticated | Retrieve profile details of currently authenticated user. |

---

## 2. Hospitals & Verification (`/api/v1/hospitals`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/hospitals` | Public | List approved and active hospitals with public contact info. |
| `GET` | `/api/v1/hospitals/{id}` | Public | Detailed hospital profile. |
| `POST` | `/api/v1/hospitals/apply` | Public | Submit new hospital onboarding application (status: `PENDING`). |
| `PATCH` | `/api/v1/hospitals/{id}/status` | Super Admin | Transition hospital status: `APPROVED`, `REJECTED`, `SUSPENDED`. |

---

## 3. Public Inventory Discovery & Search (`/api/v1/search`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/search` | Public | Search available blood inventory across approved hospitals. Parameters: `blood_group`, `component`, `quantity`, `lat`, `lng`, `pin_code`, `max_radius_km`. Sorted by complete fulfilment capacity followed by distance. |

---

## 4. Hospital Inventory Management (`/api/v1/inventory`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/inventory` | Hospital Staff | View current hospital's inventory balances and active lots. |
| `POST` | `/api/v1/inventory/lots` | Hospital Staff | Register new blood lot/donation batch (creates lot & ledger entry). |
| `POST` | `/api/v1/inventory/adjust` | Hospital Staff | Record adjustment (+/-) with mandatory reason. |
| `GET` | `/api/v1/inventory/transactions`| Hospital Staff | View immutable audit history of inventory movements for this hospital. |

---

## 5. Blood Requests & Atomic Reservations (`/api/v1/requests` & `/api/v1/reservations`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/requests` | Public / Requester | Submit emergency/routine blood request and generate public tracking token. |
| `GET` | `/api/v1/requests/track/{token}` | Public with Token | Securely track status of a specific request without revealing patient PII. |
| `POST` | `/api/v1/reservations` | Requester | Place atomic 30-minute hold on inventory. Uses row-level lock and idempotency key. |
| `POST` | `/api/v1/reservations/{id}/cancel` | Requester / Staff | Cancel reservation and release reserved units atomically. |
| `POST` | `/api/v1/reservations/{id}/fulfil` | Hospital Staff | Mark reservation as clinically verified and fulfilled. |

---

## 6. Super Admin & Analytics (`/api/v1/admin`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/admin/dashboard` | Super Admin | System-wide statistics: total hospitals, stock units, requests, shortages. |
| `GET` | `/api/v1/admin/audit-logs` | Super Admin | Audit trail with filtering by actor, action type, date range. |
| `GET` | `/api/v1/admin/export/inventory` | Super Admin | Download CSV export of inventory (stripped of confidential patient records). |

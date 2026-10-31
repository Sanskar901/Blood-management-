# BloodConnect — Google Antigravity Build Prompt

> Copy the full prompt in this file into Google Antigravity. Ask it to work in the current project folder and implement the application incrementally, testing each stage.

---

## MASTER PROMPT

You are a senior full-stack engineer, database architect, UI/UX designer, and test engineer. Build **BloodConnect**, a polished, full-stack, SIH (Smart India Hackathon)-oriented **multi-hospital blood inventory discovery and reservation platform**.

The developer is working on **Windows 10/11**. Build and test locally first; do not deploy to any public service unless explicitly asked. This is a hackathon prototype, not a certified clinical system. Use clearly labelled fictional seed data and never imply that demo availability is real.

### 1. Mission and outcomes

Build a working web application that lets:
- Each verified hospital manage only its own blood inventory.
- Public users search for nearby hospitals by blood group, blood component, quantity, and location.
- Users submit a request and, where permitted, place a temporary reservation.
- The system prevent over-reservation when multiple requests arrive concurrently.
- A super admin manage hospital onboarding, accounts, inventory visibility, requests, audit events, and analytics.

Prioritize a **working, secure, understandable prototype** over empty pages, mock buttons, or decorative-only features. Do not claim integrations or tests work unless they actually do.

### 2. Recommended stack

Use the following unless a genuine compatibility issue requires a documented alternative:
- Frontend: React + Vite + TypeScript.
- Styling: Tailwind CSS; use a consistent component system and accessible UI patterns.
- Backend: Python 3.13 + FastAPI.
- Database: PostgreSQL.
- ORM and migrations: SQLAlchemy 2.x + Alembic.
- Validation/settings: Pydantic v2 and pydantic-settings.
- Authentication: secure password hashing with Argon2id or bcrypt; short-lived access tokens and appropriately handled refresh/session credentials. Never store plaintext passwords.
- Testing: Pytest, FastAPI TestClient/httpx, and PostgreSQL integration tests for concurrency.
- Local services: Docker Compose for PostgreSQL where Docker is available. Also document a native PostgreSQL alternative for Windows.
- Maps: OpenStreetMap-compatible map library only if it can be implemented without exposing secret keys; otherwise provide a useful distance-sorted results list and a map-ready interface.
- API documentation: FastAPI OpenAPI/Swagger.
- Frontend tests: add practical unit/component tests for key flows.

Use pinned or bounded compatible dependencies, include lockfiles where appropriate, and document actual prerequisites.

### 3. Work style and execution rules

1. Inspect the current workspace before changing files. Preserve useful existing work.
2. Create a concise implementation plan and a `docs/IMPLEMENTATION_STATUS.md` checklist.
3. Implement in small, runnable stages. Do not stop after generating a plan or UI mockup.
4. Run the backend, frontend, migrations, lint/type checks, and tests where possible. Fix errors before claiming completion.
5. If a command requires user approval or an unavailable dependency, explain the exact blocker and give the next command.
6. Never put real credentials, secrets, API keys, or personal patient data in source control. Create `.env.example`; ignore `.env`, database volumes, virtual environments, build output, and secrets.
7. Use environment variables for configuration and provide safe development defaults only where appropriate.
8. Keep code organized, typed, documented, and beginner-friendly.
9. Avoid unnecessary complexity, paid dependencies, and external services for the core demo.
10. Do not deploy or transmit data externally without explicit permission.

### 4. User roles and permissions

Implement server-side role-based access control. Hiding frontend buttons is not authorization.

**Super Admin**
- Secure login; use a development bootstrap process or environment-configured initial admin, never a hard-coded production password.
- View dashboard metrics.
- Review and approve/reject hospital applications.
- Suspend/reactivate hospital accounts.
- View hospitals, inventory summaries, requests, reservations, and audit logs.
- View analytics and export appropriate non-sensitive reports.
- All privileged actions must be audited. Any admin stock adjustment must require a reason and create a transaction record.

**Hospital Admin / Authorized Hospital Staff**
- Each account belongs to one hospital.
- View and manage only that hospital's inventory and requests, enforced by backend authorization and database queries.
- Add stock, record stock adjustments, and record incoming donations or transfers as appropriate for the prototype.
- View stock by blood group/component, expiry, and status.
- Review incoming requests and process the hospital-side workflow.
- Never edit another hospital's inventory by changing an ID in an API request.

**Public User / Requester**
- Search available inventory without seeing private patient information.
- Create a request with only the minimum required personal information.
- View their own request status using authenticated access or a securely generated tracking token.
- Do not expose requester personal details to other users or unrelated hospitals.

Use a clear hospital approval state: `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`. Only approved, active hospitals may publish inventory.

### 5. Core product pages

Create a responsive, professional, healthcare-oriented design. Avoid a generic AI-looking gradient-heavy design. Use readable typography, restrained colors, accessible contrast, clear status badges, loading states, empty states, error states, and mobile-friendly layouts.

**Public**
- Landing page explaining the platform and showing clearly labelled demo statistics.
- Blood search form: blood group, blood component, quantity, location/PIN code or geolocation if the user explicitly grants permission, and optional search radius.
- Search results sorted by ability to fulfil the requested quantity and then distance, with hospital name, approximate distance, compatible listed component/group, available quantity, last inventory confirmation, and contact information approved for public display.
- Request details and submission flow.
- Request status/tracking page with proper access controls.
- Hospital registration/application page.
- Login page.

**Hospital portal**
- Overview dashboard: total available units, low-stock products, expiring products, pending requests, recent activity.
- Inventory table with filters and pagination.
- Add/edit stock flow.
- Stock movement history.
- Incoming requests and reservation list.
- Request detail with status history.
- Hospital profile and staff/account management appropriate to scope.

**Super-admin portal**
- Overview dashboard.
- Hospital applications and approvals.
- Hospital directory and account status controls.
- Cross-hospital inventory overview.
- Requests and reservations.
- Audit logs with filters.
- Analytics: inventory by group/component, request volume, fulfilment rates, shortages, and expiry alerts.
- CSV export with safeguards against exporting unnecessary personal data.

Make every visible button functional or clearly disabled with a reason. Do not create fake actions.

### 6. Data model

Design normalized SQLAlchemy models and Alembic migrations for at least:

- `User`: id, email, password hash, role, account status, hospital association where applicable, timestamps.
- `Hospital`: id, name, registration/licence reference, address, PIN code, latitude/longitude, contact details, approval status, active status, timestamps.
- `BloodProduct` or controlled product fields: blood group (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`) and component (e.g. whole blood, red blood cells, platelets, plasma, as configured).
- `InventoryLot`: hospital, product, batch/donation identifier, quantity, expiry date where applicable, verification status, timestamps.
- `InventoryBalance` or equivalent transactional stock model: hospital/product/lot dimensions as required, total eligible quantity, reserved quantity, version/timestamps, unique constraints.
- `BloodRequest`: requester, requested product/component, quantity, location, urgency, status, timestamps.
- `Reservation`: request, hospital, inventory references as needed, quantity, status, expiry time, idempotency key, timestamps.
- `InventoryTransaction`: hospital, inventory/lot, transaction type, quantity delta, reason, actor, related request/reservation, timestamp.
- `AuditLog`: actor, action, target type/id, timestamp, request correlation ID, safe metadata without secrets.
- `Notification` or notification-outbox table if notifications are implemented.

Use UTC timestamps in storage. Use database constraints and indexes. Add unique constraints for natural keys (for example, a hospital/product/lot combination where appropriate), non-negative stock constraints, valid quantity constraints, and foreign keys. Explain the chosen inventory invariants in `docs/DATABASE_DESIGN.md`.

Do not assume blood-group label alone establishes clinical compatibility. Show a clear notice that compatibility, donor/component eligibility, and final issue must be verified by qualified hospital/blood-bank personnel. Keep component-specific inventory distinct.

### 7. Race-condition and reservation requirements — CRITICAL

The database, not the browser, is the authority for inventory. **Never implement reservation as “read stock in Python, then later update stock” without a transaction/lock or atomic conditional update.**

Implement an atomic reservation workflow:
1. Validate requester, hospital status, requested product/component, quantity, and idempotency key.
2. Start a PostgreSQL transaction.
3. Lock the relevant inventory balance/lot rows using `SELECT ... FOR UPDATE`, or use a carefully designed atomic conditional update. If fulfilling from multiple lots, lock rows in a stable deterministic order to reduce deadlocks.
4. Recalculate eligible, unexpired, unreserved stock inside the transaction.
5. If enough stock exists, create the reservation and related stock ledger event, update reserved quantity, and transition the request consistently.
6. Commit all related writes together. On any failure, roll back everything.
7. If stock is insufficient, return a clear conflict response (HTTP 409) with safe current availability information.
8. Enforce idempotency at the database level so retries with the same key do not reserve twice. Reject reuse of a key with a different request payload.
9. Reservation expiry/cancellation must release reserved quantity exactly once and atomically. Competing expiry workers or cancellation calls must not double-release.
10. Confirmed issue/fulfilment must be a separate authorized state transition; a reservation alone is not proof that blood was medically approved or collected.

Use explicit state machines and validate permitted transitions. Suggested request statuses: `SUBMITTED`, `UNDER_REVIEW`, `RESERVED`, `APPROVED`, `REJECTED`, `CANCELLED`, `EXPIRED`, `FULFILLED`. Suggested reservation statuses: `ACTIVE`, `CONFIRMED`, `RELEASED`, `EXPIRED`, `CANCELLED`. Document the transitions and avoid impossible combinations.

**Required tests:**
- If 5 units exist and two concurrent transactions each request 4, only one reservation succeeds and the final available quantity is 1.
- Two concurrent requests must never cause negative stock.
- Repeating a request with the same idempotency key must not duplicate the reservation.
- Cancellation and expiry racing each other must release stock at most once.
- A hospital cannot access or modify another hospital's inventory or requests.
- Unapproved/suspended hospitals cannot make inventory available or fulfil new requests.
- A failed transaction must not leave a partial reservation or ledger entry.
- Run concurrency tests against PostgreSQL, not SQLite; SQLite does not reproduce PostgreSQL row-level locking semantics.

Add a reproducible test command and explain the expected results.

### 8. Inventory rules

- Track total, reserved, and available quantities distinctly.
- Available quantity must be derived consistently, for example `eligible_total - active_reserved`; avoid maintaining multiple contradictory sources of truth.
- Never allow negative available stock.
- Do not make expired, quarantined, unverified, or otherwise ineligible lots searchable.
- Stock adjustments must include a reason, actor, and ledger entry.
- A stock transfer must be represented as linked outgoing/incoming transactions, not as a silent edit.
- Keep inventory freshness visible. Do not describe old stock as live or guaranteed.
- Seed data and demo results must be marked `DEMO DATA — NOT LIVE HOSPITAL AVAILABILITY`.

### 9. Search and distance

- Search by blood group, component, quantity, and location.
- If coordinates are available, calculate distance using a documented method such as Haversine for the prototype.
- Prefer hospitals able to fulfil the complete requested quantity, then rank by distance; also show partial-availability alternatives.
- Never claim exact routing distance if only straight-line distance is calculated. Label it “approximate straight-line distance.”
- Ask for geolocation permission; offer manual PIN code/location entry if permission is denied.
- Do not fabricate hospital listings, live inventory, or geocoding results.
- Keep map features optional so the core search works without a third-party API key.

### 10. Security, privacy, and safety

- Hash passwords with a modern password hashing scheme and configure safe parameters.
- Validate all inputs server-side; use Pydantic schemas.
- Apply RBAC on every protected endpoint.
- Use secure CORS configuration, rate limits on authentication/request endpoints where practical, and safe error messages.
- Never log passwords, access tokens, secrets, or unnecessary patient details.
- Use CSRF protections if using cookie-based sessions; if using bearer tokens, document token storage risks and avoid insecure long-lived localStorage credentials.
- Use parameterized ORM queries.
- Do not expose database errors or stack traces to public clients.
- Keep audit records for privileged changes and inventory movements.
- Include `.env.example`, `.gitignore`, and setup documentation.
- Add a prominent prototype disclaimer. Do not claim the application is compliant with any law, licensed, clinically validated, or production-safe without an actual review.
- For real deployment in India, document the need for appropriate hospital/blood-bank onboarding, clinical validation, privacy/security review, and review of applicable legal/regulatory obligations.

### 11. API requirements

Create versioned REST endpoints under `/api/v1`. Include clear schemas and response codes. At minimum cover:
- Auth: login, logout/refresh as appropriate, current user.
- Hospital applications and approval.
- Hospital profile.
- Inventory listing, stock addition/adjustment, lot management, inventory history.
- Public blood search.
- Request creation and requester-only status.
- Hospital request review.
- Reservation create/cancel/expire.
- Authorized fulfilment/issue transition.
- Admin overview, audit logs, analytics.
- Health/readiness endpoints that do not leak secrets.

Use `401` for unauthenticated, `403` for unauthorized, `404` where appropriate, `409` for stock conflicts/state conflicts, and validation errors with safe details. Document endpoints in `docs/API.md`; FastAPI OpenAPI should be usable.

### 12. Demo experience and seed data

Provide a repeatable seed command that creates clearly fictional demo hospitals, inventory lots, and test users. Never use real patient information.

Create development accounts through a safe bootstrap command or environment variables and print credentials only in the local development setup instructions. Do not hard-code default production credentials. If demo credentials are provided, force a clear development-only warning and require changing them before any non-development deployment.

Include a scripted demo flow:
1. Start the local services.
2. Log in as super admin.
3. Approve a demo hospital.
4. Log in as that hospital.
5. Add demo inventory.
6. Search as a requester.
7. Create a reservation.
8. Simulate a second conflicting request.
9. Show the conflict and updated availability.
10. Review the audit trail.

### 13. Required project files

Create a clean structure similar to:

```text
BloodConnect/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── README.md
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── main.py
│   ├── alembic/
│   ├── tests/
│   ├── pyproject.toml or requirements files
│   └── README.md
├── docs/
│   ├── IMPLEMENTATION_STATUS.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE_DESIGN.md
│   ├── API.md
│   ├── SECURITY.md
│   ├── TEST_PLAN.md
│   ├── DEMO_SCRIPT.md
│   └── SIH_PITCH.md
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

Adjust structure if needed, but preserve clear separation of concerns.

### 14. SIH documentation

Prepare concise, technically accurate documentation:
- Problem statement and target users (do not falsely claim an official SIH problem ID).
- Proposed solution and measurable goals.
- Architecture diagram (Mermaid source).
- ER diagram (Mermaid source).
- Data flow and reservation sequence diagram.
- API endpoint guide.
- Security and privacy considerations.
- Test plan and actual test results.
- Limitations and future scope.
- Demo script with the concurrency scenario.
- A 60–90 second pitch and a concise presentation outline.

State that BloodConnect is a proposed project unless a matching official problem statement is later verified. Do not invent an SIH problem ID, official sponsor, partnerships, pilot deployment, hospital adoption, or measured outcomes.

### 15. Definition of done

Do not mark the project complete until:
- The frontend starts locally.
- The backend starts locally.
- Database migrations run from a clean database.
- Authentication and server-side roles work.
- Hospital data isolation is tested.
- Inventory operations create audit/ledger entries.
- Search returns only eligible stock and labels demo data.
- The reservation concurrency test passes on PostgreSQL.
- Idempotency and expiry/cancellation are tested.
- The documentation contains accurate commands and limitations.
- Any unimplemented features are explicitly listed in `docs/IMPLEMENTATION_STATUS.md`.

### 16. Start now

First inspect the workspace and available tools. Then:
1. Summarize the existing state briefly.
2. Create the implementation checklist and architecture.
3. Implement the foundation and database setup.
4. Run the available checks.
5. Continue through the core workflow instead of stopping after the first scaffold.
6. At the end of each stage, report what was implemented, the exact commands to run on Windows PowerShell, test results, and any blockers.

Do not merely tell me how to build it. Make the changes in the workspace and run the checks you can. If a required action is unavailable, explain the blocker and continue with everything else possible.

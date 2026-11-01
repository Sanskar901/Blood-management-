# BloodConnect — Smart India Hackathon Prototype

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB.svg?style=flat&logo=React&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-3178C6.svg?style=flat&logo=TypeScript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1.svg?style=flat&logo=PostgreSQL&logoColor=white)](https://www.postgresql.org)
[![Pytest](https://img.shields.io/badge/Pytest-Verified%20100%25-brightgreen.svg?style=flat)](https://docs.pytest.org)

> **Notice**: BloodConnect is a prototype platform for emergency multi-hospital blood discovery, compatibility-checked routing, and pessimistic atomic reservations. All seed data and demonstrated inventory are strictly fictional (`DEMO DATA — NOT LIVE HOSPITAL AVAILABILITY`).

---

## 🚀 Key Features

1. **Pessimistic Atomic Reservation Engine**:
   - Uses PostgreSQL `SELECT ... FOR UPDATE` row-level locking.
   - Enforces the invariant: **zero overbooking, zero negative stock** during simultaneous competing requests.
   - Enforces unique `idempotency_key` deduplication.
2. **Component-Specific Discovery & Ranking**:
   - Searches distinct blood groups (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`) across individual components (Whole Blood, PRBC, Platelets, Plasma, Cryoprecipitate).
   - Ranks hospitals able to fully fulfil requested quantity first, followed by verified straight-line distance via Haversine calculation.
3. **Strict Hospital Tenant Isolation**:
   - Hospital staff can access and manage stock only for their own hospital. Cross-hospital access attempts trigger HTTP 403 Forbidden and are recorded in audit logs.
4. **Append-Only Immutable Stock Ledger**:
   - Every donation batch inflow, reservation hold, cancellation release, and verified issue writes an immutable transaction record.
5. **Super Admin Regulatory Portal**:
   - Hospital onboarding verification (`PENDING` -> `APPROVED` / `REJECTED` / `SUSPENDED`).
   - Cross-hospital stock explorer with CSV download.
   - Full system audit trail explorer.
6. **Requester Privacy**:
   - Requesters can track emergency holds and progress using random 64-character tracking tokens without exposing sensitive patient medical records.

---

## 📁 Repository Structure

```text
blood management system/
├── frontend/                     # React 18 + Vite + TypeScript frontend
│   ├── src/
│   │   ├── components/           # Navbar, Footer, Zero-dependency Icons
│   │   ├── context/              # AuthContext (Role-based access state)
│   │   ├── pages/                # Landing, Search, Tracker, Hospital, Admin, Login, Apply
│   │   ├── services/             # API client service
│   │   ├── types/                # TypeScript interface definitions
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.ts
├── backend/                      # Python 3.13 + FastAPI async backend
│   ├── app/
│   │   ├── api/v1/               # Versioned REST endpoints (auth, hospitals, inventory, search, etc.)
│   │   ├── core/                 # Config, async database engine with auto-fallback, JWT security
│   │   ├── models/               # SQLAlchemy 2.x declarative models
│   │   ├── schemas/              # Pydantic v2 validation schemas
│   │   ├── services/             # Atomic reservation engine & Haversine search service
│   │   ├── seed.py               # Fictional demo seeder
│   │   └── main.py               # FastAPI application entrypoint
│   ├── tests/                    # Pytest suite (auth, isolation, pessimistic concurrency)
│   └── requirements.txt
├── docs/
│   ├── IMPLEMENTATION_STATUS.md  # Detailed implementation checklist
│   ├── ARCHITECTURE.md           # System architecture & Mermaid sequence diagrams
│   ├── DATABASE_DESIGN.md        # ER diagram & inventory invariants
│   ├── API.md                    # REST API endpoint reference
│   ├── SECURITY.md               # RBAC, tenant isolation & privacy rules
│   ├── TEST_PLAN.md              # Test specifications
│   ├── DEMO_SCRIPT.md            # Step-by-step judge demonstration guide
│   └── SIH_PITCH.md              # 90-second pitch script
├── docker-compose.yml            # PostgreSQL 16 local container configuration
├── .env.example                  # Environment configuration example
└── README.md
```

---

## 💻 Quickstart (Windows PowerShell)

### Prerequisites
- Python 3.13 (or 3.10+)
- Node.js v20+ and npm

### 1. Backend Setup & Run

**Option A (From the project root `blood management system`):**
```powershell
python run_backend.py
```
*or:*
```powershell
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

**Option B (From inside the `backend` folder):**
```powershell
cd "backend"
python run.py
```
*or:*
```powershell
cd "backend"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation (Swagger UI): `http://127.0.0.1:8000/api/v1/docs`

### 2. Frontend Setup
```powershell
# In a separate terminal, navigate to frontend directory
cd "frontend"

# Start the Vite development server
npm run dev
```
Open web app: `http://localhost:5173`

### 3. Run Automated Tests
```powershell
python -m pytest backend/tests -v
```

---

## ☁️ Demo Deployment (Vercel + Render)

Deploy the backend and database separately, then deploy the `frontend` directory
as a Vite project on Vercel.

1. In Vercel, import this repository and set **Root Directory** to `frontend`.
   Use `npm run build` as the build command and `dist` as the output directory.
2. In Vercel project settings, add the `VITE_API_BASE_URL` environment variable
   with the backend URL followed by `/api/v1`, for example:
   `https://your-backend.onrender.com/api/v1`. Redeploy after changing it.
3. In the backend hosting service, set `BACKEND_CORS_ORIGINS` to a JSON array
   containing the exact Vercel site origin, for example:
   `["https://your-app.vercel.app"]`. Include any Vercel preview origins you
   intend to use.
4. Confirm the backend `/health` endpoint reports a healthy database, then test
   the deployed frontend. Use fictional demo data only; this prototype is not
   intended for real patient or live hospital inventory data.

For local development, leave `VITE_API_BASE_URL` unset; Vite continues to proxy
`/api` requests to `http://127.0.0.1:8000`.

---

## 🔑 Demo Accounts (Pre-configured)

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **Super Admin** | `admin@bloodconnect.local` | `Admin@BloodConnect2026!` | Hospital approvals, platform-wide inventory, audit trail, CSV export |
| **Hospital Staff** | `staff@apollo.local` | `Hospital@12345` | Apollo City Blood Centre stock, batch registration, request fulfillment |
| **Public Requester** | `requester@demo.local` | `Requester@12345` | Search inventory, submit emergency requests, place 30-min holds |

# BloodConnect — System Architecture

## 1. High-Level Architecture Overview

BloodConnect is built as a multi-tier, decoupled architecture designed for high integrity, horizontal scalability, and strict hospital data isolation.

```mermaid
graph TD
    subgraph Client Tier
        Browser["React 18 + Vite Web App (TypeScript & Tailwind)"]
        PublicUser["Public Requester"]
        HospStaff["Hospital Blood Bank Staff"]
        SuperAdmin["Super Admin"]
    end

    subgraph API & Application Tier
        FastAPI["FastAPI 0.115+ (Python 3.13)"]
        AuthMiddleware["JWT & RBAC Middleware"]
        SearchEngine["Haversine Geolocation & Compatibility Filter"]
        ReservationEngine["Atomic Reservation Engine (Pessimistic Locking)"]
    end

    subgraph Data & Persistence Tier
        DB[("PostgreSQL 16 / Async Engine")]
        Ledger["Immutable Inventory Transaction Ledger"]
        Audit["Audit Log Trail"]
    end

    PublicUser --> Browser
    HospStaff --> Browser
    SuperAdmin --> Browser

    Browser -->|REST API / HTTPS| FastAPI
    FastAPI --> AuthMiddleware
    AuthMiddleware --> SearchEngine
    AuthMiddleware --> ReservationEngine
    ReservationEngine -->|SELECT FOR UPDATE / Atomic TX| DB
    ReservationEngine --> Ledger
    FastAPI --> Audit
```

---

## 2. Reservation Concurrency Sequence

The core mission of BloodConnect is guaranteeing that competing blood reservation requests never lead to over-reservation or negative stock.

```mermaid
sequenceDiagram
    autonumber
    actor Requester1 as Requester A
    actor Requester2 as Requester B
    participant API as FastAPI Reservation Service
    participant DB as PostgreSQL Transaction

    Requester1->>API: POST /reservations (Hospital H1, 4 units, Idempotency-Key: X)
    Requester2->>API: POST /reservations (Hospital H1, 4 units, Idempotency-Key: Y)
    
    rect rgb(235, 245, 255)
        Note over API,DB: Transaction A starts (Isolation level READ COMMITTED)
        API->>DB: SELECT * FROM inventory_balances WHERE hospital_id=H1 FOR UPDATE
        Note over DB: Row locked by Transaction A
    end

    rect rgb(255, 240, 240)
        Note over API,DB: Transaction B starts
        API->>DB: SELECT * FROM inventory_balances WHERE hospital_id=H1 FOR UPDATE
        Note over DB: Transaction B BLOCKS waiting for Transaction A lock
    end

    Note over API,DB: Tx A checks: Available = 5, Requested = 4 (Sufficient!)
    API->>DB: UPDATE inventory_balances SET reserved = reserved + 4
    API->>DB: INSERT INTO reservations (status='ACTIVE', qty=4, idempotency_key='X')
    API->>DB: INSERT INTO inventory_transactions (type='RESERVATION', qty=-4)
    API->>DB: COMMIT Transaction A
    Note over DB: Lock released!
    API-->>Requester1: HTTP 201 Created (Reservation Confirmed, Token Issued)

    rect rgb(255, 240, 240)
        Note over DB: Transaction B unblocks and acquires lock
        Note over API,DB: Tx B checks: Available = 5 - 4 = 1, Requested = 4 (Insufficient!)
        API->>DB: ROLLBACK Transaction B
        API-->>Requester2: HTTP 409 Conflict (Stock insufficient, only 1 unit available)
    end
```

---

## 3. Hospital Tenant Data Isolation

1. **Authentication Context**: Every authenticated request sets a `CurrentUser` dependency containing user ID, role, and associated `hospital_id`.
2. **Server-Side Enforcement**: Hospital staff endpoints enforce:
   ```python
   if current_user.role == UserRole.HOSPITAL_STAFF and current_user.hospital_id != target_hospital_id:
       raise HTTPException(status_code=403, detail="Access denied to other hospital data")
   ```
3. **Database Scoping**: All inventory queries executed by hospital staff implicitly filter by `hospital_id == current_user.hospital_id`.

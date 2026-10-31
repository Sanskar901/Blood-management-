# BloodConnect — Database Design & Schema Specification

## 1. Entity Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--o| HOSPITALS : "belongs to (optional)"
    HOSPITALS ||--o{ INVENTORY_LOTS : "holds"
    HOSPITALS ||--o{ INVENTORY_BALANCES : "tracks aggregate"
    INVENTORY_LOTS }|--|| BLOOD_PRODUCTS : "is instance of"
    HOSPITALS ||--o{ BLOOD_REQUESTS : "fulfils"
    USERS ||--o{ BLOOD_REQUESTS : "submits"
    BLOOD_REQUESTS ||--o| RESERVATIONS : "results in"
    RESERVATIONS ||--o{ INVENTORY_TRANSACTIONS : "generates ledger"
    HOSPITALS ||--o{ INVENTORY_TRANSACTIONS : "logs stock movements"
    USERS ||--o{ AUDIT_LOGS : "triggers"

    USERS {
        uuid id PK
        string email UK
        string hashed_password
        string role
        string status
        uuid hospital_id FK
        datetime created_at
    }

    HOSPITALS {
        uuid id PK
        string name
        string licence_number UK
        string address
        string pin_code
        float latitude
        float longitude
        string contact_phone
        string approval_status
        boolean is_active
        datetime created_at
    }

    BLOOD_PRODUCTS {
        uuid id PK
        string blood_group
        string component_type
        string storage_temp_c
    }

    INVENTORY_LOTS {
        uuid id PK
        uuid hospital_id FK
        uuid product_id FK
        string batch_number
        integer quantity
        date donation_date
        date expiry_date
        string verification_status
    }

    INVENTORY_BALANCES {
        uuid id PK
        uuid hospital_id FK
        uuid product_id FK
        integer total_units
        integer reserved_units
        integer available_units
        integer version
        datetime updated_at
    }

    BLOOD_REQUESTS {
        uuid id PK
        uuid requester_id FK
        uuid hospital_id FK
        uuid product_id FK
        integer units_requested
        string urgency_level
        string patient_reference_code
        string status
        string tracking_token UK
        datetime created_at
    }

    RESERVATIONS {
        uuid id PK
        uuid request_id FK
        uuid hospital_id FK
        uuid product_id FK
        integer units_reserved
        string idempotency_key UK
        string status
        datetime expires_at
        datetime created_at
    }

    INVENTORY_TRANSACTIONS {
        uuid id PK
        uuid hospital_id FK
        uuid product_id FK
        uuid lot_id FK
        string transaction_type
        integer quantity_delta
        string reason
        uuid actor_id FK
        datetime created_at
    }

    AUDIT_LOGS {
        uuid id PK
        uuid actor_id FK
        string action
        string target_type
        string target_id
        jsonb metadata
        datetime created_at
    }
```

---

## 2. Inventory Invariants & Constraints

1. **Available Units Formula**:
   $$\text{available\_units} = \text{total\_units} - \text{reserved\_units}$$
   Enforced via `CHECK (available_units >= 0)` and `CHECK (reserved_units >= 0)`.
2. **Deterministic Locking Order**:
   When multiple balances/lots are locked during a reservation, queries lock in ascending ID order (`ORDER BY id ASC`) to eliminate circular wait conditions (deadlocks).
3. **Idempotency Guarantee**:
   `idempotency_key` in `RESERVATIONS` is marked `UNIQUE`. Duplicate submission of the same key returns the existing reservation without duplicate stock deductions.
4. **Immutable Ledger**:
   `INVENTORY_TRANSACTIONS` is append-only. Stock adjustments, incoming donations, expirations, reservations, and cancellations always write a delta entry.

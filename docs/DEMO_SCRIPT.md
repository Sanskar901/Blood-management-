# BloodConnect — Live Demonstration Script

> **Notice**: All data demonstrated is fictional seed data created exclusively for testing and validation (`DEMO DATA — NOT LIVE HOSPITAL AVAILABILITY`).

---

## 🎭 Step-by-Step Walkthrough

### Step 1: Bootstrapping & Super Admin Login
1. Open frontend at `http://localhost:5173`.
2. Click **Login** and authenticate as Super Admin (`admin@bloodconnect.local` / `Admin@BloodConnect2026!`).
3. View the system overview: total onboarded hospitals, global units, and shortage notices.
4. Navigate to **Hospital Verification**; review pending application for "Apollo City Blood Centre" and click **Approve Hospital**.

### Step 2: Hospital Staff Stock Management
1. Log out, then log in as Hospital Staff (`staff@apollo.local` / `Hospital@12345`).
2. Navigate to **Inventory Management**.
3. Add a new lot: `O+` Whole Blood, 10 units, batch `#LOT-2026-001`, expiry date 35 days in the future.
4. View the immutable **Stock Ledger** proving an incoming stock audit record was created.

### Step 3: Public Requester Discovery & Reservation
1. Open an incognito/new window as a member of the public.
2. Enter Search: Blood Group `O+`, Component `Whole Blood`, Quantity `4`, Location: `PIN 110001` or Geolocation.
3. Review ranked hospital list showing Apollo City Blood Centre with 10 available units.
4. Click **Request & Reserve**. Enter minimum emergency patient reference and confirm hold.
5. Receive confirmation with a unique **Tracking Token** and 30-minute hold countdown.

### Step 4: Concurrency & Conflict Demonstration
1. In another session, simulate a second emergency request for 8 units at the same hospital (where only 6 units remain available: $10 - 4 = 6$).
2. The system evaluates stock inside an atomic transaction, detects $6 < 8$, and returns a clear `HTTP 409 Conflict: Only 6 units available`.
3. Notice that stock never becomes negative and the first reservation remains fully protected.

### Step 5: Verification & Fulfilment
1. Switch back to Hospital Staff portal.
2. View the incoming reservation with tracking code.
3. Verify physical patient cross-match checklist and click **Confirm Issue & Fulfil**.
4. Stock status transitions to `FULFILLED`; reservation concludes and ledger reflects final issue.

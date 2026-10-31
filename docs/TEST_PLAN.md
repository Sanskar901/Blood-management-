# BloodConnect — Test Plan & Concurrency Verification

## 1. Objectives
The BloodConnect test suite verifies:
1. **Pessimistic Concurrency**: When 2 simultaneous requests attempt to reserve more stock than is available, only one succeeds and the other receives HTTP 409 Conflict without negative stock.
2. **Idempotency**: Retrying with the same idempotency key produces the exact same reservation without double-decrementing stock.
3. **Data Isolation**: Hospital staff users cannot read or mutate another hospital's stock or requests.
4. **Lifecycle Transitions**: Requests move strictly through permitted state transitions (`SUBMITTED` -> `RESERVED` -> `FULFILLED` / `CANCELLED`).

---

## 2. Concurrency Test Specification

```python
# Conceptual concurrency test:
async def test_concurrent_reservations_prevent_overbooking():
    # Initial balance: 5 units of O+ Whole Blood
    # 2 concurrent tasks, each requesting 4 units
    results = await asyncio.gather(
        make_reservation(units=4, key="req-1"),
        make_reservation(units=4, key="req-2"),
        return_exceptions=True
    )
    # Exactly one must succeed (HTTP 201), one must fail (HTTP 409 Conflict)
    # Final available units MUST be 1
```

---

## 3. Execution Commands
```powershell
# Run backend pytest suite
cd backend
python -m pytest tests/ -v
```

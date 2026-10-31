# BloodConnect — Smart India Hackathon (SIH) Pitch & Project Summary

## 📌 Proposed Problem Context
Across regional healthcare systems, families and emergency responders face immense distress during critical medical events due to fragmented, siloed hospital blood inventories. People are forced to make desperate phone calls or travel blindly between blood banks, frequently encountering stockouts or stale telephone information. Concurrently, uncoordinated holds can lead to double-booking and wasted life-saving units.

---

## 💡 The BloodConnect Solution
**BloodConnect** is a unified multi-hospital blood inventory discovery and atomic reservation platform. It bridges public requesters and verified blood banks with:
1. **Live Geolocation-Ranked Discovery**: Instantly find nearest verified blood banks that have sufficient component-specific stock.
2. **Pessimistic Atomic Reservation**: A 30-minute temporary reservation engine backed by database-level row locking to eliminate overbooking and guarantee zero negative stock.
3. **Immutable Inventory Ledger**: Every donation, adjustment, reservation, and issue is logged in an append-only audit trail.
4. **Strict Tenant Isolation**: Hospital staff manage exclusively their own stock; sensitive requester details remain strictly confidential.

---

## ⏱️ 90-Second Pitch Script

> *"Judges, imagine a family member needing rare O-negative blood in an ICU. Today, families make frantic calls, running blindly from hospital to hospital, only to be told 'we just gave away our last unit 5 minutes ago.'*
> 
> *BloodConnect solves this with real-time discovery and atomic reservation. A doctor or requester enters the needed blood group, component, and location. Our engine instantly ranks nearby verified hospitals with confirmed available stock.*
> 
> *With one click, they place an atomic 30-minute emergency hold. Using PostgreSQL row-level locks, BloodConnect guarantees that even if ten emergency requests hit the exact same inventory simultaneously, over-reservation is mathematically impossible. Negative stock cannot occur.*
> 
> *Hospitals retain full control with strictly isolated multi-tenant portals and tamper-evident audit ledgers. BloodConnect transforms high-stress chaos into a transparent, dependable, and life-saving digital bridge."*

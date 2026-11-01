import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.seed import seed_initial_demo_data
from backend.app.models.hospital import Hospital
from backend.app.models.enums import HospitalStatus, UserRole

@pytest.mark.asyncio
async def test_admin_operations_flow(client: AsyncClient, db_session: AsyncSession):
    # Seed demo data
    await seed_initial_demo_data(db_session)

    # 1. Login as Super Admin
    login_res = await client.post(
        "/api/v1/auth/login",
        data={
            "username": "admin@bloodconnect.local",
            "password": "Admin@BloodConnect2026!"
        }
    )
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {token}"}

    # 2. Test list all hospitals
    hosp_res = await client.get("/api/v1/hospitals", headers=admin_headers)
    assert hosp_res.status_code == 200, f"List hospitals failed: {hosp_res.text}"
    hospitals = hosp_res.json()
    assert len(hospitals) >= 3
    # Check that contact_email is present and serialized properly
    assert any(h["contact_email"] == "bloodbank@apollo.local" for h in hospitals)

    # 3. Test list pending hospitals
    pending_res = await client.get("/api/v1/hospitals?status_filter=PENDING", headers=admin_headers)
    assert pending_res.status_code == 200
    pending_hospitals = pending_res.json()
    assert len(pending_hospitals) >= 1
    pending_id = pending_hospitals[0]["id"]

    # 4. Test admin dashboard metrics
    dash_res = await client.get("/api/v1/admin/dashboard", headers=admin_headers)
    assert dash_res.status_code == 200, f"Admin dashboard failed: {dash_res.text}"
    metrics = dash_res.json()
    assert metrics["total_hospitals"] >= 3
    assert metrics["pending_approvals"] >= 1
    assert metrics["active_hospitals"] >= 2
    assert metrics["total_units_in_stock"] > 0

    # 5. Test approve pending hospital
    approve_res = await client.patch(
        f"/api/v1/hospitals/{pending_id}/status",
        json={"approval_status": "APPROVED", "reason": "Verified state blood council licence."},
        headers=admin_headers
    )
    assert approve_res.status_code == 200, f"Approve hospital failed: {approve_res.text}"
    approved_hosp = approve_res.json()
    assert approved_hosp["approval_status"] == "APPROVED"
    assert approved_hosp["is_active"] is True

    # 6. Test audit logs
    audit_res = await client.get("/api/v1/admin/audit-logs", headers=admin_headers)
    assert audit_res.status_code == 200, f"Audit logs failed: {audit_res.text}"
    logs = audit_res.json()
    assert len(logs) >= 1
    status_change_log = next(l for l in logs if l["action"] == "HOSPITAL_STATUS_CHANGED")
    assert "PENDING to APPROVED" in status_change_log["details"]

    # 7. Test CSV inventory export
    export_res = await client.get("/api/v1/admin/export/inventory", headers=admin_headers)
    assert export_res.status_code == 200, f"CSV export failed: {export_res.text}"
    assert "text/csv" in export_res.headers.get("content-type", "")
    assert "Hospital ID,Hospital Name" in export_res.text
    assert "CONFIDENTIAL MEDICAL AUDIT" in export_res.text

    # 8. Unauthenticated CSV export should fail with 401
    unauth_export = await client.get("/api/v1/admin/export/inventory")
    assert unauth_export.status_code == 401

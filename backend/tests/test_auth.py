import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_health_endpoint(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "BloodConnect"
    assert "regulatory_compliance" in data or "disclaimer" in data

@pytest.mark.asyncio
async def test_user_registration_and_login(client: AsyncClient):
    # Register public user
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "test_donor@example.com",
            "password": "SecurePassword123!",
            "full_name": "Test Donor",
            "phone_number": "+91-9876543210"
        }
    )
    assert reg_res.status_code == 201
    user_data = reg_res.json()
    assert user_data["email"] == "test_donor@example.com"
    assert user_data["role"] == "PUBLIC_REQUESTER"

    # Login
    login_res = await client.post(
        "/api/v1/auth/login",
        data={
            "username": "test_donor@example.com",
            "password": "SecurePassword123!"
        }
    )
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    token = token_data["access_token"]

    # Access /me
    me_res = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "test_donor@example.com"

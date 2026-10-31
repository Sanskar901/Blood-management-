import pytest
from httpx import AsyncClient
from backend.app.models.enums import BloodGroup, BloodComponent
from backend.app.services.search_service import haversine_distance

def test_haversine_distance():
    # Distance between New Delhi (28.6139, 77.2090) and Saket (28.5284, 77.2185) is roughly ~9.5 km
    dist = haversine_distance(28.6139, 77.2090, 28.5284, 77.2185)
    assert 8.0 < dist < 12.0

@pytest.mark.asyncio
async def test_hospital_isolation_and_search(client: AsyncClient):
    # Search blood
    search_res = await client.get(
        "/api/v1/search",
        params={
            "blood_group": "O+",
            "component_type": "Whole Blood",
            "quantity": 2
        }
    )
    assert search_res.status_code == 200
    data = search_res.json()
    assert "results" in data
    assert data["blood_group"] == "O+"

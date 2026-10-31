from fastapi import APIRouter
from backend.app.api.v1 import (
    auth,
    hospitals,
    inventory,
    search,
    requests,
    reservations,
    admin,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(hospitals.router)
api_router.include_router(inventory.router)
api_router.include_router(search.router)
api_router.include_router(requests.router)
api_router.include_router(reservations.router)
api_router.include_router(admin.router)

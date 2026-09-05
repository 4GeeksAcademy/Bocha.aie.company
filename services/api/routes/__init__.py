from services.api.routes.suppliers import router as suppliers_router
from services.api.routes.auth import router as auth_router
from services.api.routes.profiles import router as profiles_router
from services.api.routes.users import router as users_router
from services.api.routes.incidents import router as incidents_router

__all__ = [
	"auth_router",
	"profiles_router",
	"suppliers_router",
	"users_router",
	"incidents_router",
]

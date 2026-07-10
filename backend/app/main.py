from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.zones import router as zones_router
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.drivers import router as drivers_router
from app.api.sensor_data import router as sensor_data_router
from app.api.volume_predictions import router as volume_predictions_router
from app.api.citizen_reports import router as citizen_reports_router
from app.api.route_recommendations import router as route_recommendations_router
from app.api.dashboard import router as dashboard_router
from app.api.fleets import router as fleets_router

app = FastAPI(title="Samling API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles
import os
uploads_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "uploads"))
if not os.path.exists(uploads_dir):
    os.makedirs(uploads_dir)
app.mount("/api/v1/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Global Exception Handler untuk Starlette/FastAPI HTTPException
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail
        }
    )

# Global Exception Handler untuk Validasi Input (Request Validation Error)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    error_messages = []
    for err in errors:
        loc = " -> ".join(str(x) for x in err.get("loc", []))
        msg = err.get("msg", "Validasi gagal")
        error_messages.append(f"[{loc}]: {msg}")
    
    combined_message = "; ".join(error_messages)
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": f"Validasi gagal: {combined_message}"
        }
    )

@app.get("/")
def root():
    return {"message": "Welcome to Samling API!"}

# Register all API routes under the /api/v1 prefix
app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(zones_router, prefix="/api/v1")
app.include_router(drivers_router, prefix="/api/v1")
app.include_router(sensor_data_router, prefix="/api/v1")
app.include_router(volume_predictions_router, prefix="/api/v1")
app.include_router(citizen_reports_router, prefix="/api/v1")
app.include_router(route_recommendations_router, prefix="/api/v1")
app.include_router(fleets_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
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

app = FastAPI(title="Samling API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
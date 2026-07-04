from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.zones import router as zones_router
from app.api.auth import router as auth_router
from app.api.users import router as users_router

app = FastAPI(title="Samling API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Welcome to Samling API!"}

# Register all API routes under the /api/v1 prefix
app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(zones_router, prefix="/api/v1")
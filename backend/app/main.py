from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.users import User
from app.utils.security import verify_password
from app.api import zones
from backend.app.schemas.auth import LoginRequest

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

@app.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()

    if not user or not verify_password(data.password, user.password):
        raise HTTPException(
            status_code=401, 
            detail="Username atau password salah."
        )
    
    return {
        "message": "Login berhasil!",
        "user_id": user.id,
        "role": user.role
    }

app.include_router(zones.router)
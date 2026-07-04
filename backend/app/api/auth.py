from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.users import User
from app.schemas.auth import LoginRequest
from app.utils.security import verify_password, create_access_token

router = APIRouter(tags=["authentication"])

@router.post("/auth/login")
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Mengautentikasi admin dan mengembalikan token JWT akses.
    """
    user = db.query(User).filter(User.username == login_data.username).first()
    
    # Validasi user & password
    if not user or not verify_password(login_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau password salah."
        )
        
    # Generate JWT Token dengan subject username
    access_token = create_access_token(data={"sub": user.username})
    
    return {
        "message": "Login berhasil!",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role
        }
    }

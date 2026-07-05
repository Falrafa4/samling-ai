from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.users import User
from app.schemas.auth import LoginRequest
from app.utils.security import verify_password, create_access_token
from app.utils.response import response_success

router = APIRouter(tags=["authentication"])

@router.post("/auth/login")
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Mengautentikasi user (secara umum) dan mengembalikan token JWT akses.
    """
    user = db.query(User).filter(User.username == login_data.username).first()
    
    # Validasi user & password
    if not user or not verify_password(login_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau password salah."
        )
        
    # Generate JWT Token dengan subject username dan role
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    
    return response_success(
        data={
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "username": user.username,
                "role": user.role
            }
        },
        message="Login berhasil!"
    )

@router.post("/auth/login/admin")
def login_admin(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    """
    Mengautentikasi admin dan mengembalikan token JWT akses. (Input Form Data)
    """
    user = db.query(User).filter(User.username == username, User.role == "admin").first()
    if not user or not verify_password(password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau password salah, atau Anda bukan admin."
        )
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    return response_success(
        data={
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "username": user.username,
                "role": user.role
            }
        },
        message="Login admin berhasil!"
    )

@router.post("/auth/login/driver")
def login_driver(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    """
    Mengautentikasi driver dan mengembalikan token JWT akses. (Input Form Data)
    """
    user = db.query(User).filter(User.username == username, User.role == "driver").first()
    if not user or not verify_password(password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau password salah, atau Anda bukan driver."
        )
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    return response_success(
        data={
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "username": user.username,
                "role": user.role
            }
        },
        message="Login driver berhasil!"
    )

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.users import User
from app.schemas.users import UserCreate, UserResponse
from app.utils.security import get_password_hash
from app.api.deps import get_current_user

router = APIRouter(tags=["users"])

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_admin(
    user_data: UserCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # Hanya admin terautentikasi yang bisa membuat admin baru
):
    """
    Mendaftarkan admin baru (hanya dapat dipanggil jika admin lama terautentikasi).
    """
    # Cek keunikan username
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username sudah terdaftar."
        )
        
    # Enkripsi password menggunakan helper native bcrypt
    hashed_password = get_password_hash(user_data.password)
    
    new_user = User(
        username=user_data.username,
        password=hashed_password,
        role=user_data.role
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional
from app.core.config import settings

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Membuat JWT access token.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    """
    Mendecode JWT access token dan mengembalikan payload. Mengembalikan None jika tidak valid atau kedaluwarsa.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except (jwt.PyJWTError, jwt.ExpiredSignatureError):
        return None

def get_password_hash(password: str) -> str:
    """
    Menghasilkan hash bcrypt satu arah yang aman dengan salt otomatis menggunakan library native bcrypt.
    """
    # Ubah password string menjadi bytes
    password_bytes = password.encode('utf-8')
    # Generate salt otomatis dan hash password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    # Decode hasil hash kembali ke string untuk disimpan di database
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Memverifikasi apakah password mentah cocok dengan hash password yang tersimpan di DB.
    """
    # Ubah input menjadi bytes
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    # Bandingkan menggunakan utility aman dari bcrypt
    return bcrypt.checkpw(password_bytes, hashed_bytes)

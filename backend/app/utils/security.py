import bcrypt

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

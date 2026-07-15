from datetime import datetime
from zoneinfo import ZoneInfo

def get_jakarta_now() -> datetime:
    """
    Mengembalikan waktu saat ini di timezone Asia/Jakarta (UTC+7)
    sebagai naive datetime object. Cocok untuk penyimpanan SQLite.
    """
    return datetime.now(ZoneInfo("Asia/Jakarta")).replace(tzinfo=None)

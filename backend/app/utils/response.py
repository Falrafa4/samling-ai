from fastapi.responses import JSONResponse
from typing import Any

def response_success(data: Any = None, message: str = "Success") -> dict:
    """
    Membungkus respon sukses dalam format JSON standar.
    """
    return {
        "success": True,
        "message": message,
        "data": data
    }

def response_error(message: str = "Error", status_code: int = 400) -> JSONResponse:
    """
    Membungkus respon error dalam format JSON standar.
    """
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "message": message
        }
    )

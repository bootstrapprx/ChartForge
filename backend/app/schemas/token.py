from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: str
    expires_in: int
    x_refresh_token_expires_in: int

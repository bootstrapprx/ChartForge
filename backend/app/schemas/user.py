from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from uuid import UUID

# User schemas
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    id: Optional[UUID] = None
    is_superuser: Optional[bool] = None

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None

class UserResponse(UserBase):
    id: UUID
    is_active: bool
    is_superuser: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Database configuration schemas
class DatabaseConfigBase(BaseModel):
    db_host: str = Field(..., description="Database host")
    db_port: str = Field(default="5432", description="Database port")
    db_name: str = Field(..., description="Database name")
    db_user: str = Field(..., description="Database user")
    db_password: str = Field(..., description="Database password")

class DatabaseConfigCreate(DatabaseConfigBase):
    pass

class DatabaseConfigResponse(BaseModel):
    id: UUID
    user_id: UUID
    db_host: str
    db_port: str
    db_name: str
    db_user: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

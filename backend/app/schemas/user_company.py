from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class UserCompanyBase(BaseModel):
    company_id: UUID
    is_admin: bool = False
    can_edit: bool = True
    can_view: bool = True

class UserCompanyCreate(UserCompanyBase):
    user_id: UUID

class UserCompanyUpdate(BaseModel):
    is_admin: Optional[bool] = None
    can_edit: Optional[bool] = None
    can_view: Optional[bool] = None

class UserCompanyResponse(UserCompanyBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


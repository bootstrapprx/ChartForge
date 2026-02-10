import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional, Any, Dict

class CompanyAccountBase(BaseModel):
    code: str
    description: str
    type: str
    parent_code: Optional[str] = None
    name: Optional[str] = None
    currency: Optional[str] = "USD"
    is_active: Optional[bool] = True
    master_account_code: Optional[str] = None
    json_data: Optional[Dict[str, Any]] = None

class CompanyAccountCreate(CompanyAccountBase):
    company_id: uuid.UUID

class CompanyAccountSchema(CompanyAccountBase):
    id: uuid.UUID
    company_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

__all__ = ["CompanyAccountBase", "CompanyAccountCreate", "CompanyAccountSchema"]
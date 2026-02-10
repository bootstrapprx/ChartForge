from __future__ import annotations
import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional

class AccountMappingBase(BaseModel):
    master_code: Optional[str] = None
    confidence: float
    status: str
    notes: Optional[str] = None

class AccountMappingCreate(AccountMappingBase):
    company_account_id: uuid.UUID

class AccountMapping(AccountMappingBase):
    id: uuid.UUID
    company_account_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

from __future__ import annotations
import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional

class QboTokenBase(BaseModel):
    realm_id: str
    access_token: str
    refresh_token: str
    token_type: str
    expires_at: datetime

class QboTokenCreate(QboTokenBase):
    company_id: uuid.UUID

class QboToken(QboTokenBase):
    id: uuid.UUID
    company_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

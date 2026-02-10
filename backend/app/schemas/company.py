from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr

class CompanyBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    tax_id: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyInactivate(BaseModel):
    confirmation: str

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    tax_id: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None

class CompanyResponse(CompanyBase):
    id: UUID
    ucid: str
    is_active: bool = True
    
    class Config:
        from_attributes = True

class CompanyListStats(BaseModel):
    total: int
    active: int
    inactive: int

class CompanyListResponse(BaseModel):
    active: list[CompanyResponse]
    inactive: list[CompanyResponse]
    stats: CompanyListStats

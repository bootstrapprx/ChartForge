import uuid
from datetime import date
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, field_validator
from .company_account import CompanyAccountSchema


# --- Base and Common Schemas ---

class MasterAccountBase(BaseModel):
    """Base Pydantic model for MasterAccount attributes with all enriched fields."""
    # Core fields
    code: Optional[str] = None  # Code can be optional on creation for auto-generation
    description: str
    long_description: Optional[str] = None
    type: str  # "Header" or "Detail" or "H"/"D"
    category: str
    fs_mapping: Optional[str] = None  # Balance Sheet, Income Statement
    parent_code: Optional[str] = None
    normal_balance: Optional[str] = None  # Debit or Credit
    
    # AI-related fields
    tags: Optional[List[str]] = None
    default_vendors: Optional[List[str]] = None
    
    # Compliance fields
    regulatory_mapping: Optional[str] = None  # IFRS/GAAP references
    
    # Lifecycle fields
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    notes: Optional[str] = None
    
    # Extended fields
    subcategory: Optional[str] = None
    cash_flow_classification: Optional[str] = None
    cost_center: Optional[str] = None
    gaap_classification: Optional[str] = None
    detailed_description: Optional[str] = None

    @field_validator('type')
    def validate_type(cls, v: str) -> str:
        if v.upper() not in ['H', 'D', 'HEADER', 'DETAIL']:
            raise ValueError('Type must be "H" (Header) or "D" (Detail)')
        return v

    @field_validator('normal_balance')
    def validate_normal_balance(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v.lower() not in ['debit', 'credit']:
            raise ValueError('Normal balance must be "Debit" or "Credit"')
        return v


class MasterAccountCreate(MasterAccountBase):
    """Schema for creating a new account. Code is optional for auto-generation."""
    pass


class MasterAccountUpdate(BaseModel):
    """Schema for updating an existing account. All fields are optional."""
    description: Optional[str] = None
    long_description: Optional[str] = None
    type: Optional[str] = None
    category: Optional[str] = None
    fs_mapping: Optional[str] = None
    normal_balance: Optional[str] = None
    tags: Optional[List[str]] = None
    default_vendors: Optional[List[str]] = None
    regulatory_mapping: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    notes: Optional[str] = None
    subcategory: Optional[str] = None
    cash_flow_classification: Optional[str] = None
    cost_center: Optional[str] = None
    gaap_classification: Optional[str] = None
    detailed_description: Optional[str] = None

    @field_validator('type')
    def validate_type(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v.upper() not in ['H', 'D', 'HEADER', 'DETAIL']:
            raise ValueError('Type must be "H" (Header) or "D" (Detail)')
        return v

    @field_validator('normal_balance')
    def validate_normal_balance(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v.lower() not in ['debit', 'credit']:
            raise ValueError('Normal balance must be "Debit" or "Credit"')
        return v


# --- API Response Schemas ---

class MasterAccountSchema(MasterAccountBase):
    """
    Schema for representing a single account in API responses (flat structure).
    """
    id: uuid.UUID
    level: int
    code: str  # Code is not optional in responses
    parent_id: Optional[uuid.UUID] = None
    version: int = 1
    company_accounts: List[CompanyAccountSchema] = []

    model_config = ConfigDict(from_attributes=True)


class MasterAccountTree(MasterAccountSchema):
    """
    Recursive schema for representing an account and its children in a tree structure.
    """
    children: List['MasterAccountTree'] = []


class MasterAccountSummary(BaseModel):
    """Lightweight schema for account suggestions and listings."""
    id: uuid.UUID
    code: str
    description: str
    category: str
    type: str
    normal_balance: Optional[str] = None
    tags: Optional[List[str]] = None

    model_config = ConfigDict(from_attributes=True)


# --- Import/Preview Schemas ---

class ImportPreviewItem(BaseModel):
    """Schema for a single item in import preview."""
    code: str
    description: str
    action: str  # "create", "update", "skip", "error"
    changes: Optional[dict] = None
    errors: Optional[List[str]] = None
    warnings: Optional[List[str]] = None
    suggested_corrections: Optional[dict] = None


class ImportPreviewResult(BaseModel):
    """Schema for import preview results."""
    total_records: int
    to_create: int
    to_update: int
    to_skip: int
    errors: int
    warnings: int
    items: List[ImportPreviewItem]
    validation_summary: dict


class ImportResult(BaseModel):
    """Schema for import execution results."""
    success: bool
    created: int
    updated: int
    skipped: int
    errors: List[dict]
    version_id: Optional[uuid.UUID] = None


# --- Version Schemas ---

class COAVersionInfo(BaseModel):
    """Schema for COA version information."""
    id: uuid.UUID
    version_number: int
    created_at: str
    created_by: Optional[str] = None
    description: Optional[str] = None
    account_count: int
    change_summary: Optional[dict] = None

    model_config = ConfigDict(from_attributes=True)


class COAVersionDetail(COAVersionInfo):
    """Detailed version information including account data."""
    accounts: List[MasterAccountSchema]


# --- Export List ---

__all__ = [
    "MasterAccountBase",
    "MasterAccountCreate",
    "MasterAccountUpdate",
    "MasterAccountSchema",
    "MasterAccountTree",
    "MasterAccountSummary",
    "ImportPreviewItem",
    "ImportPreviewResult",
    "ImportResult",
    "COAVersionInfo",
    "COAVersionDetail",
]

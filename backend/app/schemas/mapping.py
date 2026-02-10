from pydantic import BaseModel

class MappingBase(BaseModel):
    company_account_id: int
    master_account_id: int
    score: float
    status: str

class MappingCreate(MappingBase):
    pass

class Mapping(MappingBase):
    id: int

    class Config:
        from_attributes = True

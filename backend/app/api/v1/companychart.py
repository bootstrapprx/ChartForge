from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.models.company_account import CompanyAccount as CompanyAccountModel
from app.schemas.company_account import CompanyAccountSchema, CompanyAccountCreate
from app.db.session import get_db

router = APIRouter()

@router.post("/companychart", response_model=CompanyAccountSchema)
def create_company_account(account: CompanyAccountCreate, db: Session = Depends(get_db)):
    db_account = CompanyAccountModel(**account.model_dump())
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

@router.get("/companychart/{company_id}", response_model=List[CompanyAccountSchema])
def read_company_accounts(company_id: int, db: Session = Depends(get_db)):
    accounts = db.query(CompanyAccountModel).filter(CompanyAccountModel.company_id == company_id).all()
    return accounts

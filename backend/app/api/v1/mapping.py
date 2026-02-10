from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.mapping_engine import run_auto_mapping

router = APIRouter()

@router.post("/mapping/auto")
def trigger_auto_mapping(company_id: int, db: Session = Depends(get_db)):
    return run_auto_mapping(db, company_id)
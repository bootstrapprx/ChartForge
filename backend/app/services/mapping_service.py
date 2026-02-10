from sqlalchemy.orm import Session
from typing import List
from app.db.models.mapping import Mapping
from app.db.models.company_account import CompanyAccount
from app.db.models.company import Company

class MappingService:
    @staticmethod
    def get_mappings(db: Session, ucid: str) -> List[Mapping]:
        """
        Retrieves all mappings for a company by UCID.
        """
        return db.query(Mapping).join(CompanyAccount).join(Company).filter(Company.ucid == ucid).all()

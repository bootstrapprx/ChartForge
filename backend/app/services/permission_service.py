"""
Service for managing user-company permissions.
"""
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional, List
from uuid import UUID
import logging

from app.db.models.user_company import UserCompany
from app.db.models.user import User
from app.db.models.company import Company
from app.schemas.user_company import UserCompanyCreate, UserCompanyUpdate

logger = logging.getLogger(__name__)

class PermissionService:
    """Service for managing user-company permissions."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def assign_user_to_company(
        self,
        user_id: UUID,
        company_id: UUID,
        is_admin: bool = False,
        can_edit: bool = True,
        can_view: bool = True
    ) -> UserCompany:
        """
        Assign a user to a company with specific permissions.
        
        Args:
            user_id: UUID of the user
            company_id: UUID of the company
            is_admin: Whether user is admin of the company
            can_edit: Whether user can edit company data
            can_view: Whether user can view company data
        
        Returns:
            Created UserCompany object
        
        Raises:
            ValueError: If assignment already exists or user/company not found
        """
        # Check if user exists
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User with ID {user_id} not found")
        
        # Check if company exists
        company = self.db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise ValueError(f"Company with ID {company_id} not found")
        
        # Check if assignment already exists
        existing = self.db.query(UserCompany).filter(
            UserCompany.user_id == user_id,
            UserCompany.company_id == company_id
        ).first()
        
        if existing:
            raise ValueError(f"User is already assigned to this company")
        
        # Create assignment
        user_company = UserCompany(
            user_id=user_id,
            company_id=company_id,
            is_admin=is_admin,
            can_edit=can_edit,
            can_view=can_view
        )
        
        try:
            self.db.add(user_company)
            self.db.commit()
            self.db.refresh(user_company)
            logger.info(f"Assigned user {user_id} to company {company_id}")
            return user_company
        except IntegrityError as e:
            self.db.rollback()
            logger.error(f"Error assigning user to company: {e}")
            raise ValueError(f"Failed to assign user to company: {e}")
    
    def update_user_company_permissions(
        self,
        user_id: UUID,
        company_id: UUID,
        permissions: UserCompanyUpdate
    ) -> Optional[UserCompany]:
        """
        Update permissions for a user-company relationship.
        
        Args:
            user_id: UUID of the user
            company_id: UUID of the company
            permissions: UserCompanyUpdate with permission changes
        
        Returns:
            Updated UserCompany object, or None if not found
        """
        user_company = self.db.query(UserCompany).filter(
            UserCompany.user_id == user_id,
            UserCompany.company_id == company_id
        ).first()
        
        if not user_company:
            return None
        
        # Update permissions
        update_data = permissions.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user_company, field, value)
        
        try:
            self.db.commit()
            self.db.refresh(user_company)
            logger.info(f"Updated permissions for user {user_id} in company {company_id}")
            return user_company
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating permissions: {e}")
            raise ValueError(f"Failed to update permissions: {e}")
    
    def remove_user_from_company(self, user_id: UUID, company_id: UUID) -> bool:
        """
        Remove a user from a company.
        
        Args:
            user_id: UUID of the user
            company_id: UUID of the company
        
        Returns:
            True if successful, False if not found
        """
        user_company = self.db.query(UserCompany).filter(
            UserCompany.user_id == user_id,
            UserCompany.company_id == company_id
        ).first()
        
        if not user_company:
            return False
        
        try:
            self.db.delete(user_company)
            self.db.commit()
            logger.info(f"Removed user {user_id} from company {company_id}")
            return True
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error removing user from company: {e}")
            raise ValueError(f"Failed to remove user from company: {e}")
    
    def get_user_companies(self, user_id: UUID) -> List[UserCompany]:
        """Get all company assignments for a user."""
        return self.db.query(UserCompany).filter(
            UserCompany.user_id == user_id
        ).all()
    
    def get_company_users(self, company_id: UUID) -> List[UserCompany]:
        """Get all user assignments for a company."""
        return self.db.query(UserCompany).filter(
            UserCompany.company_id == company_id
        ).all()
    
    def get_user_company(self, user_id: UUID, company_id: UUID) -> Optional[UserCompany]:
        """Get a specific user-company relationship."""
        return self.db.query(UserCompany).filter(
            UserCompany.user_id == user_id,
            UserCompany.company_id == company_id
        ).first()


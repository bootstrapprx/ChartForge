"""
Dependencies for API routes.
"""
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, Generator
from uuid import UUID

from app.db.session import get_db as get_central_db
from app.db.models.user import User
from app.db.models.company import Company
from app.db.models.user_company import UserCompany
from app.api.v1.auth import get_current_user

# Re-export get_db for convenience
get_db = get_central_db

def get_user_companies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_central_db)
) -> list[UUID]:
    """
    Get list of company IDs the current user has access to.
    Superusers have access to all companies.
    
    Returns:
        List of company UUIDs
    """
    if current_user.is_superuser:
        # Superusers can access all companies
        companies = db.query(Company).all()
        return [company.id for company in companies]
    
    # Regular users can only access companies they're assigned to
    user_companies = db.query(UserCompany).filter(
        UserCompany.user_id == current_user.id
    ).all()
    return [uc.company_id for uc in user_companies]

def check_company_access(
    company_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_central_db)
) -> Company:
    """
    Check if the current user has access to a specific company.
    Superusers have access to all companies.
    
    Args:
        company_id: UUID of the company to check access for
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Company object if user has access
    
    Raises:
        HTTPException: If user doesn't have access to the company
    """
    # Superusers have access to all companies
    if current_user.is_superuser:
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        return company
    
    # Check if user has access to this company
    user_company = db.query(UserCompany).filter(
        UserCompany.user_id == current_user.id,
        UserCompany.company_id == company_id
    ).first()
    
    if not user_company:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this company"
        )
    
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    return company

def check_company_admin(
    company_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_central_db)
) -> Company:
    """
    Check if the current user is an admin of a specific company.
    Superusers are considered admins of all companies.
    
    Args:
        company_id: UUID of the company
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Company object if user is admin
    
    Raises:
        HTTPException: If user is not an admin of the company
    """
    # Superusers are admins of all companies
    if current_user.is_superuser:
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        return company
    
    # Check if user is admin of this company
    user_company = db.query(UserCompany).filter(
        UserCompany.user_id == current_user.id,
        UserCompany.company_id == company_id,
        UserCompany.is_admin == True
    ).first()
    
    if not user_company:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be an admin of this company to perform this action"
        )
    
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    return company

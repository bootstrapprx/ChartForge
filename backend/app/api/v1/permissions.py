"""
User-Company permissions management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.db.session import get_db
from app.api.v1.auth import get_current_user
from app.api.deps import check_company_admin
from app.db.models.user import User
from app.db.models.company import Company
from app.schemas.user_company import (
    UserCompanyCreate,
    UserCompanyUpdate,
    UserCompanyResponse
)
from app.services.permission_service import PermissionService

router = APIRouter()

@router.post("/", response_model=UserCompanyResponse, status_code=status.HTTP_201_CREATED)
def assign_user_to_company(
    permission_data: UserCompanyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Assign a user to a company with specific permissions.
    Only superusers or company admins can assign users.
    """
    # Check if current user is superuser or admin of the company
    if not current_user.is_superuser:
        company = db.query(Company).filter(Company.id == permission_data.company_id).first()
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        # Check if user is admin of this company
        from app.services.permission_service import PermissionService
        perm_service = PermissionService(db)
        user_company = perm_service.get_user_company(current_user.id, permission_data.company_id)
        if not user_company or not user_company.is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only company admins or superusers can assign users to companies"
            )
    
    permission_service = PermissionService(db)
    try:
        user_company = permission_service.assign_user_to_company(
            user_id=permission_data.user_id,
            company_id=permission_data.company_id,
            is_admin=permission_data.is_admin,
            can_edit=permission_data.can_edit,
            can_view=permission_data.can_view
        )
        return user_company
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.put("/{user_id}/{company_id}", response_model=UserCompanyResponse)
def update_permissions(
    user_id: UUID,
    company_id: UUID,
    permission_data: UserCompanyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update permissions for a user-company relationship.
    Only superusers or company admins can update permissions.
    """
    # Check if current user is superuser or admin of the company
    if not current_user.is_superuser:
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        # Check if user is admin of this company
        permission_service = PermissionService(db)
        user_company = permission_service.get_user_company(current_user.id, company_id)
        if not user_company or not user_company.is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only company admins or superusers can update permissions"
            )
    
    permission_service = PermissionService(db)
    try:
        user_company = permission_service.update_user_company_permissions(
            user_id=user_id,
            company_id=company_id,
            permissions=permission_data
        )
        if not user_company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User-company relationship not found"
            )
        return user_company
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/{user_id}/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_user_from_company(
    user_id: UUID,
    company_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove a user from a company.
    Only superusers or company admins can remove users.
    """
    # Check if current user is superuser or admin of the company
    if not current_user.is_superuser:
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        # Check if user is admin of this company
        permission_service = PermissionService(db)
        user_company = permission_service.get_user_company(current_user.id, company_id)
        if not user_company or not user_company.is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only company admins or superusers can remove users from companies"
            )
    
    permission_service = PermissionService(db)
    try:
        success = permission_service.remove_user_from_company(user_id, company_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User-company relationship not found"
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/user/{user_id}", response_model=List[UserCompanyResponse])
def get_user_permissions(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all company permissions for a user.
    Users can only view their own permissions unless they're superusers.
    """
    if not current_user.is_superuser and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own permissions"
        )
    
    permission_service = PermissionService(db)
    return permission_service.get_user_companies(user_id)

@router.get("/company/{company_id}", response_model=List[UserCompanyResponse])
def get_company_users(
    company_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all users assigned to a company.
    Only users with access to the company can view this.
    """
    # Check if user has access to this company
    if not current_user.is_superuser:
        permission_service = PermissionService(db)
        user_company = permission_service.get_user_company(current_user.id, company_id)
        if not user_company:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this company"
            )
    
    permission_service = PermissionService(db)
    return permission_service.get_company_users(company_id)


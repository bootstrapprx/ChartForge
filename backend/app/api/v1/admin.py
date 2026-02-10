from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.session import get_db, engine
from app.db.base import Base
from app.core.config import settings
from app.api.v1.auth import get_current_user
from app.db.models.user import User

router = APIRouter()


class PromoteUserRequest(BaseModel):
    email: str
    role: Optional[str] = "accountant"


@router.post("/reset-db")
def reset_database(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Reset the database by dropping and recreating all tables.
    Only accessible by superusers.
    """
    if settings.SUPABASE_URL:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database reset is disabled when using Supabase migrations."
        )
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action"
        )
    
    # Drop all tables
    Base.metadata.drop_all(bind=engine)
    # Recreate all tables
    Base.metadata.create_all(bind=engine)
    
    # Re-seed superuser
    from app.db.init_db import init_db
    init_db(db)
    
    return {"message": "Database reset successfully"}


@router.post("/promote-user")
def promote_user_to_superuser(
    request: PromoteUserRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Promote a user to superuser/accountant status.
    Only accessible by existing superusers.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action"
        )
    
    # Find the user
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with email {request.email} not found"
        )
    
    # Update user
    user.is_superuser = True
    user.role = request.role
    db.commit()
    db.refresh(user)
    
    return {
        "message": f"User {request.email} promoted to {request.role}",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "is_superuser": user.is_superuser,
            "role": user.role,
        }
    }


@router.get("/users")
def list_all_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all users in the system.
    Only accessible by superusers.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action"
        )
    
    users = db.query(User).all()
    return [
        {
            "id": str(u.id),
            "email": u.email,
            "name": u.name,
            "is_superuser": u.is_superuser,
            "role": u.role,
            "is_active": u.is_active,
        }
        for u in users
    ]


@router.post("/promote-by-email/{email}")
def quick_promote(
    email: str,
    db: Session = Depends(get_db)
):
    """
    Quick endpoint to promote a user (for initial setup).
    This endpoint should be disabled in production.
    """
    import os
    if os.getenv("ENVIRONMENT", "development") == "production":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is disabled in production"
        )
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with email {email} not found"
        )
    
    user.is_superuser = True
    user.role = "accountant"
    db.commit()
    
    return {
        "message": f"User {email} promoted to superuser/accountant",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "is_superuser": user.is_superuser,
            "role": user.role,
        }
    }

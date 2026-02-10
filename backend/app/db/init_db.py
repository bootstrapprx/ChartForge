from sqlalchemy.orm import Session
from app.core.config import settings
from app.services.user_service import UserService
from app.db.models.user import User
from app.core.security import get_password_hash

def init_db(db: Session) -> None:
    """
    Initialize the database with a superuser if it doesn't exist.
    """
    if settings.SUPABASE_URL:
        print("Supabase auth enabled; skipping local superuser bootstrap.")
        return
    user_service = UserService(db)
    
    user = user_service.get_user_by_email(settings.FIRST_SUPERUSER)
    if not user:
        user = User(
            email=settings.FIRST_SUPERUSER,
            hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
            is_superuser=True,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"Superuser {settings.FIRST_SUPERUSER} created")
    else:
        print(f"Superuser {settings.FIRST_SUPERUSER} already exists")

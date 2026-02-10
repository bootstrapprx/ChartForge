import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from cryptography.fernet import Fernet
from app.db.base import Base
from app.core.config import settings

class UserDatabaseConfig(Base):
    __tablename__ = "user_database_configs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Database connection details (encrypted)
    db_host = Column(String, nullable=False)
    db_port = Column(String, default="5432", nullable=False)
    db_name = Column(String, nullable=False)
    db_user = Column(String, nullable=False)
    encrypted_db_password = Column(Text, nullable=False)  # Encrypted password
    
    # Metadata
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    user = relationship("User", back_populates="database_config")
    
    def __repr__(self):
        return f"<UserDatabaseConfig(user_id='{self.user_id}', db_name='{self.db_name}')>"
    
    @property
    def database_url(self) -> str:
        """Returns the database URL for this user's database."""
        decrypted_password = self._decrypt_password()
        return f"postgresql+psycopg2://{self.db_user}:{decrypted_password}@{self.db_host}:{self.db_port}/{self.db_name}"
    
    def _decrypt_password(self) -> str:
        """Decrypts the stored database password."""
        # Use SECRET_KEY to derive encryption key
        # For production, use a proper key derivation function
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
        from cryptography.hazmat.backends import default_backend
        import base64
        
        # Derive key from SECRET_KEY
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b'chartforge_salt',  # In production, use a unique salt per user
            iterations=100000,
            backend=default_backend()
        )
        key = base64.urlsafe_b64encode(kdf.derive(settings.SECRET_KEY.encode()))
        f = Fernet(key)
        return f.decrypt(self.encrypted_db_password.encode()).decode()
    
    def set_password(self, password: str):
        """Encrypts and stores the database password."""
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
        from cryptography.hazmat.backends import default_backend
        import base64
        
        # Derive key from SECRET_KEY
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b'chartforge_salt',  # In production, use a unique salt per user
            iterations=100000,
            backend=default_backend()
        )
        key = base64.urlsafe_b64encode(kdf.derive(settings.SECRET_KEY.encode()))
        f = Fernet(key)
        self.encrypted_db_password = f.encrypt(password.encode()).decode()


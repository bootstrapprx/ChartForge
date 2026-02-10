"""
Dynamic database session management for per-user databases.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Dict, Optional
import logging

from app.db.models.user_database_config import UserDatabaseConfig

logger = logging.getLogger(__name__)

# Cache for user database engines
_user_engines: Dict[str, any] = {}
_user_sessions: Dict[str, sessionmaker] = {}

def get_user_database_session(user_id: str, db_config: UserDatabaseConfig) -> Session:
    """
    Get a database session for a specific user's database.
    
    Args:
        user_id: UUID of the user
        db_config: UserDatabaseConfig object containing database connection details
    
    Returns:
        SQLAlchemy Session object connected to the user's database
    """
    user_id_str = str(user_id)
    
    # Check if we already have an engine for this user
    if user_id_str not in _user_engines:
        try:
            database_url = db_config.database_url
            engine = create_engine(
                database_url,
                pool_pre_ping=True,
                pool_size=5,
                max_overflow=10
            )
            _user_engines[user_id_str] = engine
            _user_sessions[user_id_str] = sessionmaker(
                autocommit=False,
                autoflush=False,
                bind=engine
            )
            logger.info(f"Created database engine for user {user_id_str}")
        except Exception as e:
            logger.error(f"Failed to create database engine for user {user_id_str}: {e}")
            raise
    
    # Create and return a new session
    SessionLocal = _user_sessions[user_id_str]
    return SessionLocal()

def clear_user_session_cache(user_id: Optional[str] = None):
    """
    Clear the cached database session for a user, or all users.
    
    Args:
        user_id: Optional user ID to clear. If None, clears all cached sessions.
    """
    if user_id:
        user_id_str = str(user_id)
        if user_id_str in _user_engines:
            _user_engines[user_id_str].dispose()
            del _user_engines[user_id_str]
            del _user_sessions[user_id_str]
            logger.info(f"Cleared database session cache for user {user_id_str}")
    else:
        # Clear all cached sessions
        for user_id_str, engine in _user_engines.items():
            engine.dispose()
        _user_engines.clear()
        _user_sessions.clear()
        logger.info("Cleared all database session caches")


"""
Service for creating and managing user-specific PostgreSQL databases.
"""
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

class DatabaseService:
    """Service for managing user database creation and connection."""
    
    def __init__(self, admin_db_url: Optional[str] = None):
        """
        Initialize the database service.
        
        Args:
            admin_db_url: PostgreSQL admin connection URL with superuser privileges.
                         If None, uses the default DATABASE_URL from settings.
        """
        # Parse the admin database URL to get connection details
        # For creating databases, we connect to the 'postgres' database
        self.admin_db_url = admin_db_url or settings.DATABASE_URL
        
        # Extract connection details for admin operations
        # Format: postgresql+psycopg2://user:password@host:port/database
        self._parse_connection_string()
    
    def _parse_connection_string(self):
        """Parse the database URL to extract connection components."""
        from urllib.parse import urlparse
        
        # Remove the sqlalchemy prefix
        url = self.admin_db_url.replace("postgresql+psycopg2://", "").replace("postgresql://", "")
        
        # Handle URL encoding
        if "@" in url:
            auth_part, host_part = url.split("@", 1)
            if ":" in auth_part:
                self.admin_user, self.admin_password = auth_part.split(":", 1)
                # URL decode password in case it contains special characters
                from urllib.parse import unquote
                self.admin_password = unquote(self.admin_password)
            else:
                self.admin_user = auth_part
                self.admin_password = ""
            
            if "/" in host_part:
                host_port, _ = host_part.split("/", 1)
            else:
                host_port = host_part
            
            if ":" in host_port:
                self.admin_host, self.admin_port = host_port.split(":", 1)
            else:
                self.admin_host = host_port
                self.admin_port = "5432"
        else:
            raise ValueError("Invalid database URL format")
    
    def _get_admin_connection(self, database: str = "postgres"):
        """
        Get a connection to the PostgreSQL admin database.
        
        Args:
            database: Database name to connect to (default: 'postgres')
        
        Returns:
            psycopg2 connection object
        """
        try:
            conn = psycopg2.connect(
                host=self.admin_host,
                port=self.admin_port,
                user=self.admin_user,
                password=self.admin_password,
                database=database
            )
            conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            return conn
        except psycopg2.Error as e:
            logger.error(f"Failed to connect to admin database: {e}")
            raise
    
    def create_user_database(
        self,
        db_name: str,
        db_user: str,
        db_password: str,
        db_host: Optional[str] = None,
        db_port: Optional[str] = None
    ) -> bool:
        """
        Create a new PostgreSQL database and user for a specific user.
        
        Args:
            db_name: Name of the database to create
            db_user: Username for the database
            db_password: Password for the database user
            db_host: Database host (defaults to admin host)
            db_port: Database port (defaults to admin port)
        
        Returns:
            True if successful, False otherwise
        """
        db_host = db_host or self.admin_host
        db_port = db_port or self.admin_port
        
        admin_conn = None
        try:
            # Connect to postgres database as admin
            admin_conn = self._get_admin_connection("postgres")
            cursor = admin_conn.cursor()
            
            # Check if database already exists
            cursor.execute(
                "SELECT 1 FROM pg_database WHERE datname = %s",
                (db_name,)
            )
            if cursor.fetchone():
                logger.warning(f"Database '{db_name}' already exists")
                return False
            
            # Create the database
            cursor.execute(f'CREATE DATABASE "{db_name}"')
            logger.info(f"Created database '{db_name}'")
            
            # Create user if it doesn't exist
            cursor.execute(
                "SELECT 1 FROM pg_user WHERE usename = %s",
                (db_user,)
            )
            if not cursor.fetchone():
                cursor.execute(
                    f"CREATE USER \"{db_user}\" WITH PASSWORD %s",
                    (db_password,)
                )
                logger.info(f"Created user '{db_user}'")
            
            # Grant privileges
            cursor.execute(f'GRANT ALL PRIVILEGES ON DATABASE "{db_name}" TO "{db_user}"')
            
            # Connect to the new database to grant schema privileges
            cursor.close()
            admin_conn.close()
            
            # Connect to the new database
            new_db_conn = self._get_admin_connection(db_name)
            new_cursor = new_db_conn.cursor()
            
            # Grant schema privileges
            new_cursor.execute(f'GRANT ALL ON SCHEMA public TO "{db_user}"')
            new_cursor.execute(f'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "{db_user}"')
            new_cursor.execute(f'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "{db_user}"')
            
            new_cursor.close()
            new_db_conn.close()
            
            logger.info(f"Successfully created database '{db_name}' with user '{db_user}'")
            return True
            
        except psycopg2.Error as e:
            logger.error(f"Error creating database '{db_name}': {e}")
            if admin_conn:
                admin_conn.rollback()
            return False
        except Exception as e:
            logger.error(f"Unexpected error creating database '{db_name}': {e}")
            if admin_conn:
                admin_conn.rollback()
            return False
    
    def database_exists(self, db_name: str) -> bool:
        """
        Check if a database exists.
        
        Args:
            db_name: Name of the database to check
        
        Returns:
            True if database exists, False otherwise
        """
        admin_conn = None
        try:
            admin_conn = self._get_admin_connection("postgres")
            cursor = admin_conn.cursor()
            cursor.execute(
                "SELECT 1 FROM pg_database WHERE datname = %s",
                (db_name,)
            )
            exists = cursor.fetchone() is not None
            cursor.close()
            return exists
        except psycopg2.Error as e:
            logger.error(f"Error checking database existence: {e}")
            return False
        finally:
            if admin_conn:
                admin_conn.close()
    
    def drop_user_database(self, db_name: str, db_user: str) -> bool:
        """
        Drop a user database and optionally the user.
        
        Args:
            db_name: Name of the database to drop
            db_user: Username to drop (optional)
        
        Returns:
            True if successful, False otherwise
        """
        admin_conn = None
        try:
            admin_conn = self._get_admin_connection("postgres")
            cursor = admin_conn.cursor()
            
            # Terminate all connections to the database
            cursor.execute(
                """
                SELECT pg_terminate_backend(pid)
                FROM pg_stat_activity
                WHERE datname = %s AND pid <> pg_backend_pid()
                """,
                (db_name,)
            )
            
            # Drop the database
            cursor.execute(f'DROP DATABASE IF EXISTS "{db_name}"')
            
            # Optionally drop the user
            if db_user:
                cursor.execute(f'DROP USER IF EXISTS "{db_user}"')
            
            cursor.close()
            logger.info(f"Successfully dropped database '{db_name}'")
            return True
            
        except psycopg2.Error as e:
            logger.error(f"Error dropping database '{db_name}': {e}")
            if admin_conn:
                admin_conn.rollback()
            return False
        finally:
            if admin_conn:
                admin_conn.close()


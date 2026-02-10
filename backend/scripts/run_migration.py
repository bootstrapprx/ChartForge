import logging
from sqlalchemy import text
from app.db.session import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import sys
import os

def run_migration(sql_file_path):
    logger.info(f"Starting migration from {sql_file_path}...")
    
    if not os.path.exists(sql_file_path):
        logger.error(f"File not found: {sql_file_path}")
        return

    with open(sql_file_path, 'r') as f:
        sql_content = f.read()

    # Split by semicolon to get individual commands, but be careful with functions/procedures
    # For simple migrations, splitting by ; is okay-ish, but better to let SQLAlchemy handle it if possible or split carefully.
    # Actually, connection.execute(text(sql_content)) might work for multiple statements if the driver supports it.
    # psycopg2 usually supports multiple statements in one execute call.
    
    with engine.connect() as connection:
        try:
            logger.info(f"Executing SQL...")
            connection.execute(text(sql_content))
            connection.commit()
            logger.info("Migration completed successfully.")
        except Exception as e:
            logger.error(f"Error executing migration: {e}")
            raise e

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python run_migration.py <path_to_sql_file>")
        sys.exit(1)
    
    run_migration(sys.argv[1])

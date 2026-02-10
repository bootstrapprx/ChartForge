import sys
import os
import logging

# Add the parent directory (backend) to sys.path to allow importing app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.db.models.master_account import MasterAccount
from app.services.masterchart_service import MasterChartService
from sqlalchemy import text

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def reset_master_chart():
    """
    Wipes the Master Chart and re-imports the default template.
    """
    db = SessionLocal()
    try:
        logger.info("Starting Master Chart reset...")
        
        # 1. Wipe existing accounts
        # We use delete() instead of truncate to handle cascades if configured, 
        # though for a full reset, we might want to be aggressive.
        # However, since there are self-referential foreign keys (parent_id), 
        # a simple delete might fail due to constraints if not ordered.
        # The safest way for a full wipe is often TRUNCATE CASCADE.
        
        logger.info("Wiping existing Master Chart accounts...")
        try:
            # Try efficient truncate first
            db.execute(text("TRUNCATE TABLE master_accounts RESTART IDENTITY CASCADE;"))
        except Exception as e:
            logger.warning(f"TRUNCATE failed ({e}), rolling back and falling back to DELETE...")
            db.rollback()
            # Re-create session or just continue if rollback is sufficient
            # For safety with SQLAlchemy, sometimes it's better to just ensure we are clean
            db.query(MasterAccount).delete()
            
        db.commit()
        logger.info("Master Chart wiped successfully.")

        # 2. Re-import default template
        logger.info("Re-importing default template...")
        service = MasterChartService(db)
        
        # We need to trick the service or just call the import logic.
        # The service method checks if the DB is empty, which it now is.
        service.import_default_template_if_needed()
        
        # Verify import
        count = db.query(MasterAccount).count()
        logger.info(f"Reset complete. Master Chart now has {count} accounts.")

    except Exception as e:
        logger.error(f"An error occurred during reset: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_master_chart()

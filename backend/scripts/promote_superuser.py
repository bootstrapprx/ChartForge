import sys
import os
import argparse

# Add the parent directory (backend) to sys.path to allow importing app modules
# This assumes the script is located in backend/scripts/
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.db.models.user import User

def promote_superuser(email: str):
    """
    Promotes a user to superuser status.
    """
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.is_superuser = True
            user.is_active = True
            db.commit()
            print(f"Success: User {email} is now a superuser.")
        else:
            print(f"Error: User with email {email} not found.")
    except Exception as e:
        print(f"An error occurred: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Promote a user to superuser.")
    parser.add_argument("--email", required=True, help="The email address of the user to promote")
    args = parser.parse_args()
    
    promote_superuser(args.email)

"""
US-GAAP Master Chart Seed Data
Auto-generated from comprehensive master chart analysis

Total Accounts: 345
- Category Headers: 7
- Detail Accounts: 338

Date: 2025-11-23 19:08:07
"""

import json
from datetime import datetime
from sqlalchemy.orm import Session
from app.db.models.master_account import MasterAccount
from app.db.session import SessionLocal

def load_us_gaap_master_chart(db: Session):
    """
    Load the US-GAAP master chart of accounts into the database.
    This includes 345 accounts organized in a hierarchical structure.
    """
    
    # Load the JSON data
    with open('app/data/us_gaap_master_chart.json', 'r') as f:
        accounts_data = json.load(f)
    
    print(f"Loading {len(accounts_data)} accounts...")
    
    # First pass: Create all accounts without parent relationships
    code_to_id_map = {}
    
    for account_data in accounts_data:
        # Check if account already exists
        existing = db.query(MasterAccount).filter(
            MasterAccount.code == account_data['code']
        ).first()
        
        if existing:
            print(f"  Account {account_data['code']} already exists, skipping...")
            code_to_id_map[account_data['code']] = existing.id
            continue
        
        # Parse dates
        start_date = datetime.strptime(account_data['start_date'], '%Y-%m-%d').date()
        end_date = None
        if account_data['end_date']:
            end_date = datetime.strptime(account_data['end_date'], '%Y-%m-%d').date()
        
        # Create account
        account = MasterAccount(
            code=account_data['code'],
            description=account_data['description'],
            start_date=start_date,
            end_date=end_date,
            type=account_data['type'],
            level=account_data['level'],
            category=account_data['category'],
            notes=account_data['notes'],
            parent_code=account_data['parent_code']
        )
        
        db.add(account)
        db.flush()  # Get the ID without committing
        
        code_to_id_map[account_data['code']] = account.id
        
        if len(code_to_id_map) % 50 == 0:
            print(f"  Loaded {len(code_to_id_map)} accounts...")
    
    # Second pass: Set parent_id relationships
    for account_data in accounts_data:
        if account_data['parent_code']:
            account = db.query(MasterAccount).filter(
                MasterAccount.code == account_data['code']
            ).first()
            
            if account and account_data['parent_code'] in code_to_id_map:
                account.parent_id = code_to_id_map[account_data['parent_code']]
    
    # Commit all changes
    db.commit()
    
    print(f"✓ Successfully loaded {len(code_to_id_map)} accounts")
    
    # Print summary
    headers = db.query(MasterAccount).filter(MasterAccount.type == 'H').count()
    details = db.query(MasterAccount).filter(MasterAccount.type == 'D').count()
    
    print(f"\nSummary:")
    print(f"  Header accounts: {headers}")
    print(f"  Detail accounts: {details}")
    print(f"  Total accounts: {headers + details}")
    
    return True

if __name__ == "__main__":
    db = SessionLocal()
    try:
        load_us_gaap_master_chart(db)
    except Exception as e:
        print(f"Error loading master chart: {e}")
        db.rollback()
        raise
    finally:
        db.close()

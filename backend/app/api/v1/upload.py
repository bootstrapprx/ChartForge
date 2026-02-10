from typing import Literal
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.company_import_service import CompanyImportService

# Define MergeStrategy right in the API layer for clarity in docs
MergeStrategy = Literal["override", "append", "keep_existing"]

router = APIRouter()

@router.post("/upload")
def upload_chart_of_accounts(
    company_id: int = Form(...),
    merge_strategy: MergeStrategy = Form("override"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Uploads a Chart of Accounts file (CSV or Excel) for a specific company.
    
    - **company_id**: The ID of the company.
    - **merge_strategy**: How to handle existing accounts.
        - `override`: (Default) Deletes all existing accounts before import.
        - `append`: Adds all accounts from the file.
        - `keep_existing`: Only adds accounts from the file if the code doesn't already exist.
    - **file**: The CSV or Excel file to upload.
    """
    # Basic file type validation
    if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV or Excel file.")
    
    import_service = CompanyImportService(db)
    
    try:
        result = import_service.import_company_coa(
            company_id=company_id,
            file=file,
            merge_strategy=merge_strategy
        )
        return result
    except (ValueError, ImportError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
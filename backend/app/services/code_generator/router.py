from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.code_generator.service import CodeGeneratorService
from app.services.code_generator.exceptions import CodeGenerationException

router = APIRouter()

@router.post("/generate-new", summary="Generate a New Account Code", tags=["Code Generator"])
def generate_new_code(parent_code: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Generates the next available account code, either as a root account or as a child
    of the given parent code.
    """
    service = CodeGeneratorService(db)
    try:
        return service.generate_new_code(parent_code)
    except CodeGenerationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {e}")

@router.post("/validate", summary="Validate an Account Code", tags=["Code Generator"])
def validate_code(code: str, parent_code: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Validates a potential new account code for structural correctness and conflicts.
    """
    service = CodeGeneratorService(db)
    try:
        return service.validate_code(code, parent_code)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {e}")

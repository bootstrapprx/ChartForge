import json
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.template import Template, TemplateValidationResult
from app.services.template_service import TemplateService

router = APIRouter()

@router.get("", response_model=List[str], summary="List Available Templates")
def list_available_templates(db: Session = Depends(get_db)):
    """
    Lists all predefined Chart of Accounts templates available on the server.
    """
    service = TemplateService(db)
    return service.list_templates()

@router.get("/{template_name}", response_model=Dict[str, Any], summary="Get Template Preview")
def get_template_preview(template_name: str, db: Session = Depends(get_db)):
    """
    Retrieves the full JSON structure of a predefined template for preview.
    """
    service = TemplateService(db)
    try:
        return service.load_template(template_name)
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.post("/apply/{template_name}", summary="Apply a Template")
def apply_chart_template(template_name: str, db: Session = Depends(get_db)):
    """
    Applies a predefined template to the Master Chart of Accounts.
    This will create missing accounts and then rebuild the hierarchy.
    Returns a detailed report of the operation.
    """
    service = TemplateService(db)
    try:
        report = service.apply_template(template_name)
        return report
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/validate", response_model=TemplateValidationResult, summary="Validate a Custom Template")
async def validate_custom_template(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Validates a custom template file (JSON) without applying it.
    Returns a report of errors and warnings.
    """
    service = TemplateService(db)
    try:
        contents = await file.read()
        data = json.loads(contents)
        return service.validate_template(data)
    except json.JSONDecodeError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON file.")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/custom", response_model=Template, status_code=status.HTTP_201_CREATED, summary="Upload a Custom Template")
async def upload_custom_template(
    name: str = Form(...),
    version: str = Form("1.0"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Uploads and stores a custom template in the database for future use.
    The template is validated before being saved.
    """
    service = TemplateService(db)
    try:
        contents = await file.read()
        data = json.loads(contents)
        
        # The service handles validation internally
        template = service.save_custom_template(name=name, version=version, data=data)
        return template
    except json.JSONDecodeError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON file.")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

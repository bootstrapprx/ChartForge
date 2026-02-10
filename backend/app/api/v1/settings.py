from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel

from app.db.session import get_db
from app.db.models.system_settings import SystemSettings

router = APIRouter()

class SettingUpdate(BaseModel):
    key: str
    value: str
    description: str = None

@router.get("/", response_model=Dict[str, str])
def get_settings(db: Session = Depends(get_db)):
    """
    Get all system settings as a key-value dictionary.
    """
    settings = db.query(SystemSettings).all()
    return {s.key: s.value for s in settings}

@router.post("/", response_model=Dict[str, str])
def update_settings(updates: List[SettingUpdate], db: Session = Depends(get_db)):
    """
    Update multiple system settings.
    """
    for update in updates:
        setting = db.query(SystemSettings).filter(SystemSettings.key == update.key).first()
        if setting:
            setting.value = update.value
            if update.description:
                setting.description = update.description
        else:
            setting = SystemSettings(key=update.key, value=update.value, description=update.description)
            db.add(setting)
    
    db.commit()
    
    # Return updated settings
    settings = db.query(SystemSettings).all()
    return {s.key: s.value for s in settings}

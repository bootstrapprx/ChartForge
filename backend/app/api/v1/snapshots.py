from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.snapshot import Snapshot
from app.services.snapshot_service import SnapshotService

router = APIRouter()

@router.post("/snapshot", response_model=Snapshot, status_code=status.HTTP_201_CREATED, summary="Create a Snapshot")
def create_new_snapshot(db: Session = Depends(get_db)):
    """
    Creates a new versioned snapshot of the entire Chart of Accounts tree.
    """
    service = SnapshotService(db)
    return service.create_snapshot()

@router.get("/snapshots", response_model=List[Snapshot], summary="List All Snapshots")
def list_all_snapshots(db: Session = Depends(get_db)):
    """
    Retrieves a list of all available snapshots.
    """
    service = SnapshotService(db)
    return service.list_snapshots()

@router.get("/snapshot/{snapshot_id}", response_model=Snapshot, summary="Get a Specific Snapshot")
def get_specific_snapshot(snapshot_id: UUID, db: Session = Depends(get_db)):
    """
    Retrieves a specific snapshot by its UUID.
    """
    service = SnapshotService(db)
    snapshot = service.get_snapshot(snapshot_id)
    if not snapshot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Snapshot not found")
    return snapshot

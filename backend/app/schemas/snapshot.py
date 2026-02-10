from __future__ import annotations
import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Any

class SnapshotBase(BaseModel):
    """Base Pydantic model for a Snapshot."""
    data: Any

class SnapshotCreate(SnapshotBase):
    """Schema for creating a new snapshot."""
    pass

class Snapshot(SnapshotBase):
    """Schema for representing a snapshot in API responses."""
    id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.db.models.snapshot import Snapshot
from app.services.masterchart_service import MasterChartService

class SnapshotService:
    def __init__(self, db: Session):
        self.db = db

    def create_snapshot(self) -> Snapshot:
        """
        Creates a snapshot of the current Master Chart of Accounts tree.
        """
        masterchart_service = MasterChartService(self.db)
        accounts = masterchart_service.get_all_accounts()
        tree_data = masterchart_service.build_tree(accounts)
        
        snapshot = Snapshot(data=tree_data)
        self.db.add(snapshot)
        self.db.commit()
        self.db.refresh(snapshot)
        return snapshot

    def get_snapshot(self, snapshot_id: UUID) -> Optional[Snapshot]:
        """Retrieves a single snapshot by its ID."""
        return self.db.query(Snapshot).filter(Snapshot.id == snapshot_id).first()

    def list_snapshots(self) -> List[Snapshot]:
        """Lists all available snapshots, ordered by creation date."""
        return self.db.query(Snapshot).order_by(Snapshot.created_at.desc()).all()

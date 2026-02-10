import csv
from io import StringIO
from typing import IO, Dict, Any, Literal
from sqlalchemy.orm import Session
from fastapi import UploadFile

from app.db.models.company_account import CompanyAccount

# Try to import pandas, but fall back gracefully if not installed
try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False

MergeStrategy = Literal["override", "append", "keep_existing"]

class CompanyImportService:
    def __init__(self, db: Session):
        self.db = db

    def _parse_with_pandas(self, file_stream: IO[bytes], file_type: str) -> list[dict]:
        """Parses a file using pandas."""
        if not PANDAS_AVAILABLE:
            raise ImportError("Pandas/openpyxl is required for this file type.")
        
        try:
            if file_type == 'json':
                df = pd.read_json(file_stream)
            elif file_type == 'excel':
                df = pd.read_excel(file_stream)
            elif file_type == 'csv':
                df = pd.read_csv(file_stream)
            else:
                raise ValueError("Unsupported file type for pandas parsing.")
        except Exception as e:
            raise ValueError(f"Failed to parse file with pandas: {e}")

        required_columns = {'code', 'description', 'type'}
        if not required_columns.issubset(df.columns):
            raise ValueError(f"File must have columns: {', '.join(required_columns)}")
        
        # Normalize and convert to records
        df.fillna('', inplace=True)
        records = df.to_dict('records')
        return records

    def _parse_with_csv(self, file_stream: IO[bytes]) -> list[dict]:
        """Parses a CSV file using the standard library."""
        try:
            content = file_stream.read().decode("utf-8")
            reader = csv.DictReader(StringIO(content))
            
            required_columns = {'code', 'description', 'type'}
            if not reader.fieldnames or not required_columns.issubset(reader.fieldnames):
                raise ValueError(f"CSV must have columns: {', '.join(required_columns)}")
            
            return list(reader)
        except Exception as e:
            raise ValueError(f"Failed to parse CSV file: {e}")

    def import_company_coa(
        self,
        company_id: int, # Changed to int
        file: UploadFile,
        merge_strategy: MergeStrategy = "override"
    ) -> Dict[str, Any]:
        """
        Imports a company's Chart of Accounts from a file with a merge strategy.
        """
        file_type = file.content_type
        records = []

        try:
            # Determine parsing strategy
            if 'excel' in file_type or 'spreadsheet' in file_type:
                if not PANDAS_AVAILABLE:
                    raise ImportError("Pandas and openpyxl are required to import Excel files. Please use a CSV file.")
                records = self._parse_with_pandas(file.file, 'excel')
            elif 'csv' in file_type:
                records = self._parse_with_csv(file.file)
            elif 'json' in file_type and PANDAS_AVAILABLE:
                records = self._parse_with_pandas(file.file, 'json')
            else:
                # Fallback for other text/csv mime types
                try:
                    records = self._parse_with_csv(file.file)
                except Exception:
                     raise ValueError(f"Unsupported or invalid file type: {file_type}")

            accounts_to_process = []
            errors = []
            for i, row in enumerate(records):
                code = str(row.get('code', '')).strip().upper()
                description = str(row.get('description', '')).strip()
                acc_type = str(row.get('type', '')).strip().upper()

                if not code or not description or not acc_type:
                    errors.append({"row": i + 2, "error": "Missing required values (code, description, type)."})
                    continue
                
                accounts_to_process.append({
                    "company_id": company_id,
                    "code": code,
                    "description": description,
                    "type": acc_type,
                    "parent_code": str(row.get('parent_code', '')).strip().upper() or None,
                })

            if merge_strategy == "override":
                self.db.query(CompanyAccount).filter(CompanyAccount.company_id == company_id).delete()
                self.db.flush()
                
                new_accounts = [CompanyAccount(**acc) for acc in accounts_to_process]
                self.db.add_all(new_accounts)
                
            elif merge_strategy == "append":
                new_accounts = [CompanyAccount(**acc) for acc in accounts_to_process]
                self.db.add_all(new_accounts)

            elif merge_strategy == "keep_existing":
                existing_codes = {
                    res[0] for res in self.db.query(CompanyAccount.code)
                    .filter(CompanyAccount.company_id == company_id)
                    .all()
                }
                accounts_to_create = [
                    CompanyAccount(**acc) for acc in accounts_to_process 
                    if acc["code"] not in existing_codes
                ]
                self.db.add_all(accounts_to_create)

            self.db.commit()
            
            count_query = self.db.query(CompanyAccount).filter(CompanyAccount.company_id == company_id)
            final_count = count_query.count()

            return {
                "company_id": company_id,
                "imported_count": final_count,
                "strategy": merge_strategy,
                "errors": errors
            }

        except Exception as e:
            self.db.rollback()
            raise ValueError(f"Import failed: {e}")

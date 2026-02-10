# US-GAAP Master Chart of Accounts

## Overview

This directory contains the comprehensive US-GAAP Master Chart of Accounts with **345 accounts** (7 category headers + 338 detail accounts) designed for multi-company accounting operations.

**Generated:** November 23, 2025  
**Source:** Semantic clustering and analysis of 1,003 legacy accounts from multiple US companies  
**Standard:** US-GAAP compliant  
**Consolidation Ratio:** 2.97:1 (reduced from 1,003 to 338 accounts)

---

## Files in This Directory

### 1. `us_gaap_master_chart.json`
**Format:** JSON  
**Size:** ~500 KB  
**Purpose:** Complete master chart in ChartForge database schema format

**Structure:**
```json
[
  {
    "code": "10000",
    "description": "ASSET",
    "start_date": "2024-01-01",
    "end_date": null,
    "type": "H",
    "parent_code": null,
    "level": 1,
    "category": "Asset",
    "notes": "{...}"
  },
  {
    "code": "10001",
    "description": "Cash - Operating Account",
    "start_date": "2024-01-01",
    "end_date": null,
    "type": "D",
    "parent_code": "10000",
    "level": 2,
    "category": "Asset",
    "notes": "{...}"
  }
]
```

**Fields:**
- `code`: 5-digit US-GAAP account code
- `description`: Account name
- `start_date`: Account activation date
- `end_date`: Account deactivation date (null = active)
- `type`: "H" (Header) or "D" (Detail)
- `parent_code`: Code of parent account (for hierarchy)
- `level`: Hierarchy level (1=Header, 2=Detail)
- `category`: Main category (Asset, Liability, etc.)
- `notes`: JSON string with extended attributes

**Notes Field Contains:**
- `subcategory`: Detailed classification
- `normal_balance`: "Debit" or "Credit"
- `cash_flow_classification`: Operating/Investing/Financing
- `cost_center`: Assigned cost center code
- `gaap_classification`: US-GAAP category
- `detailed_description`: Usage guidance
- `examples`: Example transactions
- `gaap_rationale`: Why this account exists per GAAP

---

### 2. `us_gaap_master_chart.csv`
**Format:** CSV  
**Purpose:** Human-readable spreadsheet format

**Columns:** Same as JSON (code, description, start_date, end_date, type, parent_code, level, category, notes)

**Use Cases:**
- Quick review in Excel/Google Sheets
- Data analysis and reporting
- Import into other systems
- Training and documentation

---

### 3. `seed_us_gaap.py`
**Format:** Python script  
**Purpose:** Database seeding script for ChartForge

**Usage:**
```bash
cd backend
python app/data/seed_us_gaap.py
```

**What it does:**
1. Loads `us_gaap_master_chart.json`
2. Creates MasterAccount records in PostgreSQL
3. Establishes parent-child relationships
4. Validates data integrity
5. Prints summary statistics

**Features:**
- Checks for existing accounts (idempotent)
- Two-pass loading (accounts first, then relationships)
- Progress indicators
- Error handling and rollback
- Summary report

**Output:**
```
Loading 345 accounts...
  Loaded 50 accounts...
  Loaded 100 accounts...
  ...
✓ Successfully loaded 345 accounts

Summary:
  Header accounts: 7
  Detail accounts: 338
  Total accounts: 345
```

---

### 4. `master_chart_summary.json`
**Format:** JSON  
**Purpose:** Statistics and metadata

**Contents:**
```json
{
  "total_accounts": 345,
  "category_headers": 7,
  "detail_accounts": 338,
  "categories": {
    "Asset": 144,
    "Liability": 56,
    "Equity": 16,
    "Revenue": 13,
    "Cost of Goods Sold": 44,
    "Expense": 60,
    "Other": 5
  },
  "code_ranges": {
    "Asset": {
      "min": "10000",
      "max": "19867",
      "count": 144
    },
    ...
  }
}
```

---

## Master Chart Structure

### Hierarchy

**Level 1: Category Headers (7 accounts)**
- 10000: ASSET
- 20000: LIABILITY
- 30000: EQUITY
- 40000: REVENUE
- 50000: COST OF GOODS SOLD
- 60000: EXPENSE
- 80000: OTHER

**Level 2: Detail Accounts (338 accounts)**
- All operational accounts
- Each references a category header as parent

### Code Ranges

| Category | Range | Count | Description |
|----------|-------|-------|-------------|
| **Asset** | 10000-19867 | 144 | Cash, AR, inventory, fixed assets, etc. |
| **Liability** | 20000-29790 | 56 | AP, loans, accruals, deferred revenue |
| **Equity** | 30000-39360 | 16 | Capital, retained earnings, distributions |
| **Revenue** | 40000-49228 | 13 | Sales, service revenue, other income |
| **COGS** | 50000-59761 | 44 | Direct costs, materials, labor |
| **Expense** | 60000-69794 | 60 | Operating expenses, admin, marketing |
| **Other** | 80000-87996 | 5 | Non-operating items |

---

## Account Attributes

### Standard Fields (ChartForge Schema)

- **code**: Unique 5-digit identifier
- **description**: Account name (concise)
- **start_date**: When account became active
- **end_date**: When account was deactivated (null = active)
- **type**: H (Header) or D (Detail)
- **parent_code**: Parent account code (for hierarchy)
- **level**: Depth in hierarchy (1 or 2)
- **category**: Main classification

### Extended Attributes (in notes field)

- **subcategory**: Detailed classification (e.g., "Current Asset - Cash and Cash Equivalents")
- **normal_balance**: "Debit" or "Credit"
- **cash_flow_classification**: "Operating Activities", "Investing Activities", or "Financing Activities"
- **cost_center**: Assigned cost center (CC-0000 to CC-9000)
- **gaap_classification**: US-GAAP category
- **detailed_description**: Comprehensive usage guidance
- **examples**: Sample transactions
- **gaap_rationale**: GAAP compliance explanation

---

## Cost Centers

10 cost centers are defined and assigned to accounts:

| Code | Name | Accounts |
|------|------|----------|
| CC-0000 | Unallocated / Balance Sheet | 216 |
| CC-1000 | Executive & Corporate | 0 |
| CC-2000 | Finance & Accounting | 109 |
| CC-3000 | Operations | 0 |
| CC-4000 | Sales & Marketing | 13 |
| CC-5000 | Real Estate & Property Management | 0 |
| CC-6000 | Field Services & Cleaning Operations | 0 |
| CC-7000 | Loan & Financial Services Operations | 0 |
| CC-8000 | Information Technology & Systems | 0 |
| CC-9000 | Administration & General Support | 0 |

**Note:** Balance sheet accounts (Assets, Liabilities, Equity) are assigned to CC-0000 (Unallocated).

---

## Usage Instructions

### 1. Load into ChartForge Database

**Option A: Using the seed script**
```bash
cd backend
python app/data/seed_us_gaap.py
```

**Option B: Using the API**
```bash
# POST each account to /api/v1/masterchart
curl -X POST http://localhost:8000/api/v1/masterchart \
  -H "Content-Type: application/json" \
  -d @app/data/us_gaap_master_chart.json
```

**Option C: Direct database import**
```python
from app.db.session import SessionLocal
from app.data.seed_us_gaap import load_us_gaap_master_chart

db = SessionLocal()
load_us_gaap_master_chart(db)
db.close()
```

### 2. Query the Master Chart

**Get all accounts:**
```bash
curl http://localhost:8000/api/v1/masterchart
```

**Get tree structure:**
```bash
curl http://localhost:8000/api/v1/masterchart/tree
```

**Get specific account:**
```bash
curl http://localhost:8000/api/v1/masterchart/10001
```

**Get statistics:**
```bash
curl http://localhost:8000/api/v1/masterchart/stats
```

### 3. Map Company Accounts

Once the master chart is loaded, you can:

1. Upload company chart of accounts (Excel)
2. Use automatic mapping engine
3. Review and adjust mappings
4. Synchronize with QuickBooks

---

## Data Quality

### Validation Checks

✓ **Code Uniqueness:** All 345 codes are unique  
✓ **Code Ranges:** All codes within designated GAAP ranges  
✓ **Parent References:** All parent_code values exist  
✓ **Hierarchy Integrity:** No circular references  
✓ **Category Consistency:** All accounts have valid categories  
✓ **Date Validity:** All dates are valid and logical  

### Completeness

✓ **100% Coverage:** All 7 major account categories represented  
✓ **Comprehensive Subcategories:** 44 distinct subcategories  
✓ **Cost Center Assignment:** All accounts assigned  
✓ **GAAP Compliance:** Full US-GAAP alignment  
✓ **Documentation:** Every account has detailed description  

---

## Maintenance

### Adding New Accounts

1. Determine appropriate category and code range
2. Assign next available code in range
3. Set parent_code to category header
4. Set level = 2 (detail account)
5. Populate all required fields
6. Add extended attributes in notes field

**Example:**
```json
{
  "code": "10500",
  "description": "New Asset Account",
  "start_date": "2025-01-01",
  "end_date": null,
  "type": "D",
  "parent_code": "10000",
  "level": 2,
  "category": "Asset",
  "notes": "{\"subcategory\": \"Current Asset - General\", ...}"
}
```

### Deactivating Accounts

Set `end_date` to deactivation date:
```json
{
  "code": "10001",
  "end_date": "2025-12-31"
}
```

### Modifying Accounts

Update via API:
```bash
curl -X PUT http://localhost:8000/api/v1/masterchart/10001 \
  -H "Content-Type: application/json" \
  -d '{"description": "Updated Description"}'
```

---

## Integration with ChartForge

### Automatic Mapping

The master chart is used by ChartForge's automatic mapping engine:

1. **Fuzzy Matching:** Company account names are matched to master account descriptions
2. **Category Filtering:** Matches are filtered by category
3. **Confidence Scoring:** Each match gets a confidence score
4. **Manual Review:** Low-confidence matches flagged for review

### QuickBooks Sync

Master chart accounts can be synchronized with QuickBooks Online:

1. **OAuth Connection:** Connect to QuickBooks
2. **Account Mapping:** Map QBO accounts to master chart
3. **Bi-directional Sync:** Keep accounts in sync
4. **Transaction Import:** Import transactions mapped to master chart

---

## Technical Specifications

### Database Schema (PostgreSQL)

```sql
CREATE TABLE master_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR UNIQUE NOT NULL,
    description VARCHAR NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    type VARCHAR(1) NOT NULL,  -- 'H' or 'D'
    parent_code VARCHAR,
    level INTEGER NOT NULL,
    category VARCHAR NOT NULL,
    notes TEXT,
    parent_id UUID REFERENCES master_accounts(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_master_accounts_code ON master_accounts(code);
CREATE INDEX idx_master_accounts_category ON master_accounts(category);
CREATE INDEX idx_master_accounts_parent_id ON master_accounts(parent_id);
```

### API Endpoints

- `GET /api/v1/masterchart` - List all accounts
- `POST /api/v1/masterchart` - Create account
- `GET /api/v1/masterchart/tree` - Get hierarchical tree
- `GET /api/v1/masterchart/stats` - Get statistics
- `GET /api/v1/masterchart/{code}` - Get specific account
- `PUT /api/v1/masterchart/{code}` - Update account
- `DELETE /api/v1/masterchart/{code}` - Delete account
- `POST /api/v1/masterchart/rebuild-hierarchy` - Rebuild parent relationships

---

## Related Documentation

- **Technical Report:** `/docs/technical_report.md` - Complete methodology and analysis
- **Executive Summary:** `/docs/EXECUTIVE_SUMMARY.md` - Project overview
- **Workbook Guide:** `/docs/WORKBOOK_GUIDE.md` - Excel/Google Sheets usage
- **Google Sheets Guide:** `/docs/GOOGLE_SHEETS_SETUP_GUIDE.md` - Cloud setup

---

## Support

For questions or issues:

1. Check the technical report for detailed explanations
2. Review the API documentation at `/docs/api`
3. Consult the ChartForge README.md
4. Open an issue on GitHub

---

## Version History

**v1.0** - November 23, 2025
- Initial release
- 345 accounts (7 headers + 338 details)
- Complete US-GAAP compliance
- Full cost center assignments
- Comprehensive documentation

---

## License

This master chart data is provided as part of the ChartForge project.  
See the main LICENSE file for details.

---

**Generated by:** US-GAAP Master Chart Project  
**Date:** November 23, 2025  
**Status:** Production Ready ✓

# US-GAAP Master Chart of Accounts

## 🎯 Overview

ChartForge now includes a **comprehensive US-GAAP Master Chart of Accounts** with **345 accounts** (7 category headers + 338 detail accounts) designed for multi-company accounting operations.

This master chart was created through advanced semantic clustering and analysis of **1,003 legacy accounts** from multiple US companies, achieving a **66% consolidation** while maintaining full operational coverage and US-GAAP compliance.

---

## 📊 Quick Stats

| Metric | Value |
|--------|-------|
| **Total Accounts** | 345 (7 headers + 338 details) |
| **Source Accounts** | 1,003 legacy accounts |
| **Consolidation Ratio** | 2.97:1 (66% reduction) |
| **GAAP Compliance** | 100% ✓ |
| **Coverage** | All major account categories |
| **Cost Centers** | 10 defined |
| **Documentation** | Complete with examples |

---

## 📂 Files and Locations

### Backend Data Files
Located in `backend/app/data/`:

1. **`us_gaap_master_chart.json`** (500 KB)
   - Complete master chart in ChartForge database format
   - Ready for API import or database seeding

2. **`us_gaap_master_chart.csv`** (spreadsheet format)
   - Human-readable format for Excel/Google Sheets
   - Easy review and analysis

3. **`seed_us_gaap.py`** (Python script)
   - Database seeding script
   - Run: `python app/data/seed_us_gaap.py`

4. **`master_chart_summary.json`** (statistics)
   - Account counts by category
   - Code ranges and metadata

5. **`README.md`** (detailed documentation)
   - Complete usage instructions
   - API endpoints and examples

### Documentation
Located in `docs/`:

1. **`technical_report.md`** (46 KB, 1,293 lines)
   - Complete methodology and analysis
   - Clustering algorithms explained
   - GAAP compliance rationale
   - Implementation roadmap

2. **`EXECUTIVE_SUMMARY.md`** (12 KB)
   - Project overview and results
   - Business benefits
   - Success metrics

3. **`WORKBOOK_GUIDE.md`** (13 KB)
   - Excel workbook usage guide
   - Sheet-by-sheet instructions
   - Best practices

4. **`GOOGLE_SHEETS_SETUP_GUIDE.md`** (13 KB)
   - Google Sheets import guide
   - Enhanced features setup
   - Collaboration tips

### Assets
Located in `assets/`:

1. **`US_GAAP_Accounting_Workbook.xlsx`** (131 KB)
   - 11-sheet Excel workbook
   - P&L, Balance Sheet, Cash Flow, Trial Balance
   - Templates and reference sheets

2. **`US_GAAP_GoogleSheets_Optimized.xlsx`** (131 KB)
   - Google Sheets-optimized version
   - Same content, cloud-ready

---

## 🏗️ Master Chart Structure

### Category Breakdown

| Category | Code Range | Accounts | Description |
|----------|------------|----------|-------------|
| **Asset** | 10000-19867 | 144 | Cash, AR, inventory, fixed assets, investments |
| **Liability** | 20000-29790 | 56 | AP, loans, accruals, deferred revenue |
| **Equity** | 30000-39360 | 16 | Capital, retained earnings, distributions |
| **Revenue** | 40000-49228 | 13 | Sales, service revenue, other income |
| **COGS** | 50000-59761 | 44 | Direct costs, materials, labor, freight |
| **Expense** | 60000-69794 | 60 | Operating expenses, admin, marketing, R&D |
| **Other** | 80000-87996 | 5 | Non-operating items, extraordinary items |

### Hierarchy

**Level 1: Category Headers (7 accounts)**
- Parent accounts for each major category
- Type: "H" (Header)
- Codes: 10000, 20000, 30000, 40000, 50000, 60000, 80000

**Level 2: Detail Accounts (338 accounts)**
- Operational accounts for daily transactions
- Type: "D" (Detail)
- Each references a category header as parent

---

## 🚀 Getting Started

### 1. Load the Master Chart

**Option A: Using the seed script (Recommended)**
```bash
cd backend
python app/data/seed_us_gaap.py
```

**Option B: Using the API**
```bash
# Start the backend
cd backend
docker-compose up

# In another terminal, load the data
python app/data/seed_us_gaap.py
```

**Option C: Manual import via API**
```python
import requests
import json

with open('backend/app/data/us_gaap_master_chart.json') as f:
    accounts = json.load(f)

for account in accounts:
    response = requests.post(
        'http://localhost:8000/api/v1/masterchart',
        json=account
    )
    print(f"Created {account['code']}: {response.status_code}")
```

### 2. Verify the Import

**Check account count:**
```bash
curl http://localhost:8000/api/v1/masterchart/stats
```

**View all accounts:**
```bash
curl http://localhost:8000/api/v1/masterchart
```

**View tree structure:**
```bash
curl http://localhost:8000/api/v1/masterchart/tree
```

### 3. Start Using

Once loaded, you can:
- ✓ Upload company charts of accounts
- ✓ Use automatic mapping engine
- ✓ Map to QuickBooks accounts
- ✓ Generate financial reports
- ✓ Analyze account usage

---

## 💡 Key Features

### 1. Comprehensive Coverage

**All Account Types:**
- Current and non-current assets
- Short-term and long-term liabilities
- Multiple equity components
- Diverse revenue streams
- Detailed COGS breakdown
- Complete expense categories

**Subcategories (44 total):**
- Cash and Cash Equivalents
- Accounts Receivable
- Inventory (multiple types)
- Fixed Assets (vehicles, equipment, property)
- Loans Payable
- Accrued Expenses
- And 38 more...

### 2. Rich Metadata

Each account includes:
- **Code:** 5-digit US-GAAP code
- **Description:** Clear, concise name
- **Category:** Main classification
- **Subcategory:** Detailed classification
- **Normal Balance:** Debit or Credit
- **Cash Flow Class:** Operating/Investing/Financing
- **Cost Center:** Assigned department
- **GAAP Classification:** US-GAAP category
- **Detailed Description:** Usage guidance
- **Examples:** Sample transactions
- **GAAP Rationale:** Why this account exists

### 3. Cost Center Integration

**10 Cost Centers Defined:**
- CC-0000: Unallocated / Balance Sheet (216 accounts)
- CC-1000: Executive & Corporate
- CC-2000: Finance & Accounting (109 accounts)
- CC-3000: Operations
- CC-4000: Sales & Marketing (13 accounts)
- CC-5000: Real Estate & Property Management
- CC-6000: Field Services & Cleaning Operations
- CC-7000: Loan & Financial Services Operations
- CC-8000: Information Technology & Systems
- CC-9000: Administration & General Support

**Benefits:**
- Department-level reporting
- Cost allocation
- Budget management
- Performance tracking

### 4. Hierarchical Structure

**Parent-Child Relationships:**
- Category headers organize detail accounts
- Easy navigation and reporting
- Supports rollup calculations
- Flexible for custom hierarchies

**Example:**
```
10000 ASSET (Header)
  ├─ 10001 Cash - Operating Account
  ├─ 10002 Cash - Payroll Account
  ├─ 10003 Cash - Savings Account
  └─ ... (141 more asset accounts)
```

---

## 🔧 Integration with ChartForge

### Automatic Mapping Engine

The master chart powers ChartForge's automatic mapping:

1. **Upload Company Chart**
   - Excel file with company accounts
   - Parsed automatically

2. **Fuzzy Matching**
   - Company account names matched to master chart
   - Uses difflib for similarity scoring

3. **Confidence Scoring**
   - High confidence: Auto-map
   - Medium confidence: Suggest
   - Low confidence: Manual review

4. **Category Filtering**
   - Matches filtered by account type
   - Improves accuracy

**Example:**
```
Company Account: "Bank Account - Checking"
Master Match: "Cash - Operating Account" (95% confidence)
Action: Auto-map
```

### QuickBooks Integration

**Sync with QuickBooks Online:**

1. **OAuth Connection**
   - Connect to QBO via OAuth2
   - Secure authentication

2. **Account Mapping**
   - Map QBO accounts to master chart
   - Bi-directional sync

3. **Transaction Import**
   - Import QBO transactions
   - Automatically mapped to master chart

4. **Reporting**
   - Generate reports using master chart
   - Consistent across all companies

---

## 📈 Use Cases

### 1. Multi-Company Consolidation

**Scenario:** You manage 5 companies with different charts of accounts

**Solution:**
1. Load master chart into ChartForge
2. Upload each company's chart
3. Use automatic mapping
4. Review and adjust mappings
5. Generate consolidated reports

**Benefit:** Consistent reporting across all companies

### 2. QuickBooks Migration

**Scenario:** Migrating from legacy system to QuickBooks

**Solution:**
1. Map legacy accounts to master chart
2. Map master chart to QBO accounts
3. Import historical transactions
4. Maintain mapping for ongoing sync

**Benefit:** Smooth migration with data integrity

### 3. Financial Reporting

**Scenario:** Need standardized financial statements

**Solution:**
1. Use master chart as reporting standard
2. Map all company accounts
3. Generate P&L, Balance Sheet, Cash Flow
4. Export to Excel or Google Sheets

**Benefit:** Professional, GAAP-compliant reports

### 4. Budget Management

**Scenario:** Need department-level budgets

**Solution:**
1. Use cost center assignments
2. Create budgets by cost center
3. Track actual vs. budget
4. Generate variance reports

**Benefit:** Detailed cost control

---

## 📚 Documentation

### For Developers

**API Documentation:**
- See `backend/app/api/v1/masterchart.py`
- Swagger UI: `http://localhost:8000/docs`

**Database Schema:**
- See `backend/app/db/models/master_account.py`
- PostgreSQL with SQLAlchemy ORM

**Service Layer:**
- See `backend/app/services/masterchart_service.py`
- Business logic and CRUD operations

### For Accountants

**Technical Report:**
- See `docs/technical_report.md`
- Complete methodology and GAAP compliance

**Workbook Guide:**
- See `docs/WORKBOOK_GUIDE.md`
- How to use Excel workbook

**Google Sheets Guide:**
- See `docs/GOOGLE_SHEETS_SETUP_GUIDE.md`
- Cloud-based accounting

### For Managers

**Executive Summary:**
- See `docs/EXECUTIVE_SUMMARY.md`
- Business benefits and ROI

**Master Chart README:**
- See `backend/app/data/README.md`
- Quick reference and usage

---

## 🎓 Training Resources

### Excel Workbook (assets/)

**11 Professional Sheets:**
1. Master Chart of Accounts
2. Cost Centers
3. Account Summary
4. P&L Apurator (Profit & Loss)
5. Balance Sheet
6. Trial Balance
7. Legacy Mapping
8. Cash Flow Statement
9. General Ledger (template)
10. Journal Entry (template)
11. Account Lookup (quick reference)

**Features:**
- All formulas pre-built
- Professional formatting
- Ready for data entry
- Export to PDF

**Use for:**
- Training staff
- Manual accounting
- Report generation
- Data validation

### Google Sheets Version

**Same content, cloud-ready:**
- Real-time collaboration
- Automatic saving
- Mobile access
- Version history

**Setup:**
1. Upload `US_GAAP_GoogleSheets_Optimized.xlsx`
2. Follow `GOOGLE_SHEETS_SETUP_GUIDE.md`
3. Share with team
4. Start collaborating

---

## 🔍 Quality Assurance

### Validation Checks ✓

- **Code Uniqueness:** All 345 codes unique
- **Code Ranges:** All within GAAP ranges
- **Parent References:** All valid
- **Hierarchy Integrity:** No circular refs
- **Category Consistency:** All valid
- **Date Validity:** All dates logical

### Completeness ✓

- **100% Coverage:** All 7 categories
- **44 Subcategories:** Comprehensive
- **Cost Centers:** All assigned
- **GAAP Compliance:** Full alignment
- **Documentation:** Every account

### Testing ✓

- **Database Import:** Tested
- **API Operations:** Tested
- **Mapping Engine:** Tested
- **QuickBooks Sync:** Tested
- **Report Generation:** Tested

---

## 🛠️ Maintenance

### Adding Accounts

1. Choose category and code range
2. Assign next available code
3. Set parent to category header
4. Populate all fields
5. Add via API or database

**Example:**
```bash
curl -X POST http://localhost:8000/api/v1/masterchart \
  -H "Content-Type: application/json" \
  -d '{
    "code": "10500",
    "description": "New Asset Account",
    "start_date": "2025-01-01",
    "type": "D",
    "parent_code": "10000",
    "category": "Asset",
    "notes": "{...}"
  }'
```

### Updating Accounts

```bash
curl -X PUT http://localhost:8000/api/v1/masterchart/10001 \
  -H "Content-Type: application/json" \
  -d '{"description": "Updated Description"}'
```

### Deactivating Accounts

```bash
curl -X PUT http://localhost:8000/api/v1/masterchart/10001 \
  -H "Content-Type: application/json" \
  -d '{"end_date": "2025-12-31"}'
```

### Deleting Accounts

```bash
curl -X DELETE http://localhost:8000/api/v1/masterchart/10001
```

---

## 📞 Support

### Documentation
- **Technical:** `docs/technical_report.md`
- **API:** `http://localhost:8000/docs`
- **Data:** `backend/app/data/README.md`

### GitHub
- **Issues:** Open an issue for bugs
- **Discussions:** Ask questions
- **Pull Requests:** Contribute improvements

### Community
- **Discord:** [Join our community]
- **Email:** support@chartforge.com

---

## 🎉 What's Next?

### Immediate Steps

1. **Load the Master Chart**
   ```bash
   python backend/app/data/seed_us_gaap.py
   ```

2. **Verify Import**
   ```bash
   curl http://localhost:8000/api/v1/masterchart/stats
   ```

3. **Upload Company Chart**
   - Use the frontend UI
   - Or API: `POST /api/v1/upload`

4. **Run Auto-Mapping**
   ```bash
   curl -X POST http://localhost:8000/api/v1/mapping/auto?company_id=<id>
   ```

5. **Review Mappings**
   - Use frontend UI
   - Adjust as needed

6. **Generate Reports**
   - Use Excel workbook
   - Or export from ChartForge

### Future Enhancements

- [ ] Industry-specific charts (retail, manufacturing, etc.)
- [ ] International GAAP support (IFRS, etc.)
- [ ] AI-powered mapping improvements
- [ ] Advanced reporting templates
- [ ] Mobile app integration

---

## 📄 License

This master chart data is provided as part of the ChartForge project.  
See the main LICENSE file for details.

---

## 🙏 Acknowledgments

**Created by:** US-GAAP Master Chart Project Team  
**Date:** November 23, 2025  
**Methodology:** Semantic clustering of 1,003 legacy accounts  
**Standard:** US-GAAP compliant  
**Status:** Production Ready ✓

---

**Ready to use! Start with the seed script and explore the documentation.** 🚀

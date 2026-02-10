# Enriched Master Chart of Accounts

## Overview

This directory contains the **enriched version** of the US-GAAP Master Chart of Accounts with enhanced fields following IFRS + US-GAAP best practices.

**Version:** 2.0 (Enriched)  
**Date:** November 30, 2025  
**Total Accounts:** 345 (7 headers + 338 details)  
**Compliance:** IFRS + US-GAAP

---

## What's New in the Enriched Version

### Enhanced Fields Added

| Field | Description | Example |
|-------|-------------|---------|
| **long_description** | Professional 2-4 sentence explanation in IFRS/GAAP style | "This account represents liquid funds held by the entity in the form of cash - operating account. Cash and cash equivalents are the most liquid assets..." |
| **fs_mapping** | Financial statement classification | "Balance Sheet" or "Income Statement" |
| **tags** | Keywords for AI classification and search | "cash, liquid, bank, money, funds, debit, operating-activities" |
| **default_vendors** | Common vendors typically associated with this account | "Shell, Chevron, BP, ExxonMobil, Speedway" |
| **regulatory_mapping** | IFRS/IPSAS/ASC references | "IAS 7 - Statement of Cash Flows; ASC 305 - Cash and Cash Equivalents" |

---

## Files

### 1. `enriched_master_chart.csv` (822 KB)
Complete enriched chart in CSV format with all fields.

**Column Order:**
1. `code` - 5-digit account code
2. `description` - Short account name
3. `long_description` - Professional IFRS/GAAP explanation
4. `type` - "Header" or "Detail"
5. `category` - Asset, Liability, Equity, Revenue, Expense, etc.
6. `fs_mapping` - "Balance Sheet" or "Income Statement"
7. `parent_code` - Parent account code (for hierarchy)
8. `normal_balance` - "Debit" or "Credit"
9. `tags` - Comma-separated keywords
10. `default_vendors` - Comma-separated vendor names
11. `regulatory_mapping` - IFRS/ASC references
12. `start_date` - Account activation date (empty)
13. `end_date` - Account deactivation date (empty)
14. `notes` - Additional notes
15. `subcategory` - Detailed classification
16. `cash_flow_classification` - Operating/Investing/Financing
17. `cost_center` - Assigned cost center
18. `GAAP_classification` - US-GAAP category
19. `detailed_description` - Original detailed description

### 2. `enriched_master_chart.json` (975 KB)
Same data in JSON format for programmatic access.

---

## Field Details

### long_description

Professional explanations written in formal accounting language, following IFRS and US-GAAP terminology.

**Example for Cash Account:**
```
This account represents liquid funds held by the entity in the form of cash - operating account. 
Cash and cash equivalents are the most liquid assets and are used for day-to-day operational 
transactions. Under IAS 7 and ASC 305, these funds must be readily available and not subject to 
significant risk of changes in value. Proper management and reconciliation of cash accounts is 
critical for accurate financial reporting and liquidity assessment.
```

**Example for Inventory Account:**
```
This account represents inventory held for sale in the ordinary course of business, in the process 
of production, or in the form of materials to be consumed in production or service delivery. Under 
IAS 2 and ASC 330, inventory is measured at the lower of cost and net realizable value. Proper 
inventory valuation and turnover analysis are essential for operational efficiency and accurate 
cost of goods sold determination.
```

### fs_mapping

Indicates which primary financial statement the account appears on:

- **Balance Sheet**: Assets, Liabilities, Equity
- **Income Statement**: Revenue, Cost of Goods Sold, Expenses, Other Income/Expense

This field enables automatic financial statement generation and ensures proper account classification.

### tags

AI-friendly keywords for:
- Automatic categorization
- Search and filtering
- Machine learning classification
- Natural language processing

**Tag Categories:**
- Account type (asset, liability, revenue, expense)
- Subcategory keywords (cash, receivable, inventory)
- Normal balance (debit, credit)
- Cash flow classification (operating-activities, investing-activities, financing-activities)
- Specific attributes (liquid, fixed-asset, payroll, etc.)

**Example:**
```
Account: Cash - Operating Account
Tags: cash, liquid, bank, money, funds, asset, debit, operating-activities
```

### default_vendors

Common vendors or payees typically associated with this expense account.

**Purpose:**
- Automatic transaction categorization
- Bank feed rule creation
- Vendor-to-account mapping
- AI-powered bookkeeping

**Examples:**

| Account | Default Vendors |
|---------|----------------|
| Fuel Expense | Shell, Chevron, BP, ExxonMobil, Speedway |
| Office Supplies | Amazon Business, Staples, Office Depot, Quill |
| Software Subscriptions | Microsoft, Adobe, Salesforce, QuickBooks, Zoom |
| Telecommunications | Verizon, AT&T, T-Mobile, Comcast |
| Travel Expenses | United Airlines, Delta, American Airlines, Expedia, Hotels.com |

**Note:** 59 accounts have vendor mappings (primarily expense accounts).

### regulatory_mapping

References to applicable IFRS, IPSAS, and ASC (US-GAAP) standards.

**Format:** `IFRS/IAS Standard - Description; ASC Topic - Description`

**Examples:**

| Account Type | Regulatory Mapping |
|--------------|-------------------|
| Cash | IAS 7 - Statement of Cash Flows; ASC 305 - Cash and Cash Equivalents |
| Accounts Receivable | IFRS 9 - Financial Instruments; ASC 310 - Receivables |
| Inventory | IAS 2 - Inventories; ASC 330 - Inventory |
| Fixed Assets | IAS 16 - Property, Plant and Equipment; ASC 360 - Property, Plant, and Equipment |
| Revenue | IFRS 15 - Revenue from Contracts; ASC 606 - Revenue Recognition |
| Payroll | IAS 19 - Employee Benefits; ASC 710 - Compensation |

---

## Use Cases

### 1. AI-Powered Transaction Categorization

Use the `tags` and `default_vendors` fields to train machine learning models:

```python
# Example: Match transaction to account
transaction = {
    'vendor': 'Shell Gas Station',
    'amount': 45.00,
    'description': 'Fuel purchase'
}

# Search accounts by vendor
for account in enriched_chart:
    if 'Shell' in account['default_vendors']:
        print(f"Suggested account: {account['code']} - {account['description']}")
        # Output: 10690 - Vehicle expenses:Vehicle gas & fuel
```

### 2. Automated Bank Feed Rules

Create QuickBooks bank rules automatically:

```python
# For each account with vendors
for account in enriched_chart:
    if account['default_vendors']:
        vendors = account['default_vendors'].split(', ')
        for vendor in vendors:
            create_bank_rule(
                vendor_name=vendor,
                account_code=account['code'],
                account_name=account['description']
            )
```

### 3. Financial Statement Generation

Use `fs_mapping` to automatically group accounts:

```python
# Generate Balance Sheet
balance_sheet_accounts = [
    acc for acc in enriched_chart 
    if acc['fs_mapping'] == 'Balance Sheet'
]

# Generate Income Statement
income_statement_accounts = [
    acc for acc in enriched_chart 
    if acc['fs_mapping'] == 'Income Statement'
]
```

### 4. Compliance Documentation

Use `regulatory_mapping` and `long_description` for audit documentation:

```python
# Generate compliance report
for account in enriched_chart:
    if account['type'] == 'Detail':
        print(f"Account: {account['description']}")
        print(f"Standards: {account['regulatory_mapping']}")
        print(f"Description: {account['long_description']}")
        print()
```

### 5. Natural Language Search

Use `tags` for intelligent search:

```python
# User searches for "payroll"
search_term = "payroll"
results = [
    acc for acc in enriched_chart 
    if search_term in acc['tags'].lower()
]
```

---

## Statistics

### Enrichment Coverage

| Metric | Count | Percentage |
|--------|-------|------------|
| **Accounts with long_description** | 345 | 100% |
| **Accounts with fs_mapping** | 345 | 100% |
| **Accounts with tags** | 345 | 100% |
| **Accounts with regulatory_mapping** | 345 | 100% |
| **Accounts with default_vendors** | 59 | 17.1% |

### Vendor Mapping Categories

| Category | Accounts | Sample Vendors |
|----------|----------|----------------|
| Fuel & Gas | 8 | Shell, Chevron, BP, ExxonMobil |
| Office Supplies | 6 | Amazon Business, Staples, Office Depot |
| Travel | 5 | United Airlines, Delta, Expedia |
| Insurance | 12 | State Farm, Geico, Progressive |
| Utilities | 7 | Local Electric Company, Water Authority |
| Software | 4 | Microsoft, Adobe, Salesforce |
| Telecommunications | 3 | Verizon, AT&T, T-Mobile |
| Professional Services | 5 | Law Firms, Accounting Firms |
| Maintenance | 4 | Local Contractors, Repair Services |
| Shipping | 3 | UPS, FedEx, USPS |
| Advertising | 2 | Google Ads, Facebook Ads |

### Regulatory Standards Referenced

| Standard | Accounts | Description |
|----------|----------|-------------|
| **IAS 1** | 345 | Presentation of Financial Statements |
| **IAS 2** | 44 | Inventories |
| **IAS 7** | 144 | Statement of Cash Flows |
| **IAS 16** | 52 | Property, Plant and Equipment |
| **IFRS 9** | 89 | Financial Instruments |
| **IFRS 15** | 13 | Revenue from Contracts |
| **ASC 210** | 216 | Balance Sheet |
| **ASC 220** | 129 | Income Statement |
| **ASC 305** | 18 | Cash and Cash Equivalents |
| **ASC 310** | 23 | Receivables |
| **ASC 330** | 44 | Inventory |
| **ASC 360** | 52 | Property, Plant, and Equipment |
| **ASC 606** | 13 | Revenue Recognition |

---

## Integration with ChartForge

### Database Schema Enhancement

The enriched fields can be added to the `MasterAccount` model:

```python
class MasterAccount(Base):
    __tablename__ = "master_accounts"
    
    # Existing fields
    id = Column(UUID(as_uuid=True), primary_key=True)
    code = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=False)
    type = Column(String(1), nullable=False)
    category = Column(String, nullable=False)
    parent_code = Column(String, nullable=True)
    normal_balance = Column(String, nullable=False)
    
    # New enriched fields
    long_description = Column(Text, nullable=True)
    fs_mapping = Column(String, nullable=True)
    tags = Column(Text, nullable=True)  # Comma-separated
    default_vendors = Column(Text, nullable=True)  # Comma-separated
    regulatory_mapping = Column(Text, nullable=True)
```

### API Enhancements

New endpoints can leverage the enriched data:

```python
@router.get("/masterchart/search")
def search_accounts(query: str, db: Session = Depends(get_db)):
    """Search accounts by tags, description, or vendors"""
    return db.query(MasterAccount).filter(
        or_(
            MasterAccount.tags.contains(query),
            MasterAccount.description.contains(query),
            MasterAccount.default_vendors.contains(query)
        )
    ).all()

@router.get("/masterchart/by-vendor/{vendor}")
def get_accounts_by_vendor(vendor: str, db: Session = Depends(get_db)):
    """Get accounts associated with a specific vendor"""
    return db.query(MasterAccount).filter(
        MasterAccount.default_vendors.contains(vendor)
    ).all()

@router.get("/masterchart/by-standard/{standard}")
def get_accounts_by_standard(standard: str, db: Session = Depends(get_db)):
    """Get accounts by regulatory standard (e.g., 'IAS 16')"""
    return db.query(MasterAccount).filter(
        MasterAccount.regulatory_mapping.contains(standard)
    ).all()
```

---

## Quality Assurance

### Validation Checks ✓

- **All accounts have long_description**: 345/345 ✓
- **All accounts have fs_mapping**: 345/345 ✓
- **All accounts have tags**: 345/345 ✓
- **All accounts have regulatory_mapping**: 345/345 ✓
- **Vendor mappings where applicable**: 59 accounts ✓
- **Professional language**: IFRS/GAAP terminology ✓
- **Consistent formatting**: All fields standardized ✓

### Sample Quality Check

**Account:** 10001 - Cash - Operating Account

```json
{
  "code": "10001",
  "description": "Cash - Operating Account",
  "long_description": "This account represents liquid funds held by the entity in the form of cash - operating account. Cash and cash equivalents are the most liquid assets and are used for day-to-day operational transactions. Under IAS 7 and ASC 305, these funds must be readily available and not subject to significant risk of changes in value. Proper management and reconciliation of cash accounts is critical for accurate financial reporting and liquidity assessment.",
  "type": "Detail",
  "category": "Asset",
  "fs_mapping": "Balance Sheet",
  "parent_code": "10000",
  "normal_balance": "Debit",
  "tags": "cash, liquid, bank, money, funds, asset, debit, operating-activities",
  "default_vendors": "",
  "regulatory_mapping": "IAS 7 - Statement of Cash Flows; ASC 305 - Cash and Cash Equivalents"
}
```

---

## Comparison: Original vs. Enriched

| Feature | Original | Enriched |
|---------|----------|----------|
| **Total Fields** | 9 | 19 |
| **Description Quality** | Basic | Professional IFRS/GAAP |
| **FS Mapping** | ❌ | ✓ |
| **AI Tags** | ❌ | ✓ |
| **Vendor Mapping** | ❌ | ✓ (59 accounts) |
| **Regulatory References** | ❌ | ✓ (All accounts) |
| **Long Descriptions** | ❌ | ✓ (2-4 sentences) |
| **Search Capability** | Limited | Enhanced |
| **AI-Ready** | Partial | Full |
| **Compliance Documentation** | Basic | Complete |

---

## Migration from Original Chart

If you're currently using the original `us_gaap_master_chart.csv`, you can migrate to the enriched version:

### Option 1: Fresh Import
1. Backup your current database
2. Drop existing master accounts
3. Import `enriched_master_chart.csv`

### Option 2: Update Existing
1. Add new columns to `master_accounts` table
2. Run update script to populate new fields
3. Verify data integrity

---

## Future Enhancements

Potential additions to the enriched chart:

- [ ] Industry-specific vendor mappings
- [ ] Multi-language descriptions (Spanish, Portuguese, French)
- [ ] Tax form mappings (1099, W-2, etc.)
- [ ] Department/location assignments
- [ ] Budget vs. actual tracking flags
- [ ] KPI associations
- [ ] Audit trail requirements
- [ ] Data retention policies

---

## Support

For questions about the enriched master chart:

1. Review this README
2. Check the main `README.md` in this directory
3. Consult the technical report in `/docs/`
4. Open an issue on GitHub

---

## Version History

**v2.0 - November 30, 2025**
- Added long_description field (professional IFRS/GAAP explanations)
- Added fs_mapping field (Balance Sheet / Income Statement)
- Added tags field (AI classification keywords)
- Added default_vendors field (59 accounts mapped)
- Added regulatory_mapping field (IFRS/ASC references)
- Enhanced all 345 accounts with new fields

**v1.0 - November 23, 2025**
- Initial release with 345 accounts
- Basic fields: code, description, category, normal_balance
- Hierarchical structure
- Cost center assignments

---

**Generated by:** ChartForge Master Chart Enrichment Project  
**Date:** November 30, 2025  
**Status:** Production Ready ✓
**Compliance:** IFRS + US-GAAP ✓

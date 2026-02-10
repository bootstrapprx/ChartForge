# US-GAAP Accounting Workbook - User Guide

**File:** US_GAAP_Accounting_Workbook.xlsx  
**Size:** 131 KB  
**Sheets:** 11  
**Date:** November 23, 2025

---

## Overview

This comprehensive Excel workbook contains the complete US-GAAP Master Chart of Accounts with all associated accounting reports and templates. It is designed for immediate use in financial accounting, reporting, and analysis.

---

## Workbook Structure

### 1. **Master Chart of Accounts**
**Purpose:** Complete listing of all 338 master accounts with full details

**Columns:**
- Account Code (5-digit US-GAAP code)
- Account Name
- Category (Asset, Liability, Equity, Revenue, COGS, Expense)
- Subcategory (detailed classification)
- Normal Balance (Debit/Credit)
- Cash Flow Class (Operating/Investing/Financing)
- Cost Center (CC-XXXX)
- GAAP Classification
- Description (detailed usage guidance)

**Usage:** Reference sheet for all account information. Use for account selection, training, and documentation.

---

### 2. **Cost Centers**
**Purpose:** Detailed cost center structure with descriptions

**Columns:**
- Code (CC-XXXX format)
- Name
- Description (purpose and scope)
- Rationale (why this cost center exists)
- Account Count (number of accounts assigned)

**Cost Centers Defined:**
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

**Usage:** Reference for cost center assignments and management reporting structure.

---

### 3. **Account Summary**
**Purpose:** High-level summary of accounts by category

**Columns:**
- Category
- Account Count
- Code Range
- Normal Balance
- Primary Cash Flow Class

**Categories:**
- Assets: 144 accounts (10000-19867)
- Liabilities: 56 accounts (20000-29790)
- Equity: 16 accounts (30000-39360)
- Revenue: 13 accounts (40000-49228)
- Cost of Goods Sold: 44 accounts (50000-59761)
- Expenses: 60 accounts (60000-69794)
- Other: 5 accounts (80000-87996)

**Usage:** Quick overview of chart structure and account distribution.

---

### 4. **P&L Apurator** (Profit & Loss Statement)
**Purpose:** Income statement with automatic calculations

**Structure:**
- **Revenue Section:** All revenue accounts with subtotal
- **COGS Section:** All cost of goods sold accounts with subtotal
- **Gross Profit:** Automatically calculated (Revenue - COGS)
- **Operating Expenses:** All expense accounts with subtotal
- **Net Income:** Automatically calculated (Gross Profit - Operating Expenses)

**How to Use:**
1. Enter amounts in column D for each account
2. Totals and Net Income calculate automatically
3. All formulas are pre-built and protected
4. Update the period in cell A2

**Formulas:**
- Total Revenue: SUM of all revenue accounts
- Total COGS: SUM of all COGS accounts
- Gross Profit: Total Revenue - Total COGS
- Total Operating Expenses: SUM of all expense accounts
- Net Income: Gross Profit - Total Operating Expenses

---

### 5. **Balance Sheet**
**Purpose:** Statement of financial position with automatic calculations

**Structure:**
- **Assets Section:** All asset accounts with subtotal
- **Liabilities Section:** All liability accounts with subtotal
- **Equity Section:** All equity accounts with subtotal
- **Total Liabilities & Equity:** Automatically calculated

**How to Use:**
1. Enter account balances in column D
2. Totals calculate automatically
3. Verify Assets = Liabilities + Equity
4. Update the date in cell A2

**Accounting Equation:**
Total Assets = Total Liabilities + Total Equity

---

### 6. **Trial Balance**
**Purpose:** Verification report showing all accounts with debit/credit balances

**Columns:**
- Account Code
- Account Name
- Debit (enter debit balances)
- Credit (enter credit balances)
- Balance (automatically calculated as Debit - Credit)

**How to Use:**
1. Enter debit balances in column C
2. Enter credit balances in column D
3. Balance column (E) calculates automatically
4. Verify total debits = total credits at bottom
5. Use for period-end verification and reconciliation

**Validation:**
- Total Debits should equal Total Credits
- Total Balance should equal zero

---

### 7. **Legacy Mapping**
**Purpose:** Complete mapping from legacy accounts to master accounts

**Columns:**
- Legacy Code
- Legacy Name
- Legacy Description
- Master Code
- Master Name
- Cost Center

**Contains:** 1,003 legacy account mappings

**Usage:**
- Data migration reference
- Historical account lookup
- Audit trail documentation
- Training and transition support

---

### 8. **Cash Flow Statement**
**Purpose:** Statement of cash flows organized by activity type

**Structure:**
- **Operating Activities:** 269 accounts
- **Investing Activities:** 53 accounts
- **Financing Activities:** 16 accounts
- **Net Change in Cash:** Automatically calculated

**How to Use:**
1. Enter cash flow amounts in column D
2. Subtotals calculate automatically for each section
3. Net Change in Cash calculates automatically
4. Update period in cell A2

**Cash Flow Categories:**
- Operating: Day-to-day business operations
- Investing: Capital expenditures and investments
- Financing: Debt, equity, and distributions

---

### 9. **General Ledger**
**Purpose:** Template for detailed account transaction tracking

**Columns:**
- Date
- Reference (invoice #, check #, etc.)
- Description
- Debit
- Credit
- Balance
- Posted By
- Notes

**How to Use:**
1. Select account in cell A2
2. Enter transactions row by row
3. Balance column tracks running balance
4. Use for detailed account analysis
5. Filter and sort as needed

**Template includes:** 20 blank rows for data entry

---

### 10. **Journal Entry**
**Purpose:** Template for recording journal entries

**Header Information:**
- Entry Number
- Date
- Prepared By
- Approved By
- Description

**Entry Columns:**
- Account Code
- Account Name
- Description
- Debit
- Credit
- Cost Center

**Features:**
- Automatic debit/credit totals
- Difference calculation (must be zero)
- Validation check for balanced entry
- 15 line items per entry

**How to Use:**
1. Fill in header information
2. Enter account codes and amounts
3. Verify totals balance (Debit = Credit)
4. Difference row shows any imbalance in RED
5. Obtain approval before posting

---

### 11. **Account Lookup**
**Purpose:** Quick reference table for account codes and details

**Columns:**
- Code
- Name
- Category
- Subcategory
- Normal Balance
- Cost Center

**Contains:** All 338 master accounts sorted by code

**Usage:**
- Quick account code lookup
- Account selection reference
- Copy account codes for journal entries
- Training and reference material

---

## Key Features

### Automatic Calculations
All financial statement sheets (P&L, Balance Sheet, Cash Flow, Trial Balance) include built-in formulas that automatically calculate subtotals and totals. Simply enter amounts and the reports update instantly.

### Professional Formatting
- Color-coded headers (dark blue)
- Subtotal rows (light gray)
- Total rows (yellow highlight)
- Consistent borders and alignment
- Number formatting (#,##0.00)

### Data Validation
- Trial Balance validates debit/credit equality
- Journal Entry template validates balanced entries
- All formulas are pre-built and tested

### Complete Documentation
- 338 master accounts with detailed descriptions
- 10 cost centers with rationale
- 1,003 legacy account mappings
- Full US-GAAP compliance

---

## Usage Recommendations

### For Controllers
- Use **Master Chart of Accounts** for account structure reference
- Use **P&L Apurator** and **Balance Sheet** for monthly close
- Use **Trial Balance** for reconciliation and verification
- Use **Account Summary** for high-level reporting

### For Accountants
- Use **Journal Entry** template for all manual entries
- Use **General Ledger** for detailed account analysis
- Use **Account Lookup** for quick code reference
- Use **Legacy Mapping** for historical data queries

### For CFOs
- Use **P&L Apurator** for financial performance review
- Use **Balance Sheet** for financial position analysis
- Use **Cash Flow Statement** for liquidity analysis
- Use **Account Summary** for strategic overview

### For Auditors
- Use **Master Chart of Accounts** for account structure review
- Use **Legacy Mapping** for migration audit trail
- Use **Trial Balance** for balance verification
- Use **Cost Centers** for cost allocation review

---

## Best Practices

### Data Entry
1. Always enter amounts in the designated columns (usually column D)
2. Do not modify formula cells (they are calculated automatically)
3. Use consistent date formats
4. Include reference numbers for all transactions
5. Add descriptions for clarity

### Period Close
1. Update period/date in report headers
2. Enter all account balances
3. Verify Trial Balance totals equal zero
4. Review all financial statements
5. Save a copy with period name (e.g., "2025-11_Workbook.xlsx")

### Account Management
1. Refer to Master Chart for account selection
2. Use Account Lookup for quick reference
3. Follow normal balance conventions (Debit/Credit)
4. Assign proper cost centers
5. Document all journal entries

### Version Control
1. Save monthly copies with period identifier
2. Maintain original master workbook
3. Back up regularly
4. Track changes in separate documentation
5. Archive old versions

---

## Technical Specifications

**File Format:** Excel 2007+ (.xlsx)  
**Compatibility:** Microsoft Excel, Google Sheets, LibreOffice Calc  
**Formulas:** Standard Excel SUM, subtraction  
**Macros:** None (no VBA code)  
**Protection:** None (all cells editable)  
**File Size:** 131 KB  

---

## Support and Maintenance

### Adding New Accounts
1. Add to **Master Chart of Accounts** sheet
2. Update **Account Lookup** sheet
3. Add to appropriate financial statement (P&L, Balance Sheet, etc.)
4. Update formulas to include new account
5. Document in change log

### Modifying Reports
1. All sheets are fully editable
2. Formulas can be adjusted as needed
3. Add rows/columns as required
4. Maintain consistent formatting
5. Test calculations after changes

### Troubleshooting
- **Formulas not calculating:** Check if calculation is set to Automatic (Excel Options)
- **Numbers showing as ####:** Widen the column
- **Totals incorrect:** Verify formula ranges include all accounts
- **Balance not zero:** Check for missing entries or formula errors

---

## Quick Start Guide

### First-Time Setup
1. Open the workbook
2. Review **Master Chart of Accounts** to familiarize yourself with account structure
3. Review **Cost Centers** to understand cost allocation
4. Customize report headers with your company name/period
5. Save as a template for future use

### Monthly Close Process
1. Open a copy of the workbook
2. Update period/date in all report headers
3. Enter account balances in **Trial Balance**
4. Verify debits = credits
5. Copy balances to **Balance Sheet**
6. Copy revenue/expense amounts to **P&L Apurator**
7. Review **Cash Flow Statement**
8. Save with period identifier

### Creating Journal Entries
1. Go to **Journal Entry** sheet
2. Fill in header information
3. Use **Account Lookup** to find account codes
4. Enter debits and credits
5. Verify difference = 0
6. Print or save for approval
7. Post to accounting system

---

## Additional Resources

### Related Files
- **us_gaap_master_chart_final.json** - Machine-readable master chart
- **technical_report.md** - Comprehensive technical documentation
- **EXECUTIVE_SUMMARY.md** - Project overview and results

### Documentation
- Full methodology in technical_report.md
- Governance framework in technical_report.md Part 8
- Implementation guide in technical_report.md Part 9

---

## Contact and Support

For questions about:
- **Account structure:** Review Master Chart of Accounts and technical_report.md
- **Usage:** Refer to this guide and sheet-specific instructions
- **Modifications:** Consult with Controller or CFO
- **Technical issues:** Contact IT/ERP support

---

**Document Version:** 1.0  
**Last Updated:** November 23, 2025  
**Prepared By:** US-GAAP Master Chart Project Team

---

**END OF WORKBOOK GUIDE**

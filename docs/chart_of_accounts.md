# Chart of Accounts

## Overview

The Chart of Accounts (CoA) is the backbone of the ChartForge financial system. It serves as the structured repository for all financial data, enabling accurate reporting, tax compliance, and strategic decision-making.

ChartForge implements a **US-GAAP compliant Master Chart** by default, designed to support a wide range of business activities while maintaining a clean, hierarchical structure. This system ensures that every transaction—from revenue generation to operational expenses—is recorded consistently.

## How ChartForge Implements the Master Chart

ChartForge utilizes a standardized, 5-digit coding system to organize accounts. This structure is built into the core of the application, ensuring logical grouping and easy navigation.

### Account Types

Every account in ChartForge belongs to one of five fundamental types, aligning with standard accounting principles:

1.  **Assets (1xxxx)**: Resources owned by the company (e.g., Cash, Equipment).
2.  **Liabilities (2xxxx)**: Financial obligations owed to others (e.g., Accounts Payable, Loans).
3.  **Equity (3xxxx)**: The owner's residual interest in the company (e.g., Retained Earnings).
4.  **Revenue (4xxxx)**: Income generated from business operations (e.g., Sales).
5.  **Expenses (6xxxx - 7xxxx)**: Costs incurred to operate the business (e.g., Rent, Salaries).

### Hierarchical Structure

The system enforces a strict parent-child hierarchy to maintain organization:

*   **Category Headers (Level 1)**: These are non-posting container accounts (e.g., `10000 ASSET`) used solely for grouping and reporting subtotals.
*   **Detail Accounts (Level 2)**: These are the active, posting accounts where transactions are recorded (e.g., `10001 Cash - Operating Account`).

### The 5-Digit Code System

ChartForge uses a smart coding convention to instantly identify an account's category:

| Code Range | Category | Description |
| :--- | :--- | :--- |
| **10000-19999** | Assets | Resources owned |
| **20000-29999** | Liabilities | Obligations owed |
| **30000-39999** | Equity | Ownership value |
| **40000-49999** | Revenue | Income generated |
| **50000-59999** | COGS | Direct costs of goods |
| **60000-79999** | Expenses | Operational costs |
| **80000-89999** | Other | Non-operational items |

## Account Attributes

Beyond the basic code and name, ChartForge stores rich metadata for each account to drive automation and reporting. These attributes are accessible via the API and visible in the account details pane:

*   **`subcategory`**: Granular classification (e.g., "Current Asset - Cash").
*   **`normal_balance`**: Defines the expected behavior (Debit vs. Credit).
*   **`cash_flow_classification`**: Maps the account to the Statement of Cash Flows (Operating, Investing, or Financing).
*   **`detailed_description`**: Internal guidance on proper usage.

## QuickBooks Online Integration

ChartForge is designed to sync seamlessly with QuickBooks Online (QBO).

### Importing to QBO

For new QBO files, we recommend importing the ChartForge Master Chart directly to ensure perfect alignment.

1.  **Export**: Download the `us_gaap_master_chart.csv` from the ChartForge settings or backend repository.
2.  **Import in QBO**: Navigate to **Settings > Chart of Accounts > Import**.
3.  **Map Fields**:
    *   Map `description` to **Account Name**.
    *   Map `code` to **Account Number**.
    *   **Crucial**: Manually map the **Type** and **Detail Type** columns during the QBO import wizard, using the ChartForge `subcategory` as a guide.

### Manual Sync

When creating accounts manually in QBO to match ChartForge:
*   Ensure the **Account Number** matches the ChartForge 5-digit code.
*   Use the ChartForge `detailed_description` to populate the QBO description field.
*   Always nest detail accounts under their respective Level 1 parent headers.

## Best Practices

### Consistency is Key
Always use the same account for similar transactions. For example, if you categorize a software subscription under `61000 Office Supplies`, continue to do so, or move it to `65000 Software Expense` and stick with that choice.

### Managing the Chart
*   **Deactivate, Don't Delete**: If an account is no longer needed but has historical transactions, use the "Deactivate" function in ChartForge. This preserves the audit trail while cleaning up the UI.
*   **Minimalism**: Avoid creating new accounts for every minor vendor. Use the Master Chart's existing categories whenever possible to keep reports readable.

## Data Export

ChartForge supports exporting your CoA configuration for external use:
*   **CSV/Excel**: Available via the "Export" button in the Accounts view.
*   **API**: Developers can fetch the full tree via `GET /api/v1/accounts`.

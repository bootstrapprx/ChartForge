# Google Sheets Setup Guide
## US-GAAP Accounting Workbook

**File:** US_GAAP_GoogleSheets_Optimized.xlsx  
**Compatible with:** Google Sheets, Microsoft Excel, LibreOffice Calc  
**Date:** November 23, 2025

---

## Quick Start: Import to Google Sheets

### Step 1: Upload the File

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **File** → **Import**
3. Click **Upload** tab
4. Drag and drop `US_GAAP_GoogleSheets_Optimized.xlsx` or click **Browse** to select it
5. In the import dialog:
   - **Import location:** Select "Create new spreadsheet"
   - **Convert text to numbers, dates, and formulas:** ✓ Check this box
6. Click **Import data**

**Done!** Your workbook is now in Google Sheets with all 11 sheets.

---

## Step 2: Verify Import

After import, verify that all sheets are present:

1. ✓ Master Chart of Accounts
2. ✓ Cost Centers
3. ✓ Account Summary
4. ✓ P&L Apurator
5. ✓ Balance Sheet
6. ✓ Trial Balance
7. ✓ Legacy Mapping
8. ✓ Cash Flow Statement
9. ✓ General Ledger
10. ✓ Journal Entry
11. ✓ Account Lookup

All formulas should work automatically in Google Sheets.

---

## Step 3: Google Sheets Enhancements (Optional)

### A. Add Data Validation for Account Selection

**For Journal Entry Sheet:**

1. Go to **Journal Entry** sheet
2. Select column A (Account Code column) - cells A8:A22
3. Click **Data** → **Data validation**
4. Set up validation:
   - **Criteria:** List from a range
   - **Range:** `'Account Lookup'!A5:A342` (all account codes)
   - **Show dropdown list in cell:** ✓ Check
   - **Show validation help text:** Optional - add "Select account code"
5. Click **Save**

Now you have a dropdown list of all account codes!

**For General Ledger Sheet:**

1. Go to **General Ledger** sheet
2. In cell A2 (where it says "[Select Account]"):
   - Add data validation
   - **Criteria:** List from a range
   - **Range:** `'Account Lookup'!A5:A342`
3. Click **Save**

---

### B. Add Conditional Formatting

**Highlight Negative Values in Red:**

1. Go to **P&L Apurator** sheet
2. Select the Amount column (D5:D150 approximately)
3. Click **Format** → **Conditional formatting**
4. Set up rule:
   - **Format cells if:** Less than
   - **Value:** 0
   - **Formatting style:** Red background or red text
5. Click **Done**

Repeat for **Balance Sheet** and **Cash Flow Statement** sheets.

**Highlight Balance Check:**

1. Go to **Balance Sheet** sheet
2. Find the "BALANCE CHECK" row (should show difference between Assets and Liabilities+Equity)
3. Select that cell
4. Add conditional formatting:
   - **Format cells if:** Equal to
   - **Value:** 0
   - **Formatting style:** Green background
5. Add another rule for the same cell:
   - **Format cells if:** Not equal to
   - **Value:** 0
   - **Formatting style:** Red background
6. Click **Done**

---

### C. Protect Formula Cells

To prevent accidental changes to formulas:

1. Select the entire sheet (click the blank square at top-left)
2. Click **Data** → **Protect sheets and ranges**
3. Click **Set permissions**
4. Choose **Restrict who can edit this range**
5. Select **Only you** or **Custom** (specify users)
6. Click **Done**

Then, unprotect input cells:

1. Select only the input cells (Amount columns, date fields, etc.)
2. Right-click → **Protect range**
3. Uncheck these cells from protection

---

### D. Add Named Ranges (Advanced)

Named ranges make formulas easier to read:

1. Go to **Account Lookup** sheet
2. Select A5:A342 (all account codes)
3. Click **Data** → **Named ranges**
4. Name it: `AccountCodes`
5. Click **Done**

Repeat for:
- `AccountNames` (column B)
- `CostCenterCodes` (Cost Centers sheet, column A)
- `CostCenterNames` (Cost Centers sheet, column B)

Now you can use these names in formulas instead of cell references!

---

### E. Enable Filters

Filters are great for searching and sorting:

1. Go to **Master Chart of Accounts** sheet
2. Click on cell A4 (the header row)
3. Click **Data** → **Create a filter**
4. Filter icons appear on each column header

Now you can:
- Filter by Category (Assets, Liabilities, etc.)
- Filter by Cost Center
- Search for specific accounts

Repeat for **Account Lookup** and **Legacy Mapping** sheets.

---

## Step 4: Sharing and Collaboration

### Share with Your Team

1. Click **Share** button (top-right)
2. Enter email addresses
3. Set permissions:
   - **Viewer:** Can view only
   - **Commenter:** Can add comments
   - **Editor:** Can edit
4. Click **Send**

### Best Practices for Collaboration

- **Use Comments:** Highlight a cell → Right-click → **Comment** to ask questions
- **Version History:** File → Version history → See version history (track all changes)
- **Protect Important Sheets:** Protect Master Chart and Account Lookup as "View only"
- **Use Separate Sheets:** Create monthly copies (e.g., "P&L Nov 2025") for each period

---

## Step 5: Google Sheets Add-ons (Optional)

### Recommended Add-ons

**1. Supermetrics** (for importing data from accounting systems)
- Go to **Extensions** → **Add-ons** → **Get add-ons**
- Search for "Supermetrics"
- Install and connect to your accounting software

**2. Power Tools** (for advanced data manipulation)
- Search for "Power Tools" in Add-ons
- Useful for bulk operations, data cleaning

**3. Yet Another Mail Merge** (for automated reporting)
- Send monthly reports automatically via email
- Search for "Yet Another Mail Merge"

**4. Remove Duplicates** (for data cleaning)
- Useful when importing legacy data
- Search for "Remove Duplicates"

---

## Google Sheets Features Already Working

### ✓ All Formulas
All Excel formulas are compatible with Google Sheets:
- SUM, IF, and basic arithmetic
- Cell references and ranges
- Percentage calculations

### ✓ Formatting
All formatting transfers:
- Colors and fonts
- Borders and alignment
- Number formats (#,##0.00)
- Conditional formatting (if added)

### ✓ Multiple Sheets
All 11 sheets are preserved with navigation tabs at the bottom

### ✓ Auto-calculations
All formulas recalculate automatically when you enter data

---

## Google Sheets-Specific Tips

### 1. Use QUERY Function (Advanced)

Create dynamic reports with QUERY:

```
=QUERY('Master Chart'!A4:I342, "SELECT A, B, D WHERE C = 'Asset' ORDER BY A")
```

This selects all Asset accounts and sorts by code.

### 2. Use IMPORTRANGE (Multi-file)

Link data from other spreadsheets:

```
=IMPORTRANGE("spreadsheet_url", "Sheet1!A1:B10")
```

Useful for consolidating data from multiple companies.

### 3. Use ARRAYFORMULA (Bulk Operations)

Apply formulas to entire columns:

```
=ARRAYFORMULA(IF(D5:D100<0, "Negative", "Positive"))
```

### 4. Use VLOOKUP for Account Names

Auto-fill account names from codes:

```
=VLOOKUP(A8, 'Account Lookup'!A:B, 2, FALSE)
```

Add this in Journal Entry sheet column B to auto-fill account names when you enter codes.

---

## Mobile Access

### Google Sheets Mobile App

1. Download **Google Sheets** app (iOS/Android)
2. Sign in with your Google account
3. Open the workbook
4. View and edit on the go

**Features:**
- View all sheets
- Enter data
- View formulas (tap on cell)
- Add comments
- Share with team

---

## Offline Access

### Enable Offline Mode

1. Go to [Google Drive](https://drive.google.com)
2. Click ⚙️ (Settings) → **Settings**
3. Check **Offline**
4. Install Google Docs Offline extension (if prompted)

Now you can:
- View and edit without internet
- Changes sync automatically when online

---

## Troubleshooting

### Issue: Formulas Not Calculating

**Solution:**
1. Check that "Convert text to numbers" was enabled during import
2. Click on a formula cell
3. Press Enter to recalculate
4. Or: File → Spreadsheet settings → Calculation → "On change and every minute"

### Issue: Formatting Looks Different

**Solution:**
- Google Sheets uses Arial font by default (Excel uses Calibri)
- Colors may appear slightly different
- This is normal and doesn't affect functionality

### Issue: Large File Slow to Load

**Solution:**
1. Reduce the number of conditional formatting rules
2. Limit the range of formulas (don't apply to entire columns)
3. Consider splitting into multiple files (one per month)

### Issue: Can't Find a Sheet

**Solution:**
- Scroll through sheet tabs at the bottom
- Click ≡ (menu icon) next to sheet tabs → "All sheets"
- Sheets may be hidden - right-click on tabs → "Unhide"

---

## Advanced: Google Apps Script

### Automate Tasks with Scripts

**Example: Auto-fill Date on Journal Entry**

1. Go to **Extensions** → **Apps Script**
2. Paste this code:

```javascript
function onEdit(e) {
  var sheet = e.source.getActiveSheet();
  
  if (sheet.getName() == "Journal Entry") {
    var range = e.range;
    if (range.getColumn() == 4 && range.getRow() >= 8) { // Column D (Amount)
      var dateCell = sheet.getRange("E3"); // Date field
      if (dateCell.getValue() == "" || dateCell.getValue() == "[Enter Date]") {
        dateCell.setValue(new Date());
      }
    }
  }
}
```

3. Click **Save**
4. Close Apps Script

Now, when you enter an amount in Journal Entry, the date auto-fills!

**Example: Monthly Backup**

```javascript
function createMonthlyBackup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var name = ss.getName();
  var date = Utilities.formatDate(new Date(), "GMT", "yyyy-MM");
  
  var copy = ss.copy(name + " - Backup " + date);
  Logger.log("Backup created: " + copy.getUrl());
}
```

Set this to run automatically:
1. Click ⏰ (Triggers) in Apps Script
2. Add trigger → createMonthlyBackup → Time-driven → Month timer
3. Save

---

## Integration with Other Tools

### QuickBooks Online

Use **Supermetrics** or **Coupler.io** add-ons to import data directly from QuickBooks.

### Xero

Use **Xero Sheets** add-on to sync data.

### Excel

You can always download as Excel:
- File → Download → Microsoft Excel (.xlsx)

### PDF

Export reports as PDF:
- File → Download → PDF
- Select specific sheets or entire workbook

---

## Best Practices

### 1. Create Monthly Copies

Don't overwrite data each month:
- File → Make a copy
- Rename: "US-GAAP Accounting - Nov 2025"
- Keep original as template

### 2. Use Version History

Track all changes:
- File → Version history → See version history
- Name versions: Click ⋮ → "Name current version"
- Restore old versions if needed

### 3. Set Up Notifications

Get notified of changes:
- Tools → Notification rules
- Choose: "Any changes are made" or "A user submits a form"
- Select email frequency

### 4. Organize in Folders

In Google Drive:
- Create folder: "Accounting - 2025"
- Move monthly copies there
- Share entire folder with team

---

## Support Resources

### Google Sheets Help

- [Google Sheets Help Center](https://support.google.com/docs/answer/6000292)
- [Function List](https://support.google.com/docs/table/25273)
- [Keyboard Shortcuts](https://support.google.com/docs/answer/181110)

### Video Tutorials

- Search YouTube: "Google Sheets accounting"
- Google Workspace Learning Center

### Community

- [Google Sheets Community](https://support.google.com/docs/community)
- Stack Overflow (tag: google-sheets)

---

## Summary Checklist

After importing to Google Sheets:

- [ ] Verify all 11 sheets imported correctly
- [ ] Test formulas (enter test data in P&L)
- [ ] Add data validation to Journal Entry
- [ ] Add conditional formatting for negative values
- [ ] Enable filters on Master Chart and Account Lookup
- [ ] Share with team members
- [ ] Set up monthly backup schedule
- [ ] Protect formula cells (optional)
- [ ] Add named ranges (optional)
- [ ] Install recommended add-ons (optional)

---

## Quick Reference: Google Sheets vs Excel

| Feature | Excel | Google Sheets |
|---------|-------|---------------|
| Formulas | Same syntax | Same syntax |
| Conditional Formatting | ✓ | ✓ |
| Data Validation | ✓ | ✓ |
| Pivot Tables | ✓ | ✓ |
| Charts | ✓ | ✓ |
| Macros | VBA | Apps Script |
| Offline | ✓ | ✓ (with setup) |
| Collaboration | Limited | Real-time |
| Version History | Limited | Full history |
| Mobile App | ✓ | ✓ |
| Cloud Storage | OneDrive | Google Drive |

---

## Conclusion

Your US-GAAP Accounting Workbook is fully compatible with Google Sheets. All formulas, formatting, and functionality transfer seamlessly.

**Advantages of Google Sheets:**
- Real-time collaboration
- Automatic saving
- Access from anywhere
- Version history
- Free (with Google account)
- Mobile access
- Integration with Google Workspace

**Next Steps:**
1. Import the file
2. Test with sample data
3. Share with your team
4. Set up monthly workflow

---

**Questions?** Refer to the WORKBOOK_GUIDE.md for detailed instructions on using each sheet.

**File Version:** 1.0  
**Last Updated:** November 23, 2025  
**Compatible with:** Google Sheets, Excel 2007+, LibreOffice Calc

---

**END OF GOOGLE SHEETS SETUP GUIDE**

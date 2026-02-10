import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

const DocumentationPage = () => {
  return (
    <div className="container mx-auto p-6 max-w-5xl h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-bold tracking-tight">Documentation</h1>
        <p className="text-muted-foreground">
          Comprehensive guide to the ChartForge system and Chart of Accounts.
        </p>
      </div>

      <ScrollArea className="flex-grow">
        <div className="space-y-8 pb-10">
          {/* Overview Section */}
          <section id="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Chart of Accounts Overview</CardTitle>
                <CardDescription>The backbone of the ChartForge financial system.</CardDescription>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <p>
                  The Chart of Accounts (CoA) is the structured repository for all financial data, enabling accurate reporting, tax compliance, and strategic decision-making.
                </p>
                <p>
                  ChartForge implements a <strong>US-GAAP compliant Master Chart</strong> by default, designed to support a wide range of business activities while maintaining a clean, hierarchical structure. This system ensures that every transaction—from revenue generation to operational expenses—is recorded consistently.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Implementation Section */}
          <section id="implementation" className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">How ChartForge Implements the Master Chart</h2>
            <Card>
              <CardContent className="pt-6 prose dark:prose-invert max-w-none">
                <p>
                  ChartForge utilizes a standardized, 5-digit coding system to organize accounts. This structure is built into the core of the application, ensuring logical grouping and easy navigation.
                </p>

                <h3>Account Types</h3>
                <p>Every account in ChartForge belongs to one of five fundamental types, aligning with standard accounting principles:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Assets (1xxxx)</strong>: Resources owned by the company (e.g., Cash, Equipment).</li>
                  <li><strong>Liabilities (2xxxx)</strong>: Financial obligations owed to others (e.g., Accounts Payable, Loans).</li>
                  <li><strong>Equity (3xxxx)</strong>: The owner's residual interest in the company (e.g., Retained Earnings).</li>
                  <li><strong>Revenue (4xxxx)</strong>: Income generated from business operations (e.g., Sales).</li>
                  <li><strong>Expenses (6xxxx - 7xxxx)</strong>: Costs incurred to operate the business (e.g., Rent, Salaries).</li>
                </ul>

                <h3 className="mt-6">Hierarchical Structure</h3>
                <p>The system enforces a strict parent-child hierarchy to maintain organization:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Category Headers (Level 1)</strong>: These are non-posting container accounts (e.g., <code>10000 ASSET</code>) used solely for grouping and reporting subtotals.</li>
                  <li><strong>Detail Accounts (Level 2)</strong>: These are the active, posting accounts where transactions are recorded (e.g., <code>10001 Cash - Operating Account</code>).</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Coding System Section */}
          <section id="coding-system" className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">The 5-Digit Code System</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Code Range</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Category</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 font-mono">10000-19999</td>
                        <td className="p-4">Assets</td>
                        <td className="p-4">Resources owned</td>
                      </tr>
                      <tr className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 font-mono">20000-29999</td>
                        <td className="p-4">Liabilities</td>
                        <td className="p-4">Obligations owed</td>
                      </tr>
                      <tr className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 font-mono">30000-39999</td>
                        <td className="p-4">Equity</td>
                        <td className="p-4">Ownership value</td>
                      </tr>
                      <tr className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 font-mono">40000-49999</td>
                        <td className="p-4">Revenue</td>
                        <td className="p-4">Income generated</td>
                      </tr>
                      <tr className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 font-mono">50000-59999</td>
                        <td className="p-4">COGS</td>
                        <td className="p-4">Direct costs of goods</td>
                      </tr>
                      <tr className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 font-mono">60000-79999</td>
                        <td className="p-4">Expenses</td>
                        <td className="p-4">Operational costs</td>
                      </tr>
                      <tr className="transition-colors hover:bg-muted/50">
                        <td className="p-4 font-mono">80000-89999</td>
                        <td className="p-4">Other</td>
                        <td className="p-4">Non-operational items</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Attributes Section */}
          <section id="attributes" className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">Account Attributes</h2>
            <Card>
              <CardContent className="pt-6 prose dark:prose-invert max-w-none">
                <p>
                  Beyond the basic code and name, ChartForge stores rich metadata for each account to drive automation and reporting. These attributes are accessible via the API and visible in the account details pane:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong><code>subcategory</code></strong>: Granular classification (e.g., "Current Asset - Cash").</li>
                  <li><strong><code>normal_balance</code></strong>: Defines the expected behavior (Debit vs. Credit).</li>
                  <li><strong><code>cash_flow_classification</code></strong>: Maps the account to the Statement of Cash Flows (Operating, Investing, or Financing).</li>
                  <li><strong><code>detailed_description</code></strong>: Internal guidance on proper usage.</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* QBO Integration Section */}
          <section id="qbo-integration" className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">QuickBooks Online Integration</h2>
            <Card>
              <CardContent className="pt-6 prose dark:prose-invert max-w-none">
                <p>ChartForge is designed to sync seamlessly with QuickBooks Online (QBO).</p>

                <h3>Importing to QBO</h3>
                <p>For new QBO files, we recommend importing the ChartForge Master Chart directly to ensure perfect alignment.</p>
                <ol className="list-decimal pl-6 space-y-1">
                  <li><strong>Export</strong>: Download the <code>us_gaap_master_chart.csv</code> from the ChartForge settings or backend repository.</li>
                  <li><strong>Import in QBO</strong>: Navigate to <strong>Settings &gt; Chart of Accounts &gt; Import</strong>.</li>
                  <li>
                    <strong>Map Fields</strong>:
                    <ul className="list-disc pl-6 mt-1">
                      <li>Map <code>description</code> to <strong>Account Name</strong>.</li>
                      <li>Map <code>code</code> to <strong>Account Number</strong>.</li>
                      <li><strong>Crucial</strong>: Manually map the <strong>Type</strong> and <strong>Detail Type</strong> columns during the QBO import wizard, using the ChartForge <code>subcategory</code> as a guide.</li>
                    </ul>
                  </li>
                </ol>

                <h3 className="mt-6">Manual Sync</h3>
                <p>When creating accounts manually in QBO to match ChartForge:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Ensure the <strong>Account Number</strong> matches the ChartForge 5-digit code.</li>
                  <li>Use the ChartForge <code>detailed_description</code> to populate the QBO description field.</li>
                  <li>Always nest detail accounts under their respective Level 1 parent headers.</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Best Practices Section */}
          <section id="best-practices" className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">Best Practices</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Consistency is Key</CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert">
                  <p>
                    Always use the same account for similar transactions. For example, if you categorize a software subscription under <code>61000 Office Supplies</code>, continue to do so, or move it to <code>65000 Software Expense</code> and stick with that choice.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Managing the Chart</CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert">
                  <ul className="list-disc pl-4 space-y-2">
                    <li>
                      <strong>Deactivate, Don't Delete</strong>: If an account is no longer needed but has historical transactions, use the "Deactivate" function in ChartForge. This preserves the audit trail while cleaning up the UI.
                    </li>
                    <li>
                      <strong>Minimalism</strong>: Avoid creating new accounts for every minor vendor. Use the Master Chart's existing categories whenever possible to keep reports readable.
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

           {/* Data Export Section */}
           <section id="data-export" className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">Data Export</h2>
            <Card>
              <CardContent className="pt-6 prose dark:prose-invert max-w-none">
                <p>ChartForge supports exporting your CoA configuration for external use:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>CSV/Excel</strong>: Available via the "Export" button in the Accounts view.</li>
                  <li><strong>API</strong>: Developers can fetch the full tree via <code>GET /api/v1/accounts</code>.</li>
                </ul>
              </CardContent>
            </Card>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
};

export default DocumentationPage;

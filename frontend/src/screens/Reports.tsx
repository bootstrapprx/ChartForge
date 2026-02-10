import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Plus, Filter } from "lucide-react";

const Reports = () => {
  const reportTypes = [
    {
      title: "Coverage Report",
      description: "Account mapping coverage across companies",
      icon: "📊"
    },
    {
      title: "Variance Analysis",
      description: "Compare actual vs. budgeted figures",
      icon: "📈"
    },
    {
      title: "Audit Trail",
      description: "Complete history of changes and updates",
      icon: "📋"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financial Reports</h1>
          <p className="text-muted-foreground mt-1">Generate and analyze financial reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reportTypes.map((report, index) => (
          <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="text-4xl mb-2">{report.icon}</div>
              <CardTitle className="text-base">{report.title}</CardTitle>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Generate
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>Generate and view various financial reports here.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <BarChart3 className="h-20 w-20 mb-4 opacity-50" />
            <p className="text-lg font-medium">No reports generated yet</p>
            <p className="text-sm">Create your first report to get insights</p>
            <Button className="mt-4" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
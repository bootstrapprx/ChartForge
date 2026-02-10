import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Activity, Users, Database } from "lucide-react";

const Dashboard = () => {
  const stats = [
    {
      title: "Total Companies",
      value: "12",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Active Mappings",
      value: "1,847",
      icon: Database,
      color: "text-green-600"
    },
    {
      title: "Sync Status",
      value: "Active",
      icon: Activity,
      color: "text-purple-600"
    },
    {
      title: "Growth",
      value: "+23%",
      icon: TrendingUp,
      color: "text-orange-600"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening with your accounts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Overview</CardTitle>
          <CardDescription>Key metrics and quick access features will be displayed here.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <p>Dashboard visualizations coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
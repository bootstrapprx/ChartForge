import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Network, ArrowRight, Database, BarChart3, Building2 } from "lucide-react";

const Index = () => {
  const features = [
    {
      icon: Database,
      title: "Master Chart",
      description: "Unified chart of accounts"
    },
    {
      icon: Building2,
      title: "Companies",
      description: "Manage all entities"
    },
    {
      icon: BarChart3,
      title: "Reports",
      description: "Financial insights"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="flex justify-center mb-6">
            <Network className="h-16 w-16 text-primary" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-foreground">
            Welcome to ForgeChart
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your comprehensive solution for managing and unifying chart of accounts across multiple entities
          </p>

          <div className="flex justify-center gap-4 pt-4">
            <Link to="/dashboard">
              <Button size="lg">
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/landing">
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <feature.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-12 bg-muted/50">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <Database className="h-10 w-10 mx-auto text-primary mb-2" />
                <p className="font-medium">Application main content will be shown here.</p>
                <p className="text-sm text-muted-foreground">
                  Navigate to different sections using the menu above
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
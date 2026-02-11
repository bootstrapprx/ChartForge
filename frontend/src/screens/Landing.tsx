import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  Network, 
  TrendingUp, 
  Zap, 
  Shield, 
  FileSpreadsheet, 
  BarChart3,
  ArrowRight
} from "lucide-react";

const Landing = () => {
  const features = [
    {
      icon: Network,
      title: "Unified Master Chart",
      description: "Build and maintain a centralized Master Chart of Accounts across all your companies"
    },
    {
      icon: Zap,
      title: "AI-Powered Mapping",
      description: "Intelligent semantic mapping with fuzzy logic to automatically align local accounts"
    },
    {
      icon: FileSpreadsheet,
      title: "QuickBooks Integration",
      description: "Seamless sync with QuickBooks Online via OAuth 2.0 for real-time updates"
    },
    {
      icon: BarChart3,
      title: "Coverage Reports",
      description: "Visual analytics and heatmaps showing mapping coverage and data quality"
    },
    {
      icon: Shield,
      title: "Version Control",
      description: "Complete audit trail with rollback capabilities for every Chart of Accounts"
    },
    {
      icon: TrendingUp,
      title: "Financial Statements",
      description: "Generate unified Balance Sheets, P&L, and Cash Flow reports from mapped data"
    }
  ];


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img src="/logo.svg" alt="ChartForge Logo" className="h-10" />
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/dashboard">
                <Button variant="default">
                  Launch Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight">
            Unified
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {" "}Chart of Accounts
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Centralize and map your company's financial structures. AI-assisted mapping with QuickBooks integration.
          </p>

          <div className="flex justify-center pt-4">
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-8">
                Open Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Features
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tools for managing multiple company chart of accounts
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border bg-card">
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <img src="/logo.svg" alt="ChartForge Logo" className="h-8" />
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 ChartForge. Unified Chart of Accounts Management.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

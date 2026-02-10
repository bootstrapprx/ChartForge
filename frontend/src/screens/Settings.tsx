import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, User, Bell, Shield, Database } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import Sidebar from "@/components/dashboard/Sidebar";

const SettingsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const settingsSections = [
    {
      icon: User,
      title: "Profile Settings",
      description: "Manage your account information and preferences"
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Configure email and in-app notifications"
    },
    {
      icon: Shield,
      title: "Security",
      description: "Password, 2FA, and security options"
    },
    {
      icon: Database,
      title: "Data Management",
      description: "Import, export, and backup settings"
    }
  ];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Application Settings</h1>
              <p className="text-muted-foreground mt-1">Manage your preferences and configuration</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Theme:</span>
              <ThemeToggle />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {settingsSections.map((section, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <section.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{section.title}</CardTitle>
                      <CardDescription className="text-sm">{section.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Configure
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Settings</CardTitle>
              <CardDescription>Configure application settings and preferences here.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <SettingsIcon className="h-20 w-20 mb-4 opacity-50" />
                <p className="text-lg font-medium">Settings configuration coming soon</p>
                <p className="text-sm">Advanced settings will be available here</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
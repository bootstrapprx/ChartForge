// frontend/src/components/dashboard/Sidebar.tsx
import React, { useState } from 'react';
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Network,
  Building2,
  FileSpreadsheet,
  GitBranch,
  BarChart3,
  Settings,
  Upload,
  ChevronLeft,
  ChevronRight,
  Users,
  Database,
  Wand2,
  History,
  GitMerge,
  Share2,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useManualMode } from "@/contexts/ManualModeContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import DexterChat from '@/components/ai/DexterChat';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();
  const { isManualMode, toggleManualMode } = useManualMode();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onToggle = () => setIsOpen(!isOpen);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const primaryLinks = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Building2, label: "Companies", path: "/companies" },
  ];

  const navSections = [
    {
      title: "Master Chart",
      icon: Database,
      basePath: "/masterchart",
      links: [
        { label: "Dashboard", path: "/masterchart" },
        { label: "Interactive Editor", path: "/masterchart/interactive" },
        { label: "Tree View", path: "/masterchart/tree" },
        { label: "Import", path: "/masterchart/import", integration: true },
        { label: "Export", path: "/masterchart/export", integration: true },
      ],
    },
    {
      title: "Organizer AI",
      icon: Wand2,
      basePath: "/organizer",
      links: [
        { label: "Classify", path: "/organizer" },
        { label: "Review", path: "/organizer/review" },
      ],
    },
    {
      title: "Sync",
      icon: Share2,
      basePath: "/sync",
      links: [
        { label: "QuickBooks", path: "/sync/quickbooks" },
      ]
    },
    {
      title: "Advanced",
      icon: Settings,
      basePath: "",
      links: [
        { label: "Snapshots", path: "/snapshots" },
        { label: "Mappings", path: "/mappings" },
        { label: "Templates", path: "/templates" },
        { label: "Reports", path: "/reports" },
        { label: "Upload", path: "/upload" },
        { label: "Team", path: "/team" },
        { label: "Settings", path: "/settings" },
        { label: "Documentation", path: "/docs" },
      ]
    },
    {
      title: "Administration",
      icon: Users,
      basePath: "",
      links: [
        { label: "Users", path: "/users" },
        { label: "Permissions", path: "/permissions" },
      ]
    }
  ].map(section => ({
    ...section,
    links: (section.links || []).filter(link => !link.integration || !isManualMode)
  }));

  return (
    <>
      <div
        className={cn(
          "relative h-screen bg-background border-r transition-all duration-300 flex flex-col",
          isOpen ? "w-64" : "w-20"
        )}
      >
        <div className="h-16 border-b flex items-center justify-between px-4 flex-shrink-0">
          <Link to="/" className="flex items-center space-x-2 overflow-hidden">
            <Network className="h-6 w-6 text-primary flex-shrink-0" />
            {isOpen && <span className="font-bold whitespace-nowrap">ChartForge</span>}
          </Link>
        </div>

        <nav className="flex-grow p-2 space-y-1 overflow-y-auto">
          {primaryLinks.map((item) => (
            <Link to={item.path} key={item.path} title={item.label} className={cn(
              "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors",
              location.pathname === item.path ? "bg-muted text-primary" : "hover:bg-muted/50"
            )}>
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {isOpen && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          ))}

          <Accordion type="multiple" className="w-full">
            {navSections.map(section => (
              <AccordionItem value={section.title} key={section.title} className="border-b-0">
                <AccordionTrigger className={cn("px-3 py-2.5 rounded-lg hover:no-underline hover:bg-muted/50", { "bg-muted": location.pathname.startsWith(section.basePath) && section.basePath })}>
                  <div className="flex items-center space-x-3">
                    <section.icon className="h-5 w-5 flex-shrink-0" />
                    {isOpen && <span className="text-sm font-medium">{section.title}</span>}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pl-6 pr-2 py-1 space-y-1">
                  {section.links.map(link => (
                    <Link to={link.path} key={link.path} title={link.label} className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-sm",
                      location.pathname === link.path ? "bg-muted text-primary" : "hover:bg-muted/50"
                    )}>
                      {isOpen && <span>{link.label}</span>}
                    </Link>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </nav>

        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-16 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-muted"
          onClick={onToggle}
        >
          {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>

        <div className="p-2 border-t mt-auto flex-shrink-0 space-y-2">
          {isOpen && (
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Label htmlFor="manual-mode">Manual Mode</Label>
              <Switch
                id="manual-mode"
                checked={isManualMode}
                onCheckedChange={toggleManualMode}
              />
            </div>
          )}
          <div className="flex items-center justify-center gap-2">
            <ThemeToggle />
          </div>
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start">
                  <User className="h-4 w-4 mr-2" />
                  {isOpen && (
                    <span className="text-sm truncate">{user.email}</span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      <DexterChat />
    </>
  );
};


export default Sidebar;
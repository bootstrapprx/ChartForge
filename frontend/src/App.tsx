import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Layouts
import DashboardLayout from "./components/dashboard/DashboardLayout";

// General Pages
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";

// Feature Pages
import Companies from "./pages/Companies";
import CompanyRegistration from "./pages/companies/CompanyRegistration";
import Mappings from "./pages/Mappings";
import Reports from "./pages/Reports";
import UploadPage from "./pages/Upload";
import Team from "./pages/Team";
import SettingsPage from "./pages/SettingsPage";
import TemplatesPage from "./pages/Templates";

// New Master Chart Pages
import MasterChartPage from "./pages/masterchart/MasterChartPage";
import MasterChartDashboard from "./pages/masterchart/MasterChartDashboard";
import MasterChartTreePage from "./pages/masterchart/MasterChartTreePage";
import MasterChartInteractivePage from "./pages/masterchart/MasterChartInteractivePage";
import MasterChartImportPage from "./components/integrations/masterchart/MasterChartImportPage";
import MasterChartExportPage from "./components/integrations/masterchart/MasterChartExportPage";

// New Template and Import Engine Pages
import DefaultTemplatePage from "./pages/template/DefaultTemplatePage";
import ImportEnginePage from "./pages/import/ImportEnginePage";

// New Organizer Pages
import OrganizerPage from "./pages/organizer/OrganizerPage";
import OrganizerReviewPage from "./pages/organizer/OrganizerReviewPage";

// New Snapshots Page
import SnapshotsPage from "./pages/snapshots/SnapshotsPage";

// New Sync Page
import QuickBooksSyncPage from "./pages/sync/QuickBooksSyncPage";

// Documentation
import DocumentationPage from "./pages/DocumentationPage";

// Auth Pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

// User Management Pages
import UsersPage from "./pages/users/UsersPage";
import PermissionsPage from "./pages/permissions/PermissionsPage";




const App = () => (
  <ErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              
              {/* Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected Dashboard Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="companies" element={<Companies />} />
              <Route path="companies/register" element={<CompanyRegistration />} />
              <Route path="mappings" element={<Mappings />} />
              <Route path="reports" element={<Reports />} />
              <Route path="upload" element={<UploadPage />} />
              <Route path="team" element={<Team />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="templates" element={<TemplatesPage />} />

              {/* Master Chart */}
              <Route path="masterchart" element={<MasterChartDashboard />} />
              <Route path="masterchart/legacy" element={<MasterChartPage />} />
              <Route path="masterchart/tree" element={<MasterChartTreePage />} />
              <Route path="masterchart/interactive" element={<MasterChartInteractivePage />} />
              <Route path="masterchart/import" element={<MasterChartImportPage />} />
              <Route path="masterchart/export" element={<MasterChartExportPage />} />

              {/* Default Template */}
              <Route path="master-template" element={<DefaultTemplatePage />} />

              {/* Import Engine */}
              <Route path="import" element={<ImportEnginePage />} />

              {/* Organizer */}
              <Route path="organizer" element={<OrganizerPage />} />
              <Route path="organizer/review" element={<OrganizerReviewPage />} />

              {/* Snapshots */}
              <Route path="snapshots" element={<SnapshotsPage />} />

              {/* Sync */}
              <Route path="sync/quickbooks" element={<QuickBooksSyncPage />} />

              {/* Documentation */}
              <Route path="docs" element={<DocumentationPage />} />

              {/* User Management */}
              <Route path="users" element={<UsersPage />} />
              <Route path="permissions" element={<PermissionsPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
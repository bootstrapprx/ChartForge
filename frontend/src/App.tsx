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
import Landing from "./screens/Landing";
import NotFound from "./screens/NotFound";
import Dashboard from "./screens/Dashboard";

// Feature Pages
import Companies from "./screens/Companies";
import CompanyRegistration from "./screens/companies/CompanyRegistration";
import Mappings from "./screens/Mappings";
import Reports from "./screens/Reports";
import UploadPage from "./screens/Upload";
import Team from "./screens/Team";
import SettingsPage from "./screens/SettingsPage";
import TemplatesPage from "./screens/Templates";

// New Master Chart Pages
import MasterChartPage from "./screens/masterchart/MasterChartPage";
import MasterChartDashboard from "./screens/masterchart/MasterChartDashboard";
import MasterChartTreePage from "./screens/masterchart/MasterChartTreePage";
import MasterChartInteractivePage from "./screens/masterchart/MasterChartInteractivePage";
import MasterChartImportPage from "./components/integrations/masterchart/MasterChartImportPage";
import MasterChartExportPage from "./components/integrations/masterchart/MasterChartExportPage";

// New Template and Import Engine Pages
import DefaultTemplatePage from "./screens/template/DefaultTemplatePage";
import ImportEnginePage from "./screens/import/ImportEnginePage";

// New Organizer Pages
import OrganizerPage from "./screens/organizer/OrganizerPage";
import OrganizerReviewPage from "./screens/organizer/OrganizerReviewPage";

// New Snapshots Page
import SnapshotsPage from "./screens/snapshots/SnapshotsPage";

// New Sync Page
import QuickBooksSyncPage from "./screens/sync/QuickBooksSyncPage";

// Documentation
import DocumentationPage from "./screens/DocumentationPage";

// Auth Pages
import LoginPage from "./screens/auth/LoginPage";
import RegisterPage from "./screens/auth/RegisterPage";

// User Management Pages
import UsersPage from "./screens/users/UsersPage";
import PermissionsPage from "./screens/permissions/PermissionsPage";




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

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, RefreshCw, List, LayoutGrid, Grid } from 'lucide-react';
import { useManualCRUD } from '@/hooks/useManualCRUD';
import { useManualMode } from '@/contexts/ManualModeContext';
import { Company, CompanyCreate, CompanyUpdate } from '@/types/company';
import { QueryKey } from '@/lib/queryKeys';
import CompaniesList from '@/components/manual/companies/CompaniesList';
import CompanyDetails from '@/components/manual/companies/CompanyDetails';
import EditCompanyModal from '@/components/manual/companies/EditCompanyModal';
import InactivateCompanyModal from '@/components/manual/companies/InactivateCompanyModal';
import DeleteCompanyModal from '@/components/manual/companies/DeleteCompanyModal';
import CompanyMergePreview from '@/components/integrations/companies/CompanyMergePreview';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from '@/lib/api';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

const CompaniesPage: React.FC = () => {
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [viewingCompany, setViewingCompany] = useState<Company | null>(null);
  const [inactivatingCompany, setInactivatingCompany] = useState<Company | null>(null);
  const [activatingCompany, setActivatingCompany] = useState<Company | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'card' | 'grid'>('list');

  const { isManualMode } = useManualMode();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [QueryKey.COMPANIES],
    queryFn: async () => {
      const response = await api.get('/companies');
      return response.data as { active: Company[], inactive: Company[], stats: any };
    },
  });

  const activeCompanies = data?.active || [];
  const inactiveCompanies = data?.inactive || [];

  const handleUpdate = async (data: CompanyUpdate) => {
    if (!editingCompany) return;

    // Sanitize data
    const sanitizedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, value === "" ? null : value])
    ) as CompanyUpdate;

    try {
      await api.put(`/companies/${editingCompany.id}`, sanitizedData);
      queryClient.invalidateQueries({ queryKey: [QueryKey.COMPANIES] });
      toast.success("Company updated successfully");
      setEditingCompany(null);
    } catch (error) {
      console.error("Failed to update company:", error);
      toast.error("Failed to update company");
    }
  };

  const handleInactivate = async (ucid: string, confirmation: string) => {
    try {
      await api.patch(`/companies/${ucid}/inactivate`, { confirmation });
      queryClient.invalidateQueries({ queryKey: [QueryKey.COMPANIES] });
      toast.success("Company inactivated successfully");
      setInactivatingCompany(null);
    } catch (error: any) {
      console.error("Failed to inactivate company:", error);
      toast.error(error.response?.data?.detail || "Failed to inactivate company");
      throw error; // Re-throw to let modal handle loading state if needed
    }
  };

  const handleActivate = async (ucid: string, confirmation: string) => {
    try {
      await api.patch(`/companies/${ucid}/activate`, { confirmation });
      queryClient.invalidateQueries({ queryKey: [QueryKey.COMPANIES] });
      toast.success("Company activated successfully");
      setActivatingCompany(null);
    } catch (error: any) {
      console.error("Failed to activate company:", error);
      toast.error(error.response?.data?.detail || "Failed to activate company");
      throw error;
    }
  };

  const handleDelete = async (id: string, confirmation: string) => {
    try {
      await api.delete(`/companies/${id}`);
      queryClient.invalidateQueries({ queryKey: [QueryKey.COMPANIES] });
      toast.success("Company permanently deleted");
      setDeletingCompany(null);
    } catch (error: any) {
      console.error("Failed to delete company:", error);
      toast.error(error.response?.data?.detail || "Failed to delete company");
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Companies</h1>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            title="Sync Data"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button asChild>
            <Link href="/companies/register">
              <Plus className="mr-2 h-4 w-4" />
              Register Company
            </Link>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Tabs defaultValue="active" className="w-full max-w-md">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">Active ({activeCompanies.length})</TabsTrigger>
              <TabsTrigger value="inactive">Inactive ({inactiveCompanies.length})</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center space-x-2 bg-muted p-1 rounded-md">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'card' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('card')}
              title="Card View"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsContent value="active" className="mt-0">
            <CompaniesList
              companies={activeCompanies}
              viewMode={viewMode}
              onEdit={setEditingCompany}
              onView={setViewingCompany}
              onInactivate={setInactivatingCompany}
              onActivate={setActivatingCompany}
              onDelete={setDeletingCompany}
              isLoading={isLoading}
              isError={isError}
              title="Active Companies"
            />
          </TabsContent>
          <TabsContent value="inactive" className="mt-0">
            <CompaniesList
              companies={inactiveCompanies}
              viewMode={viewMode}
              onEdit={() => { }} // Cannot edit inactive
              onView={setViewingCompany}
              onInactivate={() => { }} // Cannot inactivate inactive
              onActivate={setActivatingCompany}
              onDelete={setDeletingCompany}
              isLoading={isLoading}
              isError={isError}
              title="Inactive Companies"
            />
          </TabsContent>
        </Tabs>
      </div>

      <EditCompanyModal
        company={editingCompany}
        open={!!editingCompany}
        onOpenChange={(open) => !open && setEditingCompany(null)}
        onSubmit={handleUpdate}
      />

      <InactivateCompanyModal
        company={inactivatingCompany}
        open={!!inactivatingCompany}
        onOpenChange={(open) => !open && setInactivatingCompany(null)}
        onConfirm={handleInactivate}
      />

      <InactivateCompanyModal
        company={activatingCompany}
        open={!!activatingCompany}
        onOpenChange={(open) => !open && setActivatingCompany(null)}
        onConfirm={handleActivate}
        isActivating={true}
      />

      <DeleteCompanyModal
        company={deletingCompany}
        open={!!deletingCompany}
        onOpenChange={(open) => !open && setDeletingCompany(null)}
        onConfirm={handleDelete}
      />

      <CompanyDetails
        company={viewingCompany}
        open={!!viewingCompany}
        onOpenChange={(open) => !open && setViewingCompany(null)}
      />

      {!isManualMode && (
        <CompanyMergePreview companies={activeCompanies} />
      )}
    </div>
  );
};

export default CompaniesPage;

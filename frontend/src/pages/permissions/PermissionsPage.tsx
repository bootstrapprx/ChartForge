import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/integrations/api';
import { UserCompany, UserCompanyCreate, UserCompanyUpdate } from '@/types/user';
import { User } from '@/types/user';
import { Company } from '@/types/company';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Loader2 } from 'lucide-react';
import PermissionForm from '@/components/permissions/PermissionForm';
import PermissionsList from '@/components/permissions/PermissionsList';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PermissionsPage: React.FC = () => {
  const [selectedPermission, setSelectedPermission] = useState<UserCompany | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isSuperuser = currentUser?.is_superuser || false;

  // Fetch companies
  const { data: companies } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      const response = await api.get('/companies/');
      return response.data;
    },
  });

  // Fetch users
  const { data: users } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users/');
      return response.data;
    },
    enabled: isSuperuser,
  });

  // Fetch permissions for selected company
  const { data: permissions, isLoading, isError } = useQuery<UserCompany[]>({
    queryKey: ['permissions', selectedCompanyId],
    queryFn: async () => {
      const response = await api.get(`/permissions/company/${selectedCompanyId}`);
      return response.data;
    },
    enabled: !!selectedCompanyId,
  });

  const createMutation = useMutation({
    mutationFn: async (permissionData: UserCompanyCreate) => {
      const response = await api.post('/permissions/', permissionData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast({
        title: 'Success',
        description: 'Permission assigned successfully',
      });
      setShowForm(false);
      setSelectedPermission(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to assign permission',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      userId,
      companyId,
      data,
    }: {
      userId: string;
      companyId: string;
      data: UserCompanyUpdate;
    }) => {
      const response = await api.put(`/permissions/${userId}/${companyId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast({
        title: 'Success',
        description: 'Permission updated successfully',
      });
      setSelectedPermission(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to update permission',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ userId, companyId }: { userId: string; companyId: string }) => {
      await api.delete(`/permissions/${userId}/${companyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast({
        title: 'Success',
        description: 'Permission removed successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to remove permission',
        variant: 'destructive',
      });
    },
  });

  const handleFormSubmit = (permissionData: UserCompanyCreate | UserCompanyUpdate) => {
    if (selectedPermission) {
      updateMutation.mutate({
        userId: selectedPermission.user_id,
        companyId: selectedPermission.company_id,
        data: permissionData as UserCompanyUpdate,
      });
    } else {
      createMutation.mutate(permissionData as UserCompanyCreate);
    }
  };

  const handleDelete = (permission: UserCompany) => {
    if (window.confirm('Are you sure you want to remove this permission?')) {
      deleteMutation.mutate({
        userId: permission.user_id,
        companyId: permission.company_id,
      });
    }
  };

  const handleEdit = (permission: UserCompany) => {
    setSelectedPermission(permission);
    setShowForm(true);
  };

  const handleNew = () => {
    if (!selectedCompanyId) {
      toast({
        title: 'Error',
        description: 'Please select a company first',
        variant: 'destructive',
      });
      return;
    }
    setSelectedPermission(null);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Permissions Management</h1>
        <Button onClick={handleNew} disabled={!selectedCompanyId}>
          <Plus className="mr-2 h-4 w-4" />
          Assign User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Company</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a company to manage permissions" />
            </SelectTrigger>
            <SelectContent>
              {companies?.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name} ({company.ucid})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedCompanyId && (
        <div className="grid md:grid-cols-2 gap-6">
          <PermissionsList
            permissions={permissions || []}
            users={users || []}
            companies={companies || []}
            onDelete={handleDelete}
            onEdit={handleEdit}
            isLoading={isLoading}
            isError={isError}
          />
          {(showForm || selectedPermission) && (
            <PermissionForm
              onSubmit={handleFormSubmit}
              initialData={selectedPermission}
              companyId={selectedCompanyId}
              users={users || []}
              companies={companies || []}
              onCancel={() => {
                setShowForm(false);
                setSelectedPermission(null);
              }}
              isSubmitting={createMutation.isPending || updateMutation.isPending}
            />
          )}
        </div>
      )}

      {!selectedCompanyId && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              Select a company to view and manage user permissions.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PermissionsPage;


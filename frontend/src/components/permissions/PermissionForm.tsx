import React, { useState, useEffect } from 'react';
import { UserCompany, UserCompanyCreate, UserCompanyUpdate } from '@/types/user';
import { User } from '@/types/user';
import { Company } from '@/types/company';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface PermissionFormProps {
  onSubmit: (permission: UserCompanyCreate | UserCompanyUpdate) => void;
  initialData?: UserCompany | null;
  companyId: string;
  users: User[];
  companies: Company[];
  onCancel: () => void;
  isSubmitting: boolean;
}

const PermissionForm: React.FC<PermissionFormProps> = ({
  onSubmit,
  initialData,
  companyId,
  users,
  companies,
  onCancel,
  isSubmitting,
}) => {
  const [userId, setUserId] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState(companyId);
  const [isAdmin, setIsAdmin] = useState(false);
  const [canEdit, setCanEdit] = useState(true);
  const [canView, setCanView] = useState(true);

  useEffect(() => {
    if (initialData) {
      setUserId(initialData.user_id);
      setSelectedCompanyId(initialData.company_id);
      setIsAdmin(initialData.is_admin);
      setCanEdit(initialData.can_edit);
      setCanView(initialData.can_view);
    } else {
      setUserId('');
      setSelectedCompanyId(companyId);
      setIsAdmin(false);
      setCanEdit(true);
      setCanView(true);
    }
  }, [initialData, companyId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!initialData && !userId) {
      alert('Please select a user');
      return;
    }

    const permissionData: UserCompanyCreate | UserCompanyUpdate = initialData
      ? {
          is_admin: isAdmin,
          can_edit: canEdit,
          can_view: canView,
        }
      : {
          user_id: userId,
          company_id: selectedCompanyId,
          is_admin: isAdmin,
          can_edit: canEdit,
          can_view: canView,
        };

    onSubmit(permissionData);
  };

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);
  const selectedUser = users.find((u) => u.id === userId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialData ? 'Edit Permission' : 'Assign User to Company'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!initialData && (
            <div className="space-y-2">
              <Label htmlFor="user">User *</Label>
              <Select value={userId} onValueChange={setUserId} disabled={isSubmitting}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.email} {user.is_superuser && '(Superuser)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!initialData && (
            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Select
                value={selectedCompanyId}
                onValueChange={setSelectedCompanyId}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name} ({company.ucid})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {initialData && (
            <div className="space-y-2 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">User: {selectedUser?.email}</p>
              <p className="text-sm font-medium">Company: {selectedCompany?.name}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="can_view">Can View</Label>
                <p className="text-xs text-muted-foreground">
                  User can view company data
                </p>
              </div>
              <Switch
                id="can_view"
                checked={canView}
                onCheckedChange={setCanView}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="can_edit">Can Edit</Label>
                <p className="text-xs text-muted-foreground">
                  User can edit company data
                </p>
              </div>
              <Switch
                id="can_edit"
                checked={canEdit}
                onCheckedChange={setCanEdit}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_admin">Is Admin</Label>
                <p className="text-xs text-muted-foreground">
                  User can manage company settings and permissions
                </p>
              </div>
              <Switch
                id="is_admin"
                checked={isAdmin}
                onCheckedChange={setIsAdmin}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                initialData ? 'Update Permission' : 'Assign User'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PermissionForm;


import React from 'react';
import { UserCompany } from '@/types/user';
import { User } from '@/types/user';
import { Company } from '@/types/company';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Shield, Eye, Pencil } from 'lucide-react';

interface PermissionsListProps {
  permissions: UserCompany[];
  users: User[];
  companies: Company[];
  onDelete: (permission: UserCompany) => void;
  onEdit: (permission: UserCompany) => void;
  isLoading: boolean;
  isError: boolean;
}

const PermissionsList: React.FC<PermissionsListProps> = ({
  permissions,
  users,
  companies,
  onDelete,
  onEdit,
  isLoading,
  isError,
}) => {
  if (isLoading) return <p>Loading permissions...</p>;
  if (isError) return <p className="text-destructive">Error loading permissions.</p>;

  const getUser = (userId: string) => users.find((u) => u.id === userId);
  const getCompany = (companyId: string) =>
    companies.find((c) => c.id === companyId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Permissions</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {permissions.map((permission) => {
            const user = getUser(permission.user_id);
            const company = getCompany(permission.company_id);

            return (
              <li
                key={permission.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 cursor-pointer" onClick={() => onEdit(permission)}>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold hover:underline">
                        {user?.email || 'Unknown User'}
                      </h3>
                      {permission.is_admin && (
                        <Badge variant="default" className="bg-purple-600">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm">
                      {permission.can_view && (
                        <Badge variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Badge>
                      )}
                      {permission.can_edit && (
                        <Badge variant="outline">
                          <Pencil className="h-3 w-3 mr-1" />
                          Edit
                        </Badge>
                      )}
                    </div>
                    {company && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Company: {company.name}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(permission)}
                      className="h-8 w-8"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(permission)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {permissions.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            No permissions assigned. Assign a user to get started.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PermissionsList;


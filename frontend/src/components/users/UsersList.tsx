import React from 'react';
import { User } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Mail, Shield, User as UserIcon } from 'lucide-react';

interface UsersListProps {
  users: User[];
  onDelete: (id: string) => void;
  onEdit: (user: User) => void;
  isLoading: boolean;
  isError: boolean;
}

const UsersList: React.FC<UsersListProps> = ({
  users,
  onDelete,
  onEdit,
  isLoading,
  isError,
}) => {
  if (isLoading) return <p>Loading users...</p>;
  if (isError) return <p className="text-destructive">Error loading users.</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {users.map((user) => (
            <li
              key={user.id}
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 cursor-pointer" onClick={() => onEdit(user)}>
                  <div className="flex items-center gap-2 mb-2">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold hover:underline">{user.email}</h3>
                    {user.is_superuser && (
                      <Badge variant="default" className="bg-purple-600">
                        <Shield className="h-3 w-3 mr-1" />
                        Superuser
                      </Badge>
                    )}
                    {!user.is_active && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span>{user.email}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(user)}
                    className="h-8 w-8"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(user.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {users.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            No users found. Add one to get started.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default UsersList;


import React, { useState, useEffect } from 'react';
import { User } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

interface UserFormProps {
  onSubmit: (user: Partial<User>) => void;
  initialData?: User | null;
  onCancel: () => void;
  isSubmitting: boolean;
}

const UserForm: React.FC<UserFormProps> = ({
  onSubmit,
  initialData,
  onCancel,
  isSubmitting,
}) => {
  const [email, setEmail] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSuperuser, setIsSuperuser] = useState(false);

  useEffect(() => {
    if (initialData) {
      setEmail(initialData.email);
      setIsActive(initialData.is_active);
      setIsSuperuser(initialData.is_superuser);
    } else {
      setEmail('');
      setIsActive(true);
      setIsSuperuser(false);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) return;

    const userData: Partial<User> = initialData
      ? {
          email: email.trim(),
          is_active: isActive,
          is_superuser: isSuperuser,
        }
      : {
          email: email.trim(),
          is_superuser: isSuperuser,
        };

    onSubmit(userData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? 'Edit User' : 'Create New User'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Active</Label>
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_superuser">Superuser</Label>
            <Switch
              id="is_superuser"
              checked={isSuperuser}
              onCheckedChange={setIsSuperuser}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                initialData ? 'Update User' : 'Create User'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default UserForm;

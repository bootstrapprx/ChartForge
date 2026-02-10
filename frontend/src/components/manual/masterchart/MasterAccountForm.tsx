// frontend/src/components/manual/masterchart/MasterAccountForm.tsx
import React, { useState, useEffect } from 'react';
import { MasterAccount } from '@/types/masterchart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface MasterAccountFormProps {
  account: MasterAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (account: MasterAccount) => void;
}

const MasterAccountForm: React.FC<MasterAccountFormProps> = ({ account, isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<Partial<MasterAccount>>({});

  useEffect(() => {
    if (account) {
      setFormData(account);
    }
  }, [account]);

  if (!account) return null;

  const handleChange = (field: keyof MasterAccount, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSubmit(formData as MasterAccount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Account: {account.code}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="description">Description</Label>
            <Input id="description" value={formData.description || ''} onChange={e => handleChange('description', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Input id="category" value={formData.category || ''} onChange={e => handleChange('category', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <Select value={formData.type} onValueChange={value => handleChange('type', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="H">Header</SelectItem>
                <SelectItem value="D">Detail</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MasterAccountForm;

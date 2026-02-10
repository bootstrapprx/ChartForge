// frontend/src/components/manual/masterchart/MasterAccountCreationForm.tsx
import React, { useState } from 'react';
import { MasterAccount, MasterAccountCreate } from '@/types/masterchart'; // Assuming MasterAccountCreate exists
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useGenerateCode } from '@/hooks/api/useCodeGenerator';
import { useManualMode } from '@/contexts/ManualModeContext';
import { useToast } from '@/hooks/use-toast';

interface MasterAccountCreationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (account: MasterAccountCreate) => void;
  parentCode: string | null;
}

const MasterAccountCreationForm: React.FC<MasterAccountCreationFormProps> = ({ isOpen, onClose, onSubmit, parentCode }) => {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Asset');
  const [type, setType] = useState<'H' | 'D'>('D');
  const [manualCode, setManualCode] = useState('');
  const [autoGenerate, setAutoGenerate] = useState(true);

  const { isManualMode } = useManualMode();
  const generateCodeMutation = useGenerateCode();
  const { toast } = useToast();

  const handleSubmit = async () => {
    let codeToUse = manualCode;
    if (autoGenerate && !isManualMode) {
        try {
            const result = await generateCodeMutation.mutateAsync({ parent_code: parentCode || undefined, category });
            codeToUse = result.code;
        } catch (err: any) {
            toast({ title: 'Code Generation Failed', description: err.message, variant: 'destructive' });
            return;
        }
    }

    if (!description || !codeToUse) {
        toast({ title: 'Error', description: 'Description and Code are required.', variant: 'destructive' });
        return;
    }

    onSubmit({
        code: codeToUse,
        description,
        category,
        type,
        parent_code: parentCode,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Master Account</DialogTitle>
          <DialogDescription>Parent: {parentCode || 'Root'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <Input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
            {/* Add selects for Category and Type for a real implementation */}
            {!isManualMode && (
                <div className="flex items-center space-x-2">
                    <Checkbox id="auto-generate" checked={autoGenerate} onCheckedChange={c => setAutoGenerate(c as boolean)} />
                    <Label htmlFor="auto-generate">Auto-generate Code (AI)</Label>
                </div>
            )}
            {(!autoGenerate || isManualMode) && <Input placeholder="Manual Code" value={manualCode} onChange={e => setManualCode(e.target.value)} />}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={generateCodeMutation.isPending}>
            Create Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MasterAccountCreationForm;

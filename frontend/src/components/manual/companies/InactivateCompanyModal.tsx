import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';
import { Company } from '@/types/company';

interface InactivateCompanyModalProps {
    company: Company | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (ucid: string, confirmation: string) => Promise<void>;
    isActivating?: boolean; // Reused for activation
}

const InactivateCompanyModal: React.FC<InactivateCompanyModalProps> = ({ company, open, onOpenChange, onConfirm, isActivating = false }) => {
    const [confirmation, setConfirmation] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConfirm = async () => {
        if (!company) return;
        setIsSubmitting(true);
        try {
            await onConfirm(company.ucid, confirmation.trim());
            onOpenChange(false);
            setConfirmation('');
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const action = isActivating ? "Activate" : "Inactivate";
    const warningColor = isActivating ? "text-green-600" : "text-red-600";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className={`h-5 w-5 ${warningColor}`} />
                        {action} Company
                    </DialogTitle>
                    <DialogDescription>
                        This action will <strong>{action.toLowerCase()}</strong> the company <strong>{company?.name}</strong>.
                        {!isActivating && (
                            <p className="mt-2 text-sm text-muted-foreground bg-muted p-2 rounded">
                                Warning: Inactivating this company may affect Master Charts, Mappings, and Sync configurations.
                            </p>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="confirmation">
                            Type <strong
                                className="cursor-pointer hover:underline text-primary"
                                onClick={() => {
                                    if (company?.name) {
                                        setConfirmation(company.name);
                                        // Optional: toast.success("Name copied!");
                                    }
                                }}
                                title="Click to autofill"
                            >
                                {company?.name}
                            </strong> to confirm:
                        </Label>
                        <Input
                            id="confirmation"
                            value={confirmation}
                            onChange={(e) => setConfirmation(e.target.value)}
                            placeholder={company?.name}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        variant={isActivating ? "default" : "destructive"}
                        onClick={handleConfirm}
                        disabled={confirmation.trim() !== company?.name || isSubmitting}
                    >
                        {isSubmitting ? "Processing..." : `Confirm ${action}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default InactivateCompanyModal;

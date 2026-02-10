import React, { useState } from 'react';
import { Company } from '@/types/company';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';

interface DeleteCompanyModalProps {
    company: Company | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (id: string, confirmation: string) => Promise<void>;
}

const DeleteCompanyModal: React.FC<DeleteCompanyModalProps> = ({
    company,
    open,
    onOpenChange,
    onConfirm,
}) => {
    const [confirmation, setConfirmation] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!company) return null;

    const handleConfirm = async () => {
        if (confirmation !== company.name) return;

        setIsLoading(true);
        try {
            await onConfirm(company.id, confirmation);
            onOpenChange(false);
        } catch (error) {
            // Error handling is done in parent
        } finally {
            setIsLoading(false);
            setConfirmation('');
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="sm:max-w-[425px]">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Hard Delete Company
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                        <p>
                            This action cannot be undone. This will <strong>permanently delete</strong> the company
                            <span className="font-semibold text-foreground"> {company.name} </span>
                            and all associated data from the database.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Please type <span className="font-mono font-bold select-all">{company.name}</span> to confirm.
                        </p>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                    <Label htmlFor="confirmation" className="sr-only">
                        Confirmation Name
                    </Label>
                    <Input
                        id="confirmation"
                        value={confirmation}
                        onChange={(e) => setConfirmation(e.target.value)}
                        placeholder="Type company name to confirm"
                        className="col-span-3"
                        autoComplete="off"
                    />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleConfirm();
                        }}
                        disabled={confirmation !== company.name || isLoading}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isLoading ? "Deleting..." : "Permanently Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default DeleteCompanyModal;

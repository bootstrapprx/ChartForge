import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Company, CompanyUpdate } from '@/types/company';

const companySchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    website: z.string().url().optional().or(z.literal('')),
    address_line1: z.string().optional(),
    address_line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().optional(),
    tax_id: z.string().optional(),
    industry: z.string().optional(),
    description: z.string().optional(),
});

interface EditCompanyModalProps {
    company: Company | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: CompanyUpdate) => Promise<void>;
}

const EditCompanyModal: React.FC<EditCompanyModalProps> = ({ company, open, onOpenChange, onSubmit }) => {
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CompanyUpdate>({
        resolver: zodResolver(companySchema),
    });

    useEffect(() => {
        if (company) {
            reset(company);
        }
    }, [company, reset]);

    const onFormSubmit = async (data: CompanyUpdate) => {
        await onSubmit(data);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit Company: {company?.name}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onFormSubmit)}>
                    <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="basic">Basic Info</TabsTrigger>
                            <TabsTrigger value="contact">Contact & Address</TabsTrigger>
                            <TabsTrigger value="additional">Additional</TabsTrigger>
                        </TabsList>

                        <TabsContent value="basic" className="space-y-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Company Name</Label>
                                <Input id="name" {...register('name')} />
                                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="industry">Industry</Label>
                                <Input id="industry" {...register('industry')} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="tax_id">Tax ID / EIN</Label>
                                <Input id="tax_id" {...register('tax_id')} />
                            </div>
                        </TabsContent>

                        <TabsContent value="contact" className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" {...register('email')} />
                                    {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input id="phone" {...register('phone')} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="website">Website</Label>
                                <Input id="website" {...register('website')} />
                                {errors.website && <p className="text-sm text-red-500">{errors.website.message}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address_line1">Address Line 1</Label>
                                <Input id="address_line1" {...register('address_line1')} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address_line2">Address Line 2</Label>
                                <Input id="address_line2" {...register('address_line2')} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input id="city" {...register('city')} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="state">State</Label>
                                    <Input id="state" {...register('state')} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="postal_code">Postal Code</Label>
                                    <Input id="postal_code" {...register('postal_code')} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="country">Country</Label>
                                    <Input id="country" {...register('country')} />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="additional" className="space-y-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" {...register('description')} />
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>Save Changes</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EditCompanyModal;

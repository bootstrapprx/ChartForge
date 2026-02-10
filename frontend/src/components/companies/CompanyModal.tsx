// frontend/src/components/companies/CompanyModal.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building2, CheckCircle2, AlertTriangle, Power, PowerOff } from 'lucide-react';
import { api } from '@/lib/api';

// Validation schema
const companySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
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

type CompanyFormData = z.infer<typeof companySchema>;

interface Company {
  id: string;
  ucid: string;
  name: string;
  is_active: boolean;
  email?: string;
  phone?: string;
  website?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  tax_id?: string;
  industry?: string;
  description?: string;
  created_at?: string;
  inactivated_at?: string;
}

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  company?: Company | null;
  onSuccess?: () => void;
}

const CompanyModal: React.FC<CompanyModalProps> = ({
  isOpen,
  onClose,
  company,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [createdUcid, setCreatedUcid] = useState<string | null>(null);
  const [showInactivateDialog, setShowInactivateDialog] = useState(false);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [confirmationName, setConfirmationName] = useState('');
  const [isProcessingStatus, setIsProcessingStatus] = useState(false);

  const isEditMode = !!company;

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      website: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
      tax_id: '',
      industry: '',
      description: '',
    },
  });

  // Load company data when editing
  useEffect(() => {
    if (company) {
      form.reset({
        name: company.name || '',
        email: company.email || '',
        phone: company.phone || '',
        website: company.website || '',
        address_line1: company.address_line1 || '',
        address_line2: company.address_line2 || '',
        city: company.city || '',
        state: company.state || '',
        postal_code: company.postal_code || '',
        country: company.country || '',
        tax_id: company.tax_id || '',
        industry: company.industry || '',
        description: company.description || '',
      });
    } else {
      form.reset();
      setCreatedUcid(null);
    }
  }, [company, isOpen]);

  const handleSubmit = async (data: CompanyFormData) => {
    setIsLoading(true);

    // Sanitize data: convert empty strings to null
    const sanitizedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, value === '' ? null : value])
    );

    try {
      const url = isEditMode
        ? `/companies/${company.id}`
        : `/companies/`;

      const method = isEditMode ? 'put' : 'post';
      const result = await api[method]<any>(url, sanitizedData);

      if (!isEditMode) {
        setCreatedUcid(result.ucid);
      }

      toast({
        title: isEditMode ? 'Company Updated' : 'Company Created!',
        description: isEditMode
          ? 'Company details have been updated'
          : `UCID: ${result.ucid}`,
      });

      if (onSuccess) onSuccess();

      if (isEditMode) {
        onClose();
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInactivate = async () => {
    if (!company || confirmationName !== company.name) {
      toast({
        variant: 'destructive',
        title: 'Confirmation Failed',
        description: 'Company name does not match',
      });
      return;
    }

    setIsProcessingStatus(true);
    try {
      await api.patch(`/companies/${company.ucid}/inactivate`, { confirmation: confirmationName });

      toast({
        title: 'Company Inactivated',
        description: `${company.name} has been inactivated`,
      });

      setShowInactivateDialog(false);
      setConfirmationName('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to inactivate',
      });
    } finally {
      setIsProcessingStatus(false);
    }
  };

  const handleActivate = async () => {
    if (!company || confirmationName !== company.name) {
      toast({
        variant: 'destructive',
        title: 'Confirmation Failed',
        description: 'Company name does not match',
      });
      return;
    }

    setIsProcessingStatus(true);
    try {
      await api.patch(`/companies/${company.ucid}/activate`, { confirmation: confirmationName });

      toast({
        title: 'Company Activated',
        description: `${company.name} has been reactivated`,
      });

      setShowActivateDialog(false);
      setConfirmationName('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to activate',
      });
    } finally {
      setIsProcessingStatus(false);
    }
  };

  const handleClose = () => {
    setCreatedUcid(null);
    setConfirmationName('');
    form.reset();
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {isEditMode ? 'Edit Company' : 'Register New Company'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? `Editing ${company?.name} (UCID: ${company?.ucid})`
                : 'Enter company details to generate a Unique Company ID (UCID)'}
            </DialogDescription>
          </DialogHeader>

          {/* Success State */}
          {createdUcid && !isEditMode ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center">
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight">Registration Successful</h3>
                <p className="text-muted-foreground">
                  Your company has been assigned the following UCID:
                </p>
                <div className="mt-4 rounded-lg bg-muted p-4 text-4xl font-mono font-bold tracking-widest text-primary border-2 border-primary/20">
                  {createdUcid}
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button variant="outline" onClick={() => setCreatedUcid(null)}>
                  Register Another
                </Button>
                <Button onClick={handleClose}>Done</Button>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                {/* Status Badge for Edit Mode */}
                {isEditMode && company && (
                  <div className="flex items-center gap-2">
                    <Badge variant={company.is_active ? 'default' : 'destructive'}>
                      {company.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {company.inactivated_at && (
                      <span className="text-sm text-muted-foreground">
                        Inactivated: {new Date(company.inactivated_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}

                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="contact">Contact</TabsTrigger>
                    <TabsTrigger value="additional">Additional</TabsTrigger>
                  </TabsList>

                  {/* Basic Info Tab */}
                  <TabsContent value="basic" className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Acme Corp, Inc." {...field} />
                          </FormControl>
                          <FormDescription>
                            The official legal name of the entity
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industry</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Technology, Finance, Healthcare..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Brief description of the company..."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  {/* Contact Tab */}
                  <TabsContent value="contact" className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="contact@company.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder="+1 (555) 123-4567"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input
                              type="url"
                              placeholder="https://www.company.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="address_line1"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Address Line 1</FormLabel>
                            <FormControl>
                              <Input placeholder="123 Main Street" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="address_line2"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Address Line 2</FormLabel>
                            <FormControl>
                              <Input placeholder="Suite 100" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="New York" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State/Province</FormLabel>
                            <FormControl>
                              <Input placeholder="NY" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="postal_code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Code</FormLabel>
                            <FormControl>
                              <Input placeholder="10001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input placeholder="United States" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  {/* Additional Tab */}
                  <TabsContent value="additional" className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="tax_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax ID / EIN</FormLabel>
                          <FormControl>
                            <Input placeholder="12-3456789" {...field} />
                          </FormControl>
                          <FormDescription>
                            Employer Identification Number or Tax ID
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Activation Controls (Edit Mode Only) */}
                    {isEditMode && company && (
                      <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                        <h4 className="font-medium flex items-center gap-2">
                          <Power className="h-4 w-4" />
                          Company Status
                        </h4>
                        {company.is_active ? (
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Inactivating a company will preserve all data but prevent new
                              transactions. The UCID will become available again.
                            </p>
                            <Button
                              type="button"
                              variant="destructive"
                              onClick={() => setShowInactivateDialog(true)}
                            >
                              <PowerOff className="h-4 w-4 mr-2" />
                              Inactivate Company
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Reactivating will restore the company to active status.
                            </p>
                            <Button
                              type="button"
                              variant="default"
                              onClick={() => setShowActivateDialog(true)}
                            >
                              <Power className="h-4 w-4 mr-2" />
                              Reactivate Company
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isEditMode ? 'Updating...' : 'Generating UCID...'}
                      </>
                    ) : isEditMode ? (
                      'Update Company'
                    ) : (
                      'Register Company'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Inactivate Confirmation Dialog */}
      <AlertDialog open={showInactivateDialog} onOpenChange={setShowInactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Inactivate Company
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                This will inactivate <strong>{company?.name}</strong>. The company
                data will be preserved but no new transactions can be made.
              </p>
              <p>
                To confirm, please type the company name exactly:
                <strong className="block mt-1">{company?.name}</strong>
              </p>
              <Input
                value={confirmationName}
                onChange={(e) => setConfirmationName(e.target.value)}
                placeholder="Type company name to confirm"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmationName('')}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleInactivate}
              disabled={confirmationName !== company?.name || isProcessingStatus}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isProcessingStatus ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Inactivate'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Activate Confirmation Dialog */}
      <AlertDialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Power className="h-5 w-5 text-green-500" />
              Reactivate Company
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                This will reactivate <strong>{company?.name}</strong> and restore
                full functionality.
              </p>
              <p>
                To confirm, please type the company name exactly:
                <strong className="block mt-1">{company?.name}</strong>
              </p>
              <Input
                value={confirmationName}
                onChange={(e) => setConfirmationName(e.target.value)}
                placeholder="Type company name to confirm"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmationName('')}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleActivate}
              disabled={confirmationName !== company?.name || isProcessingStatus}
            >
              {isProcessingStatus ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Reactivate'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CompanyModal;


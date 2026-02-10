import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MasterAccount, MasterAccountNode } from '@/types/masterchart';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/integrations/api';

const accountSchema = z.object({
  code: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  type: z.enum(['H', 'D'], { required_error: 'Type is required' }),
  parent_code: z.string().nullable().optional(),
  notes: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
});

type AccountFormData = z.infer<typeof accountSchema>;

interface MasterAccountFormDialogProps {
  account: MasterAccountNode | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AccountFormData) => Promise<void>;
  parentCode?: string | null;
  mode: 'create' | 'edit';
}

const MasterAccountFormDialog: React.FC<MasterAccountFormDialogProps> = ({
  account,
  isOpen,
  onClose,
  onSubmit,
  parentCode,
  mode,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch categories
  const { data: categories } = useQuery<string[]>({
    queryKey: ['masterchart', 'categories'],
    queryFn: async () => {
      const response = await api.get('/masterchart/categories');
      return response.data;
    },
  });

  // Fetch all accounts for parent selection
  const { data: allAccounts } = useQuery<MasterAccount[]>({
    queryKey: ['masterchart', 'list'],
    queryFn: async () => {
      const response = await api.get('/masterchart');
      return response.data;
    },
  });

  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      code: '',
      description: '',
      category: '',
      type: 'D',
      parent_code: null,
      notes: null,
      start_date: null,
      end_date: null,
    },
  });

  useEffect(() => {
    if (mode === 'edit' && account) {
      form.reset({
        code: account.code,
        description: account.description,
        category: account.category,
        type: account.type,
        parent_code: account.parent_code,
        notes: account.notes || null,
        start_date: account.start_date || null,
        end_date: account.end_date || null,
      });
    } else if (mode === 'create') {
      form.reset({
        code: '',
        description: '',
        category: '',
        type: 'D',
        parent_code: parentCode || null,
        notes: null,
        start_date: null,
        end_date: null,
      });
    }
  }, [account, mode, parentCode, form]);

  const handleSubmit = async (data: AccountFormData) => {
    setIsSubmitting(true);
    try {
      // Convert date strings to proper format for API
      const submitData = {
        ...data,
        start_date: data.start_date || undefined,
        end_date: data.end_date || undefined,
        parent_code: data.parent_code || undefined,
        notes: data.notes || undefined,
      };
      await onSubmit(submitData);
      form.reset();
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter out accounts that can't be parents (Detail accounts or the current account if editing)
  const availableParents = allAccounts?.filter((acc) => {
    if (mode === 'edit' && account) {
      return acc.type === 'H' && acc.id !== account.id && acc.code !== account.code;
    }
    return acc.type === 'H';
  }) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Account' : 'Edit Account'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a new account in the master chart. Leave code empty to auto-generate.'
              : 'Update account information.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code {mode === 'create' && '(optional)'}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Auto-generated if empty"
                        disabled={mode === 'edit' || isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      {mode === 'create'
                        ? 'Leave empty to auto-generate based on parent'
                        : 'Code cannot be changed'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="H">Header (can have children)</SelectItem>
                        <SelectItem value="D">Detail (leaf account)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Header accounts can have child accounts
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Account description" disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        if (value === '__new__') {
                          const newCategory = prompt('Enter new category name:');
                          if (newCategory) {
                            field.onChange(newCategory);
                          }
                        } else {
                          field.onChange(value);
                        }
                      }}
                      value={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                        <SelectItem value="__new__">+ Add New Category</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parent_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Account</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
                      value={field.value || 'none'}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="No parent (root)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No parent (root account)</SelectItem>
                        {availableParents.map((acc) => (
                          <SelectItem key={acc.id} value={acc.code}>
                            {acc.code} - {acc.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select a parent account (must be a Header type)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ''}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ''}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ''}
                      placeholder="Additional notes..."
                      rows={3}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  mode === 'create' ? 'Create Account' : 'Update Account'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default MasterAccountFormDialog;


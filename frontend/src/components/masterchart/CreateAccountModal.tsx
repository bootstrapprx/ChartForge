// frontend/src/components/masterchart/CreateAccountModal.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MasterAccountCreate, AccountSuggestion, AutofillSuggestions } from '@/types/masterchart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2, Sparkles, X, Plus, Lightbulb } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useGenerateCode } from '@/hooks/api/useCodeGenerator';
import { useManualMode } from '@/contexts/ManualModeContext';
import { api } from '@/lib/api';

// Validation schema
const formSchema = z.object({
  code: z.string().optional(),
  description: z.string().min(2, 'Description is required'),
  long_description: z.string().optional(),
  type: z.enum(['H', 'D', 'Header', 'Detail']),
  category: z.string().min(1, 'Category is required'),
  fs_mapping: z.string().optional(),
  parent_code: z.string().optional().nullable(),
  normal_balance: z.enum(['Debit', 'Credit']).optional(),
  regulatory_mapping: z.string().optional(),
  start_date: z.date().optional().nullable(),
  end_date: z.date().optional().nullable(),
  notes: z.string().optional(),
  subcategory: z.string().optional(),
  cash_flow_classification: z.string().optional(),
  cost_center: z.string().optional(),
  gaap_classification: z.string().optional(),
  detailed_description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (account: MasterAccountCreate) => Promise<void>;
  parentCode?: string | null;
  editAccount?: MasterAccountCreate | null;
}

const CATEGORIES = [
  'Asset',
  'Liability',
  'Equity',
  'Revenue',
  'Expense',
  'Cost of Goods Sold',
  'Other',
];

const FS_MAPPINGS = [
  'Balance Sheet',
  'Income Statement',
];

const CASH_FLOW_CLASSIFICATIONS = [
  'Operating Activities',
  'Investing Activities',
  'Financing Activities',
];

const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  parentCode,
  editAccount,
}) => {
  const { toast } = useToast();
  const { isManualMode } = useManualMode();
  const generateCodeMutation = useGenerateCode();
  
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [vendors, setVendors] = useState<string[]>([]);
  const [vendorInput, setVendorInput] = useState('');
  const [suggestions, setSuggestions] = useState<AccountSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [autofillData, setAutofillData] = useState<AutofillSuggestions | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      description: '',
      long_description: '',
      type: 'D',
      category: 'Asset',
      fs_mapping: '',
      parent_code: parentCode || '',
      normal_balance: undefined,
      regulatory_mapping: '',
      notes: '',
      subcategory: '',
      cash_flow_classification: '',
      cost_center: '',
      gaap_classification: '',
      detailed_description: '',
    },
  });

  // Load edit data if provided
  useEffect(() => {
    if (editAccount) {
      form.reset({
        code: editAccount.code || '',
        description: editAccount.description,
        long_description: editAccount.long_description || '',
        type: editAccount.type as 'H' | 'D' | 'Header' | 'Detail',
        category: editAccount.category,
        fs_mapping: editAccount.fs_mapping || '',
        parent_code: editAccount.parent_code || '',
        normal_balance: editAccount.normal_balance as 'Debit' | 'Credit' | undefined,
        regulatory_mapping: editAccount.regulatory_mapping || '',
        notes: editAccount.notes || '',
        subcategory: editAccount.subcategory || '',
        cash_flow_classification: editAccount.cash_flow_classification || '',
        cost_center: editAccount.cost_center || '',
        gaap_classification: editAccount.gaap_classification || '',
        detailed_description: editAccount.detailed_description || '',
      });
      setTags(editAccount.tags || []);
      setVendors(editAccount.default_vendors || []);
      setAutoGenerate(false);
    } else {
      form.reset();
      setTags([]);
      setVendors([]);
      if (parentCode) {
        form.setValue('parent_code', parentCode);
      }
    }
  }, [editAccount, parentCode, isOpen]);

  // Fetch autofill suggestions when category changes
  const watchCategory = form.watch('category');
  useEffect(() => {
    if (watchCategory && isOpen) {
      fetchAutofillSuggestions(watchCategory);
    }
  }, [watchCategory, isOpen]);

  const fetchAutofillSuggestions = async (category: string) => {
    try {
      const data = await api.get<AutofillSuggestions>(`/masterchart/template/autofill/${category}`);
      setAutofillData(data);
    } catch (error) {
      console.error('Failed to fetch autofill suggestions:', error);
    }
  };

  // Fetch account suggestions while typing description
  const watchDescription = form.watch('description');
  useEffect(() => {
    const timer = setTimeout(() => {
      if (watchDescription && watchDescription.length > 2 && isOpen) {
        fetchSuggestions(watchDescription);
      } else {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [watchDescription, isOpen]);

  const fetchSuggestions = async (query: string) => {
    setIsLoadingSuggestions(true);
    try {
      const data = await api.get<AccountSuggestion[]>('/masterchart/template/suggest', {
        params: { query, limit: 5 }
      });
      setSuggestions(data);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const applyAutofill = () => {
    if (autofillData?.suggestions) {
      const { fs_mapping, normal_balance, subcategory } = autofillData.suggestions;
      if (fs_mapping && !form.getValues('fs_mapping')) {
        form.setValue('fs_mapping', fs_mapping);
      }
      if (normal_balance && !form.getValues('normal_balance')) {
        form.setValue('normal_balance', normal_balance as 'Debit' | 'Credit');
      }
      if (subcategory && !form.getValues('subcategory')) {
        form.setValue('subcategory', subcategory);
      }
      toast({ title: 'Autofill Applied', description: 'Fields populated from template' });
    }
  };

  const applySuggestion = (suggestion: AccountSuggestion) => {
    form.setValue('description', suggestion.description);
    form.setValue('category', suggestion.category);
    form.setValue('type', suggestion.type as 'H' | 'D');
    if (suggestion.normal_balance) {
      form.setValue('normal_balance', suggestion.normal_balance as 'Debit' | 'Credit');
    }
    if (suggestion.tags) {
      setTags(suggestion.tags);
    }
    setSuggestions([]);
    toast({ title: 'Suggestion Applied', description: `Using template for ${suggestion.code}` });
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim().toLowerCase()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const addVendor = () => {
    if (vendorInput.trim() && !vendors.includes(vendorInput.trim())) {
      setVendors([...vendors, vendorInput.trim()]);
      setVendorInput('');
    }
  };

  const removeVendor = (vendor: string) => {
    setVendors(vendors.filter(v => v !== vendor));
  };

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      let codeToUse = data.code;

      // Auto-generate code if needed
      if (autoGenerate && !codeToUse && !isManualMode) {
        try {
          const result = await generateCodeMutation.mutateAsync({
            parent_code: data.parent_code || undefined,
            category: data.category,
          });
          codeToUse = result.code;
        } catch (err: any) {
          toast({
            title: 'Code Generation Failed',
            description: err.message,
            variant: 'destructive',
          });
          setIsSubmitting(false);
          return;
        }
      }

      const accountData: MasterAccountCreate = {
        code: codeToUse || undefined,
        description: data.description,
        long_description: data.long_description || undefined,
        type: data.type,
        category: data.category,
        fs_mapping: data.fs_mapping || undefined,
        parent_code: data.parent_code || undefined,
        normal_balance: data.normal_balance || undefined,
        tags: tags.length > 0 ? tags : undefined,
        default_vendors: vendors.length > 0 ? vendors : undefined,
        regulatory_mapping: data.regulatory_mapping || undefined,
        start_date: data.start_date ? format(data.start_date, 'yyyy-MM-dd') : undefined,
        end_date: data.end_date ? format(data.end_date, 'yyyy-MM-dd') : undefined,
        notes: data.notes || undefined,
        subcategory: data.subcategory || undefined,
        cash_flow_classification: data.cash_flow_classification || undefined,
        cost_center: data.cost_center || undefined,
        gaap_classification: data.gaap_classification || undefined,
        detailed_description: data.detailed_description || undefined,
      };

      await onSubmit(accountData);
      form.reset();
      setTags([]);
      setVendors([]);
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create account',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editAccount ? 'Edit Account' : 'Create New Account'}
            <Sparkles className="h-4 w-4 text-primary" />
          </DialogTitle>
          <DialogDescription>
            {parentCode ? `Creating under parent: ${parentCode}` : 'Creating root-level account'}
          </DialogDescription>
        </DialogHeader>

        {/* AI Suggestions Banner */}
        {suggestions.length > 0 && (
          <div className="bg-muted/50 border rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              AI Suggestions from Template
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <Button
                  key={s.code}
                  variant="outline"
                  size="sm"
                  onClick={() => applySuggestion(s)}
                  className="text-xs"
                >
                  {s.code}: {s.description.substring(0, 30)}...
                </Button>
              ))}
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="classification">Classification</TabsTrigger>
                <TabsTrigger value="ai">AI & Tags</TabsTrigger>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
              </TabsList>

              {/* Basic Tab */}
              <TabsContent value="basic" className="space-y-4 pt-4">
                {/* Code Field */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="auto-generate"
                        checked={autoGenerate}
                        onCheckedChange={(c) => setAutoGenerate(c as boolean)}
                        disabled={isManualMode}
                      />
                      <Label htmlFor="auto-generate" className="text-sm">
                        Auto-generate Code
                      </Label>
                    </div>
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Code</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={autoGenerate ? 'Will be auto-generated' : 'e.g., 10100'}
                              disabled={autoGenerate && !isManualMode}
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
                    name="parent_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 10000" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormDescription>Leave empty for root account</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Input placeholder="Account description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Long Description */}
                <FormField
                  control={form.control}
                  name="long_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Long Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Detailed description of the account purpose..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Type & Category Row */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="H">Header (H)</SelectItem>
                            <SelectItem value="D">Detail (D)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Header accounts group others; Detail accounts receive transactions
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Additional notes..." rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Classification Tab */}
              <TabsContent value="classification" className="space-y-4 pt-4">
                {autofillData && (
                  <Button type="button" variant="outline" size="sm" onClick={applyAutofill}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Apply Autofill from Template
                  </Button>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fs_mapping"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Financial Statement Mapping</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select mapping" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {FS_MAPPINGS.map((fs) => (
                              <SelectItem key={fs} value={fs}>
                                {fs}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="normal_balance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Normal Balance</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select balance" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Debit">Debit</SelectItem>
                            <SelectItem value="Credit">Credit</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="subcategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subcategory</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Current Asset - Cash" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cash_flow_classification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cash Flow Classification</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select classification" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CASH_FLOW_CLASSIFICATIONS.map((cf) => (
                              <SelectItem key={cf} value={cf}>
                                {cf}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="cost_center"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost Center</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., CC-0001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? format(field.value, 'PPP') : 'Select date'}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? format(field.value, 'PPP') : 'Select date'}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* AI & Tags Tab */}
              <TabsContent value="ai" className="space-y-4 pt-4">
                {/* Tags */}
                <div className="space-y-2">
                  <Label>Tags (for AI matching)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add a tag..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" size="icon" onClick={addTag}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Default Vendors */}
                <div className="space-y-2">
                  <Label>Default Vendors</Label>
                  <div className="flex gap-2">
                    <Input
                      value={vendorInput}
                      onChange={(e) => setVendorInput(e.target.value)}
                      placeholder="Add a vendor..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addVendor();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" size="icon" onClick={addVendor}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {vendors.map((vendor) => (
                      <Badge key={vendor} variant="outline" className="gap-1">
                        {vendor}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeVendor(vendor)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Detailed Description */}
                <FormField
                  control={form.control}
                  name="detailed_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detailed Description (for AI)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Comprehensive description for AI understanding..."
                          rows={5}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This detailed description helps AI provide better suggestions
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Compliance Tab */}
              <TabsContent value="compliance" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="regulatory_mapping"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Regulatory Mapping</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., IAS 1 - Presentation of Financial Statements; ASC 210 - Balance Sheet"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        IFRS/GAAP references for this account
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gaap_classification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GAAP Classification</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., US-GAAP Asset" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || generateCodeMutation.isPending}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : editAccount ? (
                  'Update Account'
                ) : (
                  'Create Account'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAccountModal;


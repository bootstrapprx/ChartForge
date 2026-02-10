import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { QueryKey } from '@/lib/queryKeys';


// Schema for validation
const formSchema = z.object({
    name: z.string().min(2, {
        message: "Company name must be at least 2 characters.",
    }),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    website: z.string().url().optional().or(z.literal("")),
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



const CompanyRegistration = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);
    const [ucid, setUcid] = useState<string | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            website: "",
            address_line1: "",
            address_line2: "",
            city: "",
            state: "",
            postal_code: "",
            country: "",
            tax_id: "",
            industry: "",
            description: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        setUcid(null);

        // Sanitize data: convert empty strings to null
        const sanitizedValues = Object.fromEntries(
            Object.entries(values).map(([key, value]) => [key, value === "" ? null : value])
        );

        try {
            const data = await api.post<any>('/companies/', sanitizedValues);

            setUcid(data.ucid);
            toast({
                title: "Company Registered!",
                description: `Successfully created company with UCID: ${data.ucid}`,
            });

            // Invalidate companies list query to ensure it refreshes
            queryClient.invalidateQueries({ queryKey: [QueryKey.COMPANIES] });

            form.reset();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Registration Failed",
                description: error.message || "An unknown error occurred",
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>Register Company</CardTitle>
                    <CardDescription>Enter your company name to generate a Unique Company ID (UCID).</CardDescription>
                </CardHeader>
                <CardContent>
                    {ucid ? (
                        <div className="flex flex-col items-center justify-center space-y-4 py-6 text-center animate-in fade-in zoom-in duration-300">
                            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold tracking-tight">Registration Successful</h3>
                                <p className="text-muted-foreground">Your company has been assigned the following UCID:</p>
                                <div className="mt-4 rounded-lg bg-muted p-4 text-4xl font-mono font-bold tracking-widest text-primary border-2 border-primary/20">
                                    {ucid}
                                </div>
                            </div>
                            <div className="flex gap-4 w-full mt-6">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => navigate('/companies')}
                                >
                                    Back to Companies
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={() => setUcid(null)}
                                >
                                    Register Another
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <Tabs defaultValue="basic" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="basic">Basic Info</TabsTrigger>
                                        <TabsTrigger value="contact">Contact</TabsTrigger>
                                        <TabsTrigger value="additional">Additional</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="basic" className="space-y-4">
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
                                                        The official legal name of the entity.
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
                                                        <Input placeholder="Technology, Finance, Healthcare, etc." {...field} />
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
                                                            className="resize-none"
                                                            rows={4}
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </TabsContent>

                                    <TabsContent value="contact" className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email</FormLabel>
                                                    <FormControl>
                                                        <Input type="email" placeholder="contact@company.com" {...field} />
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
                                                        <Input type="tel" placeholder="+1 (555) 123-4567" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="website"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Website</FormLabel>
                                                    <FormControl>
                                                        <Input type="url" placeholder="https://www.company.com" {...field} />
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

                                    <TabsContent value="additional" className="space-y-4">
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
                                    </TabsContent>
                                </Tabs>

                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" className="w-full" onClick={() => window.history.back()}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Generating UCID...
                                            </>
                                        ) : (
                                            "Register Company"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default CompanyRegistration;

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

const settingsSchema = z.object({
    AI_PROVIDER: z.enum(["ollama", "cloudflare"]),
    CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
    CLOUDFLARE_API_TOKEN: z.string().optional(),
    ORGANIZER_MODEL_NAME: z.string().optional(),
    QBO_CLIENT_ID: z.string().optional(),
    QBO_CLIENT_SECRET: z.string().optional(),
    QBO_REDIRECT_URI: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            AI_PROVIDER: "ollama",
        },
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await api.get<SettingsFormValues>("/settings/");
                form.reset(data);
            } catch (error) {
                console.error("Failed to fetch settings", error);
                toast({
                    title: "Error",
                    description: "Failed to load settings.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, [form, toast]);

    const onSubmit = async (data: SettingsFormValues) => {
        setIsSaving(true);
        try {
            const updates = Object.entries(data).map(([key, value]) => ({
                key,
                value: value || "",
            }));

            await api.post("/settings/", updates);

            toast({
                title: "Success",
                description: "Settings saved successfully.",
            });
        } catch (error) {
            console.error("Failed to save settings", error);
            toast({
                title: "Error",
                description: "Failed to save settings.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetDb = async () => {
        try {
            await api.post("/admin/reset-db", {});

            toast({
                title: "Database Reset",
                description: "The database has been successfully reset.",
            });

            // Optional: Reload page or logout
            window.location.reload();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to reset database.",
                variant: "destructive",
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div>
                <h3 className="text-lg font-medium">System Settings</h3>
                <p className="text-sm text-muted-foreground">
                    Manage API keys and integration settings.
                </p>
            </div>
            <div className="grid gap-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>AI Configuration</CardTitle>
                                <CardDescription>
                                    Configure the AI provider for the Organizer module.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="AI_PROVIDER"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>AI Provider</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                value={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a provider" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="ollama">Ollama (Local)</SelectItem>
                                                    <SelectItem value="cloudflare">Cloudflare Workers AI</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>
                                                Choose between local Ollama or Cloudflare's hosted AI.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {form.watch("AI_PROVIDER") === "cloudflare" && (
                                    <>
                                        <FormField
                                            control={form.control}
                                            name="CLOUDFLARE_ACCOUNT_ID"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Cloudflare Account ID</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Your Account ID" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="CLOUDFLARE_API_TOKEN"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Cloudflare API Token</FormLabel>
                                                    <FormControl>
                                                        <Input type="password" placeholder="Your API Token" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="ORGANIZER_MODEL_NAME"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Model Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="@cf/meta/llama-3-8b-instruct" {...field} />
                                                    </FormControl>
                                                    <FormDescription>
                                                        The Cloudflare Workers AI model to use.
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>QuickBooks Online</CardTitle>
                                <CardDescription>
                                    Configure credentials for QBO integration.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="QBO_CLIENT_ID"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Client ID</FormLabel>
                                            <FormControl>
                                                <Input placeholder="QBO Client ID" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="QBO_CLIENT_SECRET"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Client Secret</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="QBO Client Secret" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="QBO_REDIRECT_URI"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Redirect URI</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://yourdomain.com/api/v1/qbo/callback" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        {user?.is_superuser && (
                            <Card className="border-destructive">
                                <CardHeader>
                                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                                    <CardDescription>
                                        Destructive actions that cannot be undone.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive">Reset Database</Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete your
                                                    entire database and remove all data.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    onClick={handleResetDb}
                                                >
                                                    Continue
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </CardContent>
                            </Card>
                        )}

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => window.location.href = '/dashboard'}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
}

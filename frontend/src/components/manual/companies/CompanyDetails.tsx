import React from 'react';
import { Company } from '@/types/company';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, Mail, Phone, Globe, MapPin, FileText, Hash } from 'lucide-react';

interface CompanyDetailsProps {
    company: Company | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const CompanyDetails: React.FC<CompanyDetailsProps> = ({ company, open, onOpenChange }) => {
    if (!company) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <div className="flex items-center justify-between mr-8">
                        <DialogTitle className="text-2xl">{company.name}</DialogTitle>
                        {company.ucid && (
                            <Badge variant="outline" className="text-base px-3 py-1 font-mono">
                                {company.ucid}
                            </Badge>
                        )}
                    </div>
                    <DialogDescription>
                        {company.industry || "No industry specified"}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Description */}
                    {company.description && (
                        <div className="space-y-2">
                            <h4 className="font-medium flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Description
                            </h4>
                            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                                {company.description}
                            </p>
                        </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Contact Info */}
                        <div className="space-y-4">
                            <h4 className="font-medium border-b pb-2">Contact Information</h4>
                            <div className="space-y-3 text-sm">
                                {company.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <a href={`mailto:${company.email}`} className="hover:underline text-primary">
                                            {company.email}
                                        </a>
                                    </div>
                                )}
                                {company.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <a href={`tel:${company.phone}`} className="hover:underline">
                                            {company.phone}
                                        </a>
                                    </div>
                                )}
                                {company.website && (
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-muted-foreground" />
                                        <a
                                            href={company.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:underline text-primary"
                                        >
                                            {company.website.replace(/^https?:\/\//, '')}
                                        </a>
                                    </div>
                                )}
                                {!company.email && !company.phone && !company.website && (
                                    <p className="text-muted-foreground italic">No contact info available</p>
                                )}
                            </div>
                        </div>

                        {/* Address & Legal */}
                        <div className="space-y-4">
                            <h4 className="font-medium border-b pb-2">Address & Legal</h4>
                            <div className="space-y-3 text-sm">
                                {(company.address_line1 || company.city || company.state || company.country) ? (
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <div className="space-y-0.5">
                                            {company.address_line1 && <p>{company.address_line1}</p>}
                                            {company.address_line2 && <p>{company.address_line2}</p>}
                                            <p>
                                                {[
                                                    company.city,
                                                    company.state,
                                                    company.postal_code
                                                ].filter(Boolean).join(', ')}
                                            </p>
                                            {company.country && <p>{company.country}</p>}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground italic flex items-center gap-2">
                                        <MapPin className="h-4 w-4" /> No address available
                                    </p>
                                )}

                                {company.tax_id && (
                                    <div className="flex items-center gap-2 pt-2">
                                        <Hash className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">
                                            {company.tax_id}
                                        </span>
                                        <span className="text-xs text-muted-foreground">(Tax ID)</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CompanyDetails;

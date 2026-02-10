import React from 'react';
import { Company } from '@/types/company';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Mail, Phone, MapPin, Building2, Eye, RefreshCw, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

interface CompaniesListProps {
  companies: Company[];
  onEdit: (company: Company) => void;
  onView: (company: Company) => void;
  onInactivate: (company: Company) => void;
  onActivate: (company: Company) => void;
  onDelete?: (company: Company) => void;
  isLoading: boolean;
  isError: boolean;
  title?: string;
  viewMode?: 'list' | 'card' | 'grid';
}

const CompaniesList: React.FC<CompaniesListProps> = ({
  companies,
  onEdit,
  onView,
  onInactivate,
  onActivate,
  onDelete,
  isLoading,
  isError,
  title = "Existing Companies",
  viewMode = 'list'
}) => {
  const { user } = useAuth();
  const isSuperuser = user?.is_superuser;

  if (isLoading) return <p>Loading companies...</p>;
  if (isError) return <p className="text-destructive">Error loading companies.</p>;

  const CompanyActions = ({ company, isActive }: { company: Company, isActive: boolean }) => (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => { e.stopPropagation(); onView(company); }}
        title="View Details"
      >
        <Eye className="h-4 w-4" />
      </Button>

      {isActive ? (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); onEdit(company); }}
            title="Edit"
          >
            <span className="sr-only">Edit</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); onInactivate(company); }}
            className="text-destructive hover:text-destructive"
            title="Inactivate"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => { e.stopPropagation(); onActivate(company); }}
          className="text-green-600 hover:text-green-700"
          title="Activate"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}

      {isSuperuser && onDelete && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => { e.stopPropagation(); onDelete(company); }}
          className="text-red-700 hover:text-red-900 hover:bg-red-100"
          title="Hard Delete (Superuser)"
        >
          <ShieldAlert className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  if (viewMode === 'grid') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {companies.map((company) => {
              const isActive = company.is_active !== false;
              return (
                <div
                  key={company.id}
                  className={`p-4 border rounded-lg flex flex-col items-center text-center gap-2 transition-colors ${isActive ? 'hover:bg-muted/50' : 'bg-muted/30 opacity-75'}`}
                  onClick={() => isActive && onEdit(company)}
                >
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                    {company.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 w-full">
                    <h3 className="font-semibold truncate" title={company.name}>{company.name}</h3>
                    {company.ucid && <p className="text-xs text-muted-foreground font-mono">{company.ucid}</p>}
                  </div>
                  <div className="mt-auto pt-2 flex justify-center">
                    <CompanyActions company={company} isActive={isActive} />
                  </div>
                </div>
              )
            })}
          </div>
          {companies.length === 0 && (
            <p className="text-muted-foreground text-center py-8">No companies found.</p>
          )}
        </CardContent>
      </Card>
    )
  }

  if (viewMode === 'card') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((company) => {
              const isActive = company.is_active !== false;
              return (
                <div
                  key={company.id}
                  className={`p-4 border rounded-lg flex flex-col gap-3 transition-colors ${isActive ? 'hover:bg-muted/50' : 'bg-muted/30 opacity-75'}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {company.name.substring(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold">{company.name}</h3>
                        {company.ucid && <Badge variant="outline" className="font-mono text-[10px]">{company.ucid}</Badge>}
                      </div>
                    </div>
                    {!isActive && <Badge variant="secondary">Inactive</Badge>}
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground flex-1">
                    {company.industry && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3 w-3" />
                        <span>{company.industry}</span>
                      </div>
                    )}
                    {company.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        <span>{company.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-2 border-t mt-2">
                    <CompanyActions company={company} isActive={isActive} />
                  </div>
                </div>
              )
            })}
          </div>
          {companies.length === 0 && (
            <p className="text-muted-foreground text-center py-8">No companies found.</p>
          )}
        </CardContent>
      </Card>
    )
  }

  // Default List View
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {companies.map((company) => {
            const isActive = company.is_active !== false;
            return (
              <li
                key={company.id}
                className={`p-4 border rounded-lg transition-colors ${isActive ? 'hover:bg-muted/50' : 'bg-muted/30 opacity-75'}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 cursor-pointer" onClick={() => isActive && onEdit(company)}>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className={`font-semibold text-lg ${isActive ? 'hover:underline' : ''}`}>{company.name}</h3>
                      {company.ucid && (
                        <Badge variant="outline" className="font-mono text-xs">
                          {company.ucid}
                        </Badge>
                      )}
                      {!isActive && (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {company.industry && (
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          <span>{company.industry}</span>
                        </div>
                      )}
                      {company.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span>{company.email}</span>
                        </div>
                      )}
                      {company.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{company.phone}</span>
                        </div>
                      )}
                      {(company.city || company.state) && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>
                            {[company.city, company.state].filter(Boolean).join(', ')}
                            {company.country && `, ${company.country}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <CompanyActions company={company} isActive={isActive} />
                </div>
              </li>
            );
          })}
        </ul>
        {companies.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No companies found.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default CompaniesList;

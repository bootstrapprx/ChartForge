// frontend/src/pages/organizer/OrganizerReviewPage.tsx
import React from 'react';
import { useGetMemory, useGetRules } from '@/hooks/api/useOrganizer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { BrainCircuit, Gavel } from 'lucide-react';

const OrganizerReviewPage = () => {
  const { data: memory, isLoading: isLoadingMemory } = useGetMemory();
  const { data: rules, isLoading: isLoadingRules } = useGetRules();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Organizer AI - Review</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2"><BrainCircuit /> <span>Learned Memory</span></CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingMemory && <Skeleton className="h-48" />}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Parent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memory?.map(mem => (
                <TableRow key={mem.id}>
                  <TableCell>{mem.text}</TableCell>
                  <TableCell>{mem.chosen_category}</TableCell>
                  <TableCell>{mem.chosen_parent}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2"><Gavel /> <span>Dynamic Rules</span></CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingRules && <Skeleton className="h-48" />}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pattern</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Confidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules?.map(rule => (
                <TableRow key={rule.id}>
                  <TableCell>{rule.rule_pattern}</TableCell>
                  <TableCell>{rule.suggested_category}</TableCell>
                  <TableCell>{(rule.confidence * 100).toFixed(0)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizerReviewPage;
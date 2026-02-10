// frontend/src/components/masterchart/MasterChartStats.tsx
import React from 'react';
import { MasterChartStats as Stats } from '@/types/masterchart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Users, AlertTriangle, GitBranch } from 'lucide-react';

interface MasterChartStatsProps {
  stats: Stats;
  isLoading: boolean;
}

const StatCard = ({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

const MasterChartStats: React.FC<MasterChartStatsProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="h-24 bg-muted rounded-lg animate-pulse"></div>
            <div className="h-24 bg-muted rounded-lg animate-pulse"></div>
            <div className="h-24 bg-muted rounded-lg animate-pulse"></div>
            <div className="h-24 bg-muted rounded-lg animate-pulse"></div>
        </div>
    );
  }

  if (!stats) {
    return <div className="text-center text-muted-foreground py-8">Could not load statistics.</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Total Accounts" value={stats.total_accounts} icon={<BarChart className="h-4 w-4 text-muted-foreground" />} />
      <StatCard title="Header Accounts" value={stats.header_count} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
      <StatCard title="Detail Accounts" value={stats.detail_count} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
      <StatCard title="Orphan Accounts" value={stats.orphans} icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />} />
    </div>
  );
};

export default MasterChartStats;

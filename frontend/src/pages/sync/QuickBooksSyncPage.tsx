// frontend/src/pages/sync/QuickBooksSyncPage.tsx
import React from 'react';
import { useQuickBooksStatus, useQuickBooksAuthorize, useQuickBooksDisconnect, useFetchQBOAccounts } from '@/hooks/api/useQuickBooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link, Power, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const QuickBooksSyncPage = () => {
  const { data: status, isLoading: isLoadingStatus, refetch } = useQuickBooksStatus();
  const { refetch: authorize, isFetching: isAuthorizing } = useQuickBooksAuthorize();
  const disconnectMutation = useQuickBooksDisconnect();
  const fetchAccountsMutation = useFetchQBOAccounts();
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      const { data } = await authorize();
      if (data?.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } catch (error: any) {
      toast({ title: 'Error', description: `Could not get authorization URL: ${error.message}`, variant: 'destructive' });
    }
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate(undefined, {
        onSuccess: () => {
            toast({ title: 'Disconnected from QuickBooks' });
            refetch();
        }
    });
  };
  
  const handleFetchAccounts = () => {
    fetchAccountsMutation.mutate(undefined, {
        onSuccess: (data) => {
            toast({ title: 'Success', description: `Fetched ${data.length} accounts from QuickBooks.` });
        }
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">QuickBooks Online Sync</h1>
      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingStatus && <div className="h-10 bg-muted rounded animate-pulse" />}
          {status && (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                {status.is_connected ? (
                  <>
                    <Badge variant="success">Connected</Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      Connected to: <span className="font-semibold">{status.company_name}</span>
                    </p>
                  </>
                ) : (
                  <Badge variant="destructive">Not Connected</Badge>
                )}
              </div>
              {status.is_connected ? (
                <Button variant="destructive" onClick={handleDisconnect} disabled={disconnectMutation.isPending}>
                    <Power className="h-4 w-4 mr-2" />
                    Disconnect
                </Button>
              ) : (
                <Button onClick={handleConnect} disabled={isAuthorizing}>
                    <Link className="h-4 w-4 mr-2" />
                    Connect to QuickBooks
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {status?.is_connected && (
        <Card>
            <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>Perform actions with your connected QuickBooks account.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleFetchAccounts} disabled={fetchAccountsMutation.isPending}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {fetchAccountsMutation.isPending ? 'Fetching...' : 'Fetch Accounts from QBO'}
                </Button>
            </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuickBooksSyncPage;
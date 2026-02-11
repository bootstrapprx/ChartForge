"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ArrowLeft, AlertCircle } from "lucide-react";
import { useEffect } from "react";

const NotFound = () => {
  const pathname = usePathname();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", pathname);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <AlertCircle className="h-24 w-24 text-destructive" />
                <div className="absolute -top-2 -right-2 bg-background rounded-full p-1">
                  <span className="text-4xl font-bold text-muted-foreground">404</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">404 - Page Not Found</h1>
              <p className="text-muted-foreground">
                Oops! The page you're looking for doesn't exist.
              </p>
              <p className="text-sm text-muted-foreground">
                The page you are looking for does not exist.
              </p>
            </div>

            <div className="pt-4 space-y-3">
              <Link href="/" className="block">
                <Button className="w-full">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Home
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                If you believe this is an error, please contact support.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;

import { Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, AlertTriangle, RefreshCw, Code } from "lucide-react";

const ServerError = () => {
  useEffect(() => {
    console.error("500 Error: Internal server error occurred");
  }, []);

  return (
    <div className="dark min-h-screen bg-gradient-to-br from-destructive/10 via-background to-secondary/10">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Code className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              IntelEval
            </h1>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-2">
              <Home className="h-4 w-4" />
              Home
            </Button>
          </Link>
        </div>
      </header>

      {/* 500 Content */}
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4">
        <Card className="w-full max-w-lg border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            <CardTitle className="text-4xl font-bold text-destructive">500</CardTitle>
            <p className="text-xl text-muted-foreground mt-2">Internal Server Error</p>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="space-y-2">
              <p className="text-muted-foreground">
                Something went wrong on our end. We're working to fix it.
              </p>
              <p className="text-sm text-muted-foreground/80">
                Please try again in a few moments.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/">
                <Button className="w-full sm:w-auto gap-2">
                  <Home className="h-4 w-4" />
                  Go to Home
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reload Page
              </Button>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">Need help?</p>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <Link 
                  to="/help-center" 
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  → Visit Help Center
                </Link>
                <Link 
                  to="/contact" 
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  → Contact Support
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ServerError;

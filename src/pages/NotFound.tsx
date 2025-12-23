import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Search, ArrowLeft, Code } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="dark min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
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

      {/* 404 Content */}
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4">
        <Card className="w-full max-w-lg border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Search className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-4xl font-bold text-primary">404</CardTitle>
            <p className="text-xl text-muted-foreground mt-2">Page Not Found</p>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="space-y-2">
              <p className="text-muted-foreground">
                The page you're looking for doesn't exist or has been moved.
              </p>
              <p className="text-sm text-muted-foreground/80">
                Requested path: <code className="bg-muted px-2 py-1 rounded text-xs">{location.pathname}</code>
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
                onClick={() => window.history.back()}
                className="w-full sm:w-auto gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">Looking for something specific?</p>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <Link 
                  to="/auth" 
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  → Sign In / Sign Up
                </Link>
                <Link 
                  to="/dashboard" 
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  → Dashboard
                </Link>
                <Link 
                  to="/help-center" 
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  → Help Center
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotFound;

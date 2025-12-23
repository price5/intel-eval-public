import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronRight, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const HelpArticle = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();

  return (
    <div className="dark min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            IntelEval
          </Link>
          <Button variant="ghost" onClick={() => navigate("/help-center")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Help Center
          </Button>
        </div>
      </header>

      {/* Article Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Home className="w-4 h-4" />
          <ChevronRight className="w-4 h-4" />
          <Link to="/help-center" className="hover:text-foreground transition-colors">
            Help Center
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground capitalize">{articleId?.replace(/-/g, ' ')}</span>
        </div>

        {/* Article Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-3xl">
              {articleId?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
              <p className="text-lg text-center text-muted-foreground">
                📝 Article content coming soon
              </p>
            </div>
            
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground">
                This article is currently being prepared. Check back soon for detailed information and step-by-step guides.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Help CTA */}
        <Card>
          <CardContent className="py-8 text-center">
            <h3 className="text-xl font-semibold mb-2">Was this article helpful?</h3>
            <p className="text-muted-foreground mb-4">
              Let us know if you need more information
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline">👍 Yes</Button>
              <Button variant="outline">👎 No</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HelpArticle;

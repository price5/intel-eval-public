import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Home, Terminal } from "lucide-react";

const API = () => {
  return (
    <div className="dark min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Code className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              IntelEval
            </h1>
          </Link>
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-2">
              <Home className="h-4 w-4" />
              Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Terminal className="h-16 w-16 text-primary mb-6" />
          <h1 className="text-4xl md:text-6xl font-bold mb-6">API Documentation</h1>
          <p className="text-xl text-muted-foreground mb-12">
            Integrate IntelEval's powerful evaluation capabilities into your applications
          </p>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
              <CardDescription>
                Our API is currently in development and will be available soon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                The IntelEval API will allow you to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Submit code for automated evaluation</li>
                <li>Retrieve assessment results and feedback</li>
                <li>Manage assessments programmatically</li>
                <li>Access leaderboard and ranking data</li>
                <li>Integrate IntelEval into your learning management system</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interested in Early Access?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                If you're interested in early access to our API or would like to discuss
                custom integration options, please reach out to our team.
              </p>
              <Link to="/contact">
                <Button>Contact Us</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default API;

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Home, Users, MessageCircle, Github } from "lucide-react";

const Community = () => {
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
        <div className="max-w-4xl mx-auto text-center">
          <Users className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Join Our Community</h1>
          <p className="text-xl text-muted-foreground mb-12">
            Connect with students, educators, and developers using IntelEval
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card>
              <CardHeader>
                <MessageCircle className="h-10 w-10 text-primary mb-2 mx-auto" />
                <CardTitle>Discord Community</CardTitle>
                <CardDescription>
                  Join our Discord server to chat with other users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Join Discord (Coming Soon)
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Github className="h-10 w-10 text-primary mb-2 mx-auto" />
                <CardTitle>GitHub Discussions</CardTitle>
                <CardDescription>
                  Share feedback and feature requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Visit GitHub (Coming Soon)
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="text-left">
            <CardHeader>
              <CardTitle>Community Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Our community is built on respect, collaboration, and learning. We ask all members to:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Be respectful and constructive in all interactions</li>
                <li>Help others learn and grow</li>
                <li>Share knowledge and experiences</li>
                <li>Report inappropriate behavior</li>
                <li>Follow our code of conduct</li>
              </ul>
            </CardContent>
          </Card>

          <div className="mt-12">
            <Link to="/contact">
              <Button size="lg">Get in Touch</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Community;

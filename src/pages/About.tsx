import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Home, Target, Users, Lightbulb } from "lucide-react";

const About = () => {
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
          <h1 className="text-4xl md:text-6xl font-bold mb-6">About IntelEval</h1>
          <p className="text-xl text-muted-foreground mb-12">
            Transforming coding education through intelligent assessment and AI-powered evaluation
          </p>

          <div className="prose prose-lg dark:prose-invert max-w-none mb-16">
            <p>
              IntelEval is an innovative code assessment platform that combines artificial intelligence
              with intuitive design to create comprehensive evaluation systems for coding education.
              We believe that true understanding comes from both writing functional code and being
              able to explain the reasoning behind it.
            </p>
            <p>
              Our platform evaluates students on two dimensions: code quality and explanation depth,
              creating the IntelEval Index—a unified intelligence metric that captures complete
              understanding of programming concepts.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <Card>
              <CardHeader>
                <Target className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To provide educators with powerful, fair, and comprehensive evaluation systems
                  that help students learn, grow, and excel in their coding journey.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Lightbulb className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  A future where every student receives personalized, intelligent feedback that
                  accelerates their learning and builds deep understanding of programming concepts.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Our Values</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Innovation, fairness, transparency, and a commitment to educational excellence
                  drive everything we do at IntelEval.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-muted-foreground mb-6">
              Join thousands of students and instructors using IntelEval
            </p>
            <Link to="/auth">
              <Button size="lg">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default About;

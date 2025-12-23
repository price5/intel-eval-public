import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Home, Briefcase } from "lucide-react";

const Careers = () => {
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
          <Briefcase className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Join Our Team</h1>
          <p className="text-xl text-muted-foreground mb-12">
            Help us transform coding education through intelligent assessment
          </p>

          <Card className="text-left mb-12">
            <CardHeader>
              <CardTitle>Why IntelEval?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                At IntelEval, we're building the future of educational technology. We combine
                cutting-edge AI with intuitive design to create assessment tools that truly
                help students learn and grow.
              </p>
              <p>
                We're a team of passionate educators, engineers, and designers who believe
                that technology can make education more accessible, fair, and effective.
              </p>
            </CardContent>
          </Card>

          <Card className="text-left mb-12">
            <CardHeader>
              <CardTitle>Open Positions</CardTitle>
              <CardDescription>We're always looking for talented individuals</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Currently, we don't have any open positions, but we're always interested in
                connecting with talented individuals who are passionate about education technology.
                Feel free to reach out with your resume and a note about why you'd like to join us.
              </p>
            </CardContent>
          </Card>

          <Link to="/contact">
            <Button size="lg">Get in Touch</Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Careers;

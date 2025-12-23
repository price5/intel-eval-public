import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Brain, TrendingUp, Trophy, Target, Zap, CheckCircle2, ArrowLeft } from "lucide-react";

const Docs = () => {
  return (
    <div className="dark min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center transition-transform group-hover:scale-105">
              <Code className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">IntelEval</span>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-6 py-16 max-w-5xl">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            How IntelEval <span className="text-primary">Works</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A comprehensive guide to understanding our AI-powered assessment platform
          </p>
        </div>

        {/* Getting Started */}
        <section className="mb-16">
          <Card className="border-primary/20">
            <CardHeader>
              <Target className="w-12 h-12 text-primary mb-4" />
              <CardTitle className="text-3xl">Getting Started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p className="text-lg">
                IntelEval is designed for both instructors and students. Here's how to get started:
              </p>
              <ol className="list-decimal list-inside space-y-3 ml-4">
                <li className="text-base"><strong>Create an Account:</strong> Sign up with your email and choose your role (student or instructor)</li>
                <li className="text-base"><strong>Complete Your Profile:</strong> Add your details including name, college, and USN</li>
                <li className="text-base"><strong>Join or Create Assessments:</strong> Students can take assessments, instructors can create them</li>
                <li className="text-base"><strong>Track Progress:</strong> Monitor your scores, streaks, and league progression</li>
              </ol>
            </CardContent>
          </Card>
        </section>

        {/* The IntelEval Index */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">The IntelEval Index</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <Code className="w-10 h-10 text-blue-500 mb-4" />
                <CardTitle className="text-2xl">Code Scoring</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base space-y-3">
                  <p>Our AI evaluates your code based on:</p>
                  <ul className="list-disc list-inside space-y-2 ml-2">
                    <li>Correctness and functionality</li>
                    <li>Code efficiency and optimization</li>
                    <li>Best practices and conventions</li>
                    <li>Code structure and readability</li>
                  </ul>
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Brain className="w-10 h-10 text-purple-500 mb-4" />
                <CardTitle className="text-2xl">Explanation Scoring</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base space-y-3">
                  <p>Your explanation is evaluated on:</p>
                  <ul className="list-disc list-inside space-y-2 ml-2">
                    <li>Clarity and coherence</li>
                    <li>Technical accuracy</li>
                    <li>Depth of understanding</li>
                    <li>Logical reasoning</li>
                  </ul>
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* League & Progression System */}
        <section className="mb-16">
          <Card className="border-primary/20">
            <CardHeader>
              <Trophy className="w-12 h-12 text-primary mb-4" />
              <CardTitle className="text-3xl">League & Progression System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p className="text-lg">
                IntelEval features a unique progression system where you advance one rank every 30 days:
              </p>
              <div className="space-y-6 mt-6">
                <div>
                  <h4 className="font-semibold text-lg mb-2 text-foreground">Leagues (in order)</h4>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><span className="font-medium" style={{ color: '#C0C0C0' }}>Silver League</span> - Starting league for all users</li>
                    <li><span className="font-medium" style={{ color: '#FFD700' }}>Gold League</span> - Advanced progression tier</li>
                    <li><span className="font-medium" style={{ color: '#E5E4E2' }}>Platinum League</span> - Elite performance level</li>
                    <li><span className="font-medium" style={{ color: '#50C878' }}>Emerald League</span> - Mastery tier</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2 text-foreground">Rank Titles</h4>
                  <p className="mb-2">Apprentice → Scholar → Architect → Strategist → Visionary → Mastermind</p>
                  <p className="text-sm italic">Note: Higher leagues skip lower ranks (e.g., Gold starts at Scholar)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Features */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Key Features</h2>
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <Zap className="w-10 h-10 text-yellow-500 mb-4" />
                <CardTitle className="text-2xl">Real-Time Code Execution</CardTitle>
                <CardDescription className="text-base">
                  Test your code instantly with our secure execution environment supporting multiple programming languages
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="w-10 h-10 text-green-500 mb-4" />
                <CardTitle className="text-2xl">Progress Tracking</CardTitle>
                <CardDescription className="text-base">
                  Monitor your improvement over time with detailed analytics, streak tracking, and achievement unlocks
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Trophy className="w-10 h-10 text-orange-500 mb-4" />
                <CardTitle className="text-2xl">Competitive Leaderboards</CardTitle>
                <CardDescription className="text-base">
                  Compete globally or within your class based on your IntelEval Index scores
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center py-16">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CheckCircle2 className="w-12 h-12 text-primary mb-4 mx-auto" />
              <CardTitle className="text-3xl">Ready to Get Started?</CardTitle>
              <CardDescription className="text-lg">
                Join thousands of students and instructors using IntelEval to elevate coding education
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 justify-center mt-6">
                <Link to="/auth">
                  <Button size="lg" className="text-lg px-8">
                    Sign Up Now
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button size="lg" variant="outline" className="text-lg px-8">
                    Contact Us
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Docs;

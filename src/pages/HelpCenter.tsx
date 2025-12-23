import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, BookOpen, Users, MessageSquare, GraduationCap, Code, Shield, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SupportCategory {
  id: string;
  title: string;
  description: string;
  icon: any;
  link: string;
}

const supportCategories: SupportCategory[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Learn the basics of IntelEval and set up your first assessment",
    icon: GraduationCap,
    link: "/help-center/getting-started"
  },
  {
    id: "assessments",
    title: "Assessments & Practice",
    description: "Create, manage, and understand coding assessments and practice sessions",
    icon: Code,
    link: "/help-center/assessments"
  },
  {
    id: "chat-messaging",
    title: "Chat & Messaging",
    description: "Use the real-time chat system to collaborate with peers and instructors",
    icon: MessageSquare,
    link: "/help-center/chat"
  },
  {
    id: "account-security",
    title: "Account & Security",
    description: "Manage your profile, settings, and account security features",
    icon: Shield,
    link: "/help-center/account"
  },
  {
    id: "leaderboard-achievements",
    title: "Leaderboard & Achievements",
    description: "Track your progress, earn achievements, and climb the ranks",
    icon: Users,
    link: "/help-center/achievements"
  },
  {
    id: "instructor-tools",
    title: "Instructor Tools",
    description: "Advanced features for creating and managing student assessments",
    icon: BookOpen,
    link: "/help-center/instructor"
  }
];

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const filteredCategories = supportCategories.filter(category =>
    category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dark min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            IntelEval
          </Link>
          <Button variant="ghost" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </header>

      {/* Hero Section with Search */}
      <section className="bg-gradient-to-b from-card/50 to-background py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Help & Support
          </h1>
          <p className="text-xl text-muted-foreground mb-10">
            Find answers, learn new skills, and get the most out of IntelEval
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Ask anything..."
              className="pl-12 h-14 text-lg rounded-xl border-border/50 bg-card/50 backdrop-blur-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Main Support Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {filteredCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.id}
                to={category.link}
                className="group"
              >
                <Card className="h-full transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 cursor-pointer border-border/50">
                  <CardHeader className="pb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {category.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {category.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* No Results */}
        {filteredCategories.length === 0 && searchQuery && (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or browse all categories
            </p>
          </div>
        )}
      </section>

      {/* Additional Resources Section */}
      <section className="bg-card/30 border-y border-border/50 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Additional Resources</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Link to="/docs">
              <Card className="transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Documentation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Comprehensive guides and API references for developers
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
            <Link to="/community">
              <Card className="transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Community
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Connect with other users and share best practices
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Support CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Still need help?</h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Can't find what you're looking for? Our support team is here to assist you
          </p>
          <Link to="/contact">
            <Button size="lg" className="text-lg px-8">
              Contact Support
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HelpCenter;

import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, Home, BookOpen, Code, MessageSquare, Shield, Users, GraduationCap } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface CategoryInfo {
  title: string;
  description: string;
  icon: any;
  articles: {
    id: string;
    title: string;
    description: string;
  }[];
}

const categoryData: Record<string, CategoryInfo> = {
  "getting-started": {
    title: "Getting Started",
    description: "Learn the basics of IntelEval and set up your first assessment",
    icon: GraduationCap,
    articles: [
      {
        id: "setup-account",
        title: "Setting Up Your Account",
        description: "Create and configure your IntelEval account"
      },
      {
        id: "dashboard-overview",
        title: "Dashboard Overview",
        description: "Navigate through the dashboard features"
      },
      {
        id: "first-assessment",
        title: "Creating Your First Assessment",
        description: "Step-by-step guide to creating assessments"
      }
    ]
  },
  "assessments": {
    title: "Assessments & Practice",
    description: "Create, manage, and understand coding assessments and practice sessions",
    icon: Code,
    articles: [
      {
        id: "create-assessment",
        title: "Creating Assessments",
        description: "How to create and customize assessments"
      },
      {
        id: "taking-assessments",
        title: "Taking Assessments",
        description: "Guide for students taking assessments"
      },
      {
        id: "practice-mode",
        title: "Practice Mode",
        description: "Using the practice feature to improve skills"
      }
    ]
  },
  "chat": {
    title: "Chat & Messaging",
    description: "Use the real-time chat system to collaborate with peers and instructors",
    icon: MessageSquare,
    articles: [
      {
        id: "using-chat",
        title: "Using the Chat System",
        description: "Send messages and collaborate in real-time"
      },
      {
        id: "channels",
        title: "Understanding Channels",
        description: "Navigate and use different chat channels"
      },
      {
        id: "notifications",
        title: "Chat Notifications",
        description: "Manage your chat notification preferences"
      }
    ]
  },
  "account": {
    title: "Account & Security",
    description: "Manage your profile, settings, and account security features",
    icon: Shield,
    articles: [
      {
        id: "profile-settings",
        title: "Profile Settings",
        description: "Update your personal information and preferences"
      },
      {
        id: "password-security",
        title: "Password & Security",
        description: "Keep your account secure with strong passwords"
      },
      {
        id: "privacy-settings",
        title: "Privacy Settings",
        description: "Control your privacy and data sharing preferences"
      }
    ]
  },
  "achievements": {
    title: "Leaderboard & Achievements",
    description: "Track your progress, earn achievements, and climb the ranks",
    icon: Users,
    articles: [
      {
        id: "earning-achievements",
        title: "Earning Achievements",
        description: "How to unlock badges and achievements"
      },
      {
        id: "leaderboard-ranking",
        title: "Leaderboard Rankings",
        description: "Understand how rankings are calculated"
      },
      {
        id: "xp-system",
        title: "XP and Leveling",
        description: "Learn about the XP and leveling system"
      }
    ]
  },
  "instructor": {
    title: "Instructor Tools",
    description: "Advanced features for creating and managing student assessments",
    icon: BookOpen,
    articles: [
      {
        id: "student-management",
        title: "Managing Students",
        description: "Add and manage student accounts"
      },
      {
        id: "grading",
        title: "Grading Submissions",
        description: "Review and grade student submissions"
      },
      {
        id: "analytics",
        title: "Analytics & Insights",
        description: "View student performance analytics"
      }
    ]
  }
};

const HelpCategoryPage = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  
  if (!category || !categoryData[category]) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Category Not Found</h1>
          <Button onClick={() => navigate("/help-center")}>
            Back to Help Center
          </Button>
        </div>
      </div>
    );
  }

  const categoryInfo = categoryData[category];
  const Icon = categoryInfo.icon;

  return (
    <div className="dark min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            IntelEval
          </Link>
          <Button variant="ghost" onClick={() => navigate("/help-center")}>
            Back to Help Center
          </Button>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/" className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Home
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="w-4 h-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/help-center">Help Center</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="w-4 h-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>{categoryInfo.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Category Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-start gap-6 mb-12">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{categoryInfo.title}</h1>
            <p className="text-xl text-muted-foreground">{categoryInfo.description}</p>
          </div>
        </div>

        {/* Articles */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryInfo.articles.map((article) => (
            <Link
              key={article.id}
              to={`/help-center/article/${article.id}`}
              className="group"
            >
              <Card className="h-full transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between group-hover:text-primary transition-colors">
                    {article.title}
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{article.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Still Need Help */}
      <section className="bg-card/30 border-y border-border/50 py-16 px-4 mt-12">
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

export default HelpCategoryPage;

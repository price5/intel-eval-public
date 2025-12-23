import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Home, Calendar } from "lucide-react";

const Blog = () => {
  const posts = [
    {
      title: "Introducing IntelEval: The Future of Code Assessment",
      description: "Learn how our dual-scoring system is revolutionizing coding education",
      date: "January 15, 2025",
      author: "IntelEval Team"
    },
    {
      title: "Why Explanation Matters as Much as Code",
      description: "Understanding the importance of being able to explain your code",
      date: "January 10, 2025",
      author: "Dr. Sarah Johnson"
    },
    {
      title: "Gamification in Learning: Does It Really Work?",
      description: "Exploring the science behind our streak and achievement systems",
      date: "January 5, 2025",
      author: "Mark Thompson"
    }
  ];

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
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Blog</h1>
          <p className="text-xl text-muted-foreground mb-12">
            Insights, updates, and stories from the IntelEval team
          </p>

          <div className="space-y-6">
            {posts.map((post, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-2xl">{post.title}</CardTitle>
                  <CardDescription className="text-base mt-2">
                    {post.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {post.date}
                    </div>
                    <span>•</span>
                    <span>{post.author}</span>
                  </div>
                  <Button variant="link" className="mt-4 px-0">
                    Read more →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-16">
            <p className="text-muted-foreground mb-4">More articles coming soon!</p>
            <Link to="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Blog;

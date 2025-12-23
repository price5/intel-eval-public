import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Code, 
  TrendingUp, 
  Trophy, 
  Target, 
  Flame, 
  BarChart3, 
  CheckCircle2, 
  Sparkles,
  Users,
  GraduationCap,
  Zap,
  Award,
  ChevronDown,
  MessageSquare,
  FileText,
  Activity
} from "lucide-react";
import { ScrollReveal, StaggeredReveal, StaggerItem } from "@/components/ui/ScrollReveal";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuroraBackground } from "@/components/ui/aurora-background";

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth', { state: { defaultTab: 'signup' } });
    }
  };

  return (
    <div className="dark min-h-screen bg-[#0D1117] text-[#E6EDF3] overflow-hidden relative">
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08] bg-transparent backdrop-blur-lg">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
              <Code className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold">
              <span className="text-accent">Intel</span>
              <span className="text-white">Eval</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center h-12 gap-8 text-sm">
            <Link to="/" className="inline-flex items-center h-full text-[#E6EDF3] hover:text-accent transition-colors">Home</Link>
            <button onClick={() => scrollToSection('how-it-works')} className="inline-flex items-center h-full text-[#8B949E] hover:text-[#E6EDF3] transition-colors">How It Works</button>
            <button onClick={() => scrollToSection('features')} className="inline-flex items-center h-full text-[#8B949E] hover:text-[#E6EDF3] transition-colors">Features</button>
            {user ? (
              <Link to="/dashboard" className="inline-flex items-center h-full text-[#8B949E] hover:text-[#E6EDF3] transition-colors">Dashboard</Link>
            ) : (
              <Link to="/community" className="inline-flex items-center h-full text-[#8B949E] hover:text-[#E6EDF3] transition-colors">Community</Link>
            )}
            <Link to="/docs" className="inline-flex items-center h-full text-[#8B949E] hover:text-[#E6EDF3] transition-colors">Docs</Link>
          </nav>
          <div className="flex items-center gap-3">
            {!user ? (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className="text-[#E6EDF3] hover:bg-white/10">
                    Sign In
                  </Button>
                </Link>
                <Button 
                  onClick={handleGetStarted}
                  size="sm" 
                  className="bg-accent text-[#0D1117] hover:bg-accent/90 glow-cyan-hover transition-all"
                >
                  Get Started
                </Button>
              </>
            ) : (
              <Button 
                onClick={handleGetStarted}
                size="sm" 
                className="bg-accent text-[#0D1117] hover:bg-accent/90"
              >
                Go to Dashboard
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* SECTION 1 – HERO */}
      <AuroraBackground className="pt-20">
        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 text-center space-y-8">
          <ScrollReveal>
            <h1 className="text-6xl md:text-8xl font-bold text-gradient-cyan leading-tight">
              Master Code.<br />Master Clarity.
            </h1>
          </ScrollReveal>
          
          <ScrollReveal delay={0.1}>
            <p className="text-xl md:text-2xl leading-relaxed text-[#8B949E] max-w-4xl mx-auto">
              The intelligent dual-score evaluation platform that measures what truly matters — 
              your code performance and your clarity of thought.
            </p>
          </ScrollReveal>
          
          <ScrollReveal delay={0.2}>
            <div className="flex flex-wrap gap-4 justify-center pt-6">
              <Button 
                onClick={handleGetStarted}
                size="lg" 
                className="text-lg px-10 py-7 bg-accent text-[#0D1117] hover:bg-accent/90 glow-cyan-hover transition-all"
              >
                Try IntelEval
              </Button>
              <Button 
                onClick={() => scrollToSection('how-it-works')}
                size="lg" 
                variant="outline"
                className="text-lg px-10 py-7 border-[#30363D] text-[#E6EDF3] hover:bg-white/5 hover:border-accent transition-all"
              >
                Explore How It Works
              </Button>
            </div>
          </ScrollReveal>

          {/* Scroll Indicator */}
          <ScrollReveal delay={0.4}>
            <div className="flex flex-col items-center gap-2 pt-8">
              <ChevronDown className="w-6 h-6 text-[#8B949E] animate-bounce" />
            </div>
          </ScrollReveal>
        </div>
      </AuroraBackground>

      {/* SECTION 2 – WHY INTELEVAL EXISTS */}
      <section className="py-32 px-4 bg-[#161B22]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Left: Illustration/Animation */}
            <ScrollReveal>
              <div className="relative">
                <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center border border-[#30363D]">
                  <div className="text-center space-y-4">
                    <Brain className="w-24 h-24 text-accent mx-auto" />
                    <Code className="w-16 h-16 text-primary mx-auto" />
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Right: Text */}
            <div className="space-y-8">
              <ScrollReveal delay={0.1}>
                <h2 className="text-5xl md:text-6xl font-bold">
                  Beyond Code — We Evaluate <span className="text-accent">Understanding.</span>
                </h2>
              </ScrollReveal>
              
              <ScrollReveal delay={0.2}>
                <p className="text-xl text-[#8B949E] leading-relaxed">
                  Writing code is just half the story. True mastery means understanding why your solution works, 
                  articulating your thought process, and communicating clearly with your team.
                </p>
              </ScrollReveal>

              <ScrollReveal delay={0.3}>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-start gap-4">
                    <Brain className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-lg text-[#E6EDF3]">Think Better</h3>
                      <p className="text-[#8B949E]">Develop structured problem-solving approaches</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Zap className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-lg text-[#E6EDF3]">Code Smarter</h3>
                      <p className="text-[#8B949E]">Write efficient, maintainable solutions</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Trophy className="w-6 h-6 text-[#2ECC71] flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-lg text-[#E6EDF3]">Grow Faster</h3>
                      <p className="text-[#8B949E]">Track progress across multiple dimensions</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 – HOW IT WORKS */}
      <section id="how-it-works" className="py-32 px-4 bg-[#0D1117]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <ScrollReveal>
              <h2 className="text-5xl md:text-6xl font-bold mb-6">
                How IntelEval Works
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <p className="text-xl text-[#8B949E]">
                In three powerful steps.
              </p>
            </ScrollReveal>
          </div>

          <StaggeredReveal staggerDelay={0.15}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 auto-rows-fr relative">
              {/* Connecting Lines (hidden on mobile) */}
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/30 to-transparent -translate-y-1/2" />
              
              <StaggerItem>
                <Card className="relative border-[#30363D] bg-[#161B22] hover:bg-[#1C2128] transition-all hover:border-accent glow-cyan-hover flex flex-col h-full min-h-[280px]">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                      <Code className="w-8 h-8 text-accent" />
                    </div>
                    <CardTitle className="text-2xl text-[#E6EDF3]">1. Write & Explain</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex items-center">
                    <CardDescription className="text-[#8B949E] text-center text-base">
                      Solve coding challenges and provide detailed explanations of your approach and reasoning.
                    </CardDescription>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card className="relative border-[#30363D] bg-[#161B22] hover:bg-[#1C2128] transition-all hover:border-accent glow-cyan-hover flex flex-col h-full min-h-[280px]">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                      <Brain className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl text-[#E6EDF3]">2. AI Evaluates Both</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex items-center">
                    <CardDescription className="text-[#8B949E] text-center text-base">
                      Our AI analyzes your code quality and explanation clarity separately for comprehensive feedback.
                    </CardDescription>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card className="relative border-[#30363D] bg-[#161B22] hover:bg-[#1C2128] transition-all hover:border-accent glow-cyan-hover flex flex-col h-full min-h-[280px]">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                      <Target className="w-8 h-8 text-accent" />
                    </div>
                    <CardTitle className="text-2xl text-[#E6EDF3]">3. Get Your Eval Index</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex items-center">
                    <CardDescription className="text-[#8B949E] text-center text-base">
                      Receive your unified Eval Index score that reflects your complete coding mastery.
                    </CardDescription>
                  </CardContent>
                </Card>
              </StaggerItem>
            </div>
          </StaggeredReveal>
        </div>
      </section>

      {/* SECTION 4 – DUAL-SCORE SYSTEM */}
      <section className="py-32 px-4 bg-[#0C1016]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <ScrollReveal>
              <h2 className="text-5xl md:text-6xl font-bold mb-6">
                Two Scores. One Index.
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <p className="text-xl text-[#8B949E] max-w-3xl mx-auto">
                Get detailed insights into both dimensions of your coding ability.
              </p>
            </ScrollReveal>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-center">
            {/* Code Score */}
            <ScrollReveal delay={0.1}>
              <Card className="border-[#30363D] bg-[#161B22] h-full">
                <CardHeader>
                  <Code className="w-12 h-12 text-primary mb-4" />
                  <CardTitle className="text-3xl text-[#E6EDF3]">Code Score</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-[#8B949E]">
                    Measures correctness, efficiency, style, and best practices in your implementation.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />
                      <span className="text-sm text-[#8B949E]">Algorithm correctness</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />
                      <span className="text-sm text-[#8B949E]">Time & space complexity</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />
                      <span className="text-sm text-[#8B949E]">Code quality & style</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>

            {/* Center: Eval Index Meter */}
            <ScrollReveal delay={0.2}>
              <div className="flex flex-col items-center justify-center p-8">
                <div className="relative w-48 h-48 rounded-full border-8 border-accent/30 flex items-center justify-center glow-cyan">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-accent">86.5</div>
                    <div className="text-sm text-[#8B949E] mt-2">Eval Index</div>
                  </div>
                </div>
                <p className="text-center text-[#8B949E] mt-6 text-sm max-w-xs">
                  Your unified score combining code performance and explanation quality
                </p>
              </div>
            </ScrollReveal>

            {/* Explanation Score */}
            <ScrollReveal delay={0.3}>
              <Card className="border-[#30363D] bg-[#161B22] h-full">
                <CardHeader>
                  <Brain className="w-12 h-12 text-accent mb-4" />
                  <CardTitle className="text-3xl text-[#E6EDF3]">Explanation Score</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-[#8B949E]">
                    Evaluates clarity, depth, and accuracy of your problem-solving explanation.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />
                      <span className="text-sm text-[#8B949E]">Problem understanding</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />
                      <span className="text-sm text-[#8B949E]">Clarity of communication</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />
                      <span className="text-sm text-[#8B949E]">Reasoning & approach</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION 5 – STUDENTS & INSTRUCTORS */}
      <section className="py-32 px-4 bg-[#0D1117]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <ScrollReveal>
              <Card className="border-[#30363D] bg-[#161B22] hover:bg-[#1C2128] transition-all h-full">
                <CardHeader>
                  <GraduationCap className="w-16 h-16 text-accent mb-6" />
                  <CardTitle className="text-4xl text-[#E6EDF3] mb-4">For Students</CardTitle>
                  <CardDescription className="text-[#8B949E] text-lg">
                    Learn, improve, and compete with peers on a platform designed to accelerate your growth.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                    <p className="text-[#8B949E]">Interactive chat for real-time learning</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Code className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                    <p className="text-[#8B949E]">Practice mode with instant feedback</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Trophy className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                    <p className="text-[#8B949E]">Compete on leaderboards and earn achievements</p>
                  </div>
                  <Button className="mt-6 w-full bg-accent text-[#0D1117] hover:bg-accent/90" onClick={() => navigate('/dashboard')}>
                    Go to Student Dashboard
                  </Button>
                </CardContent>
              </Card>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <Card className="border-[#30363D] bg-[#161B22] hover:bg-[#1C2128] transition-all h-full">
                <CardHeader>
                  <Users className="w-16 h-16 text-primary mb-6" />
                  <CardTitle className="text-4xl text-[#E6EDF3] mb-4">For Instructors</CardTitle>
                  <CardDescription className="text-[#8B949E] text-lg">
                    Assess smarter, guide faster, and track student progress with powerful analytics.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                    <p className="text-[#8B949E]">Create and manage assessments effortlessly</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <BarChart3 className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                    <p className="text-[#8B949E]">Detailed analytics on student performance</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Activity className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                    <p className="text-[#8B949E]">Monitor progress across multiple dimensions</p>
                  </div>
                  <Button className="mt-6 w-full bg-primary text-white hover:bg-primary/90" onClick={() => navigate('/dashboard')}>
                    Go to Instructor Portal
                  </Button>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION 6 – GAMIFICATION */}
      <section id="gamification" className="py-32 px-4 bg-[#161B22]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <ScrollReveal>
              <h2 className="text-5xl md:text-6xl font-bold mb-6">
                Progress. Achieve. Dominate the <span className="text-accent">Leaderboard.</span>
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <p className="text-xl text-[#8B949E]">
                Earn streaks, climb leagues, and unlock achievements as you grow.
              </p>
            </ScrollReveal>
          </div>

          <StaggeredReveal staggerDelay={0.1}>
            <div className="grid md:grid-cols-4 gap-6">
              <StaggerItem>
                <Card className="border-[#30363D] bg-gradient-to-br from-gray-500/10 to-gray-600/10 hover:from-gray-500/20 hover:to-gray-600/20 transition-all text-center">
                  <CardHeader>
                    <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <CardTitle className="text-2xl text-gray-300">Silver</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[#8B949E] text-sm">Entry Rank</p>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card className="border-[#30363D] bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 hover:from-yellow-500/20 hover:to-yellow-600/20 transition-all text-center">
                  <CardHeader>
                    <Award className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <CardTitle className="text-2xl text-yellow-400">Gold</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[#8B949E] text-sm">Intermediate Rank</p>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card className="border-[#30363D] bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 hover:from-emerald-500/20 hover:to-emerald-600/20 transition-all text-center">
                  <CardHeader>
                    <Award className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                    <CardTitle className="text-2xl text-emerald-300">Emerald</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[#8B949E] text-sm">Advanced Rank</p>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card className="border-[#30363D] bg-gradient-to-br from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 transition-all text-center">
                  <CardHeader>
                    <Award className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                    <CardTitle className="text-2xl text-blue-300">Platinum</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[#8B949E] text-sm">Elite Rank</p>
                  </CardContent>
                </Card>
              </StaggerItem>
            </div>
          </StaggeredReveal>

          <ScrollReveal delay={0.4}>
            <div className="mt-16 text-center">
              <div className="inline-flex items-center gap-3 bg-[#0D1117] px-8 py-4 rounded-full border border-[#30363D]">
                <Flame className="w-6 h-6 text-orange-500" />
                <span className="text-[#E6EDF3]">Track your daily streak and stay consistent</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 7 – GROWTH / PROGRESS */}
      <section className="py-32 px-4 bg-[#0D1117]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <ScrollReveal>
              <div>
                <h2 className="text-5xl md:text-6xl font-bold mb-6">
                  See Your Progress <span className="text-accent">Evolve.</span>
                </h2>
                <p className="text-xl text-[#8B949E] leading-relaxed mb-8">
                  Watch your Eval Index grow over time as you consistently practice, learn, and improve. 
                  Our detailed analytics show exactly where you're excelling and where to focus next.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-accent" />
                    <span className="text-[#8B949E]">Track progress across multiple metrics</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-accent" />
                    <span className="text-[#8B949E]">Visualize improvement trends</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-accent" />
                    <span className="text-[#8B949E]">Set and achieve personal goals</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <div className="bg-[#161B22] p-8 rounded-2xl border border-[#30363D]">
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-[#8B949E] text-sm">Eval Index</span>
                      <span className="text-accent font-semibold">86.5</span>
                    </div>
                    <div className="h-2 bg-[#0D1117] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: '86.5%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-[#8B949E] text-sm">Code Score</span>
                      <span className="text-primary font-semibold">89.2</span>
                    </div>
                    <div className="h-2 bg-[#0D1117] rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: '89.2%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-[#8B949E] text-sm">Explanation Score</span>
                      <span className="text-accent font-semibold">83.8</span>
                    </div>
                    <div className="h-2 bg-[#0D1117] rounded-full overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: '83.8%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION 8 – TESTIMONIALS */}
      <section className="py-32 px-4 bg-[#161B22]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <ScrollReveal>
              <h2 className="text-5xl md:text-6xl font-bold mb-6">
                Trusted by Instructors & Learners.
              </h2>
            </ScrollReveal>
          </div>

          <StaggeredReveal staggerDelay={0.15}>
            <div className="grid md:grid-cols-2 gap-8">
              <StaggerItem>
                <Card className="border-[#30363D] bg-[#0D1117] h-full">
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#E6EDF3]">Yashraj Patil</p>
                        <p className="text-sm text-[#8B949E]">Computer Science, New Horizon College of Engineering</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[#8B949E] italic">
                      "IntelEval helped me realize that explaining my code is just as important as writing it. 
                      The instant feedback on both aspects pushed my skills to the next level and boosted my confidence."
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card className="border-[#30363D] bg-[#0D1117] h-full">
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                        <GraduationCap className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#E6EDF3]">Fahad</p>
                        <p className="text-sm text-[#8B949E]">Computer Science, New Horizon College of Engineering</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[#8B949E] italic">
                      "The dual-score system made me think differently about problem-solving. Now I focus on writing 
                      clear, efficient code and articulating my thought process better. The leaderboard keeps me motivated!"
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>
            </div>
          </StaggeredReveal>
        </div>
      </section>

      {/* SECTION 9 – FINAL CTA */}
      <section className="py-32 px-4 bg-gradient-to-br from-primary to-accent relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <ScrollReveal>
            <h2 className="text-5xl md:text-7xl font-bold mb-6 text-white">
              Start mastering both code and clarity.
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <p className="text-xl text-white/90 mb-12">
              Join thousands of learners and instructors who are elevating their coding journey.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button 
                onClick={handleGetStarted}
                size="lg" 
                className="text-lg px-12 py-7 bg-white text-[#0D1117] hover:bg-white/90"
              >
                Try IntelEval Free
              </Button>
              <Link to="/auth">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-lg px-12 py-7 border-2 border-white text-white hover:bg-white/10"
                >
                  Sign In to Dashboard
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
};

export default Home;

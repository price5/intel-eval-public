import { Code, TrendingUp, Trophy, Target, Flame, BarChart3 } from "lucide-react";

const features = [
  { icon: Code, title: "Code Scoring", desc: "AI-powered code evaluation" },
  { icon: TrendingUp, title: "Explanation Scoring", desc: "Assess your reasoning" },
  { icon: Target, title: "IntelEval Index", desc: "Combined intelligence score" },
  { icon: Trophy, title: "Leaderboard", desc: "Compete with peers" },
  { icon: Flame, title: "Streak System", desc: "Daily progress tracking" },
  { icon: BarChart3, title: "Analytics", desc: "Track your growth" },
];

export const MarqueeFeatures = () => {
  return (
    <div className="relative overflow-hidden py-12">
      <div className="flex animate-marquee gap-6">
        {/* Duplicate for seamless loop */}
        {[...features, ...features].map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="flex-shrink-0 w-72 p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm text-white/60">{feature.desc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

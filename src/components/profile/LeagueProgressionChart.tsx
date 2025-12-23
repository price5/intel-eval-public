import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Award, Sparkles, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

export const LeagueProgressionChart: React.FC = () => {
  const leagues = [
    {
      name: 'Silver',
      color: '#C0C0C0',
      glowColor: 'rgba(192, 192, 192, 0.3)',
      icon: '🥈',
      ranks: ['Apprentice', 'Scholar', 'Architect', 'Strategist', 'Visionary', 'Mastermind'],
      days: '0-179 days'
    },
    {
      name: 'Gold',
      color: '#FFD700',
      glowColor: 'rgba(255, 215, 0, 0.3)',
      icon: '🥇',
      ranks: ['Scholar', 'Architect', 'Strategist', 'Visionary', 'Mastermind'],
      days: '180-329 days'
    },
    {
      name: 'Emerald',
      color: '#50C878',
      glowColor: 'rgba(80, 200, 120, 0.3)',
      icon: '💚',
      ranks: ['Architect', 'Strategist', 'Visionary', 'Mastermind'],
      days: '330-449 days'
    },
    {
      name: 'Platinum',
      color: '#5DADE2',
      glowColor: 'rgba(93, 173, 226, 0.3)',
      icon: '💎',
      ranks: ['Strategist', 'Visionary', 'Mastermind'],
      days: '450+ days'
    }
  ];

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Trophy className="w-5 h-5 text-primary" />
          League & Rank Progression
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Advance one rank every 30 days. Progress through all leagues to reach Platinum Mastermind!
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {leagues.map((league, idx) => (
          <motion.div
            key={league.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-4 rounded-lg border-2 relative overflow-hidden"
            style={{
              borderColor: league.color + '60',
              background: `linear-gradient(135deg, ${league.color}10, transparent)`
            }}
          >
            <div 
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${league.glowColor}, transparent 70%)`
              }}
            />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{league.icon}</span>
                  <div>
                    <h3 
                      className="font-bold text-lg"
                      style={{ color: league.color }}
                    >
                      {league.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">{league.days}</p>
                  </div>
                </div>
                <Crown className="w-5 h-5" style={{ color: league.color }} />
              </div>
              
              <div className="flex flex-wrap gap-2">
                {league.ranks.map((rank, rankIdx) => (
                  <div
                    key={rank}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border"
                    style={{
                      backgroundColor: league.color + '15',
                      borderColor: league.color + '40'
                    }}
                  >
                    <Award className="w-3 h-3" style={{ color: league.color }} />
                    <span 
                      className="text-sm font-medium"
                      style={{ color: league.color }}
                    >
                      {rank}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({rankIdx * 30}-{(rankIdx + 1) * 30 - 1}d)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}

        <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm mb-1">How It Works</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Advance one rank every 30 days automatically</li>
                <li>• Complete all ranks in a league to move to the next league</li>
                <li>• Each new league starts at a higher base rank</li>
                <li>• Platinum Mastermind is the highest achievable rank</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

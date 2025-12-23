import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trophy, Clock, Star, HelpCircle, TrendingDown, ChevronUp, ChevronDown, Zap } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

interface LeagueMembership {
  id: string;
  user_id: string;
  week_xp: number;
  final_rank: number | null;
  promotion_status: 'promoted' | 'stayed' | 'demoted' | 'pending';
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface WeeklyLeague {
  id: string;
  tier: string;
  league_number: number;
  week_start: string;
  week_end: string;
  is_active: boolean;
}

interface UserLeagueInfo {
  league: WeeklyLeague;
  membership: LeagueMembership;
  rank: number;
  totalUsers: number;
}

const TIER_CONFIG = {
  initiate: { name: 'Initiate', color: '#9CA3AF', icon: '🌱', gradient: 'from-gray-400 to-gray-500' },
  thinker: { name: 'Thinker', color: '#60A5FA', icon: '💎', gradient: 'from-blue-400 to-blue-500' },
  strategist: { name: 'Strategist', color: '#A78BFA', icon: '⚔️', gradient: 'from-purple-400 to-purple-500' },
  analyst: { name: 'Analyst', color: '#F59E0B', icon: '🔥', gradient: 'from-amber-400 to-amber-500' },
  prodigy: { name: 'Prodigy', color: '#EC4899', icon: '✨', gradient: 'from-pink-400 to-pink-500' },
  mastermind: { name: 'Mastermind', color: '#8B5CF6', icon: '👑', gradient: 'from-violet-400 to-violet-500' },
};

export const WeeklyLeaderboardTab: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userLeagueInfo, setUserLeagueInfo] = useState<UserLeagueInfo | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeagueMembership[]>([]);
  const previousRankRef = useRef<number | null>(null);
  const confettiTriggeredRef = useRef(false);
  const previousLeaderboardRef = useRef<LeagueMembership[]>([]);

  useEffect(() => {
    if (user) {
      fetchLeagueData();
    }

    // Subscribe to realtime updates
    if (user) {
      const channel = supabase
        .channel('league-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'league_memberships',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchLeagueData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchLeagueData = async () => {
    try {
      setLoading(true);

      // Get user's current league membership by joining active leagues
      const { data: membership, error: membershipError } = await supabase
        .from('league_memberships')
        .select(`
          *,
          profiles (username, full_name, avatar_url),
          weekly_leagues!inner (id, tier, league_number, week_start, week_end, is_active)
        `)
        .eq('user_id', user!.id)
        .eq('weekly_leagues.is_active', true)
        .maybeSingle();

      if (membershipError) throw membershipError;

      if (!membership || !membership.week_xp || membership.week_xp === 0) {
        setUserLeagueInfo(null);
        setLeaderboard([]);
        return;
      }

      const league = (membership as any).weekly_leagues as WeeklyLeague;

      // Get all members in this league (only users with XP > 0)
      const { data: allMembers, error: membersError } = await supabase
        .from('league_memberships')
        .select(`
          *,
          profiles (username, full_name, avatar_url)
        `)
        .eq('league_id', (membership as any).league_id)
        .gt('week_xp', 0)
        .order('week_xp', { ascending: false });

      if (membersError) throw membersError;

      // Find user's rank
      const userRank = allMembers.findIndex(m => m.user_id === user!.id) + 1;
      
      // Track rank changes and trigger confetti for promotions
      if (previousRankRef.current !== null && previousRankRef.current !== userRank) {
        const { promotionCount } = getPromotionZones(league.tier, allMembers.length);
        
        // Trigger confetti for entering promotion zone
        if (userRank <= promotionCount && !confettiTriggeredRef.current) {
          triggerConfetti();
          confettiTriggeredRef.current = true;
        }
        
        // Show notification when someone passes the user
        if (userRank > previousRankRef.current && previousLeaderboardRef.current.length > 0) {
          // Find who is now at the user's previous rank
          const userWhoPassed = allMembers[previousRankRef.current - 1];
          if (userWhoPassed && userWhoPassed.user_id !== user!.id) {
            const xpDifference = userWhoPassed.week_xp - (allMembers.find(m => m.user_id === user!.id)?.week_xp || 0);
            toast.custom((t) => (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-card border border-border rounded-lg shadow-lg p-4 flex items-center gap-3 max-w-md"
              >
                <Avatar className="h-10 w-10 ring-2 ring-red-500">
                  <AvatarImage src={userWhoPassed.profiles.avatar_url || undefined} />
                  <AvatarFallback>{userWhoPassed.profiles.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-semibold text-sm flex items-center gap-1">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    {userWhoPassed.profiles.username} passed you!
                  </div>
                  <div className="text-xs text-muted-foreground">
                    +{xpDifference} XP ahead • You're now #{userRank}
                  </div>
                </div>
              </motion.div>
            ), { duration: 5000 });
          }
        }
      }
      previousRankRef.current = userRank;
      previousLeaderboardRef.current = allMembers as LeagueMembership[];

      setUserLeagueInfo({
        league,
        membership: membership as LeagueMembership,
        rank: userRank,
        totalUsers: allMembers.length
      });

      setLeaderboard(allMembers as LeagueMembership[]);
    } catch (error) {
      console.error('Error fetching league data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRemainingTime = () => {
    if (!userLeagueInfo) return '';
    const now = new Date();
    const weekEnd = new Date(userLeagueInfo.league.week_end);
    const diff = weekEnd.getTime() - now.getTime();
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days} ${days === 1 ? 'day' : 'days'}`;
    } else if (hours > 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    } else {
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    }
  };

  const getPromotionZones = (tier: string, total: number) => {
    // Top 25% get promoted, bottom 25% get demoted
    const promotionCount = Math.max(1, Math.floor(total * 0.25));
    const demotionCount = Math.max(1, Math.floor(total * 0.25));
    const demotionThreshold = total - demotionCount;
    
    return { promotionCount, safeCount: total - promotionCount - demotionCount, demotionThreshold };
  };

  const getZoneColor = (rank: number, tier: string, total: number) => {
    const { promotionCount, demotionThreshold } = getPromotionZones(tier, total);
    
    if (rank <= promotionCount) {
      return 'text-green-600 dark:text-green-400';
    }
    if (rank > demotionThreshold) {
      return 'text-red-600 dark:text-red-400';
    }
    return 'text-foreground';
  };

  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userLeagueInfo) {
    return (
      <Card className="p-8 text-center space-y-4">
        <div className="text-5xl">🏆</div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Join This Week's League!</h3>
          <p className="text-muted-foreground mb-4">
            Complete an assessment or practice problem to earn XP and join the competition.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm">
            <Zap className="h-4 w-4" />
            Earn your first XP to get started
          </div>
        </div>
      </Card>
    );
  }

  const tierConfig = TIER_CONFIG[userLeagueInfo.league.tier as keyof typeof TIER_CONFIG];
  const { promotionCount, demotionThreshold } = getPromotionZones(userLeagueInfo.league.tier, userLeagueInfo.totalUsers);

  return (
    <div className="space-y-4">

      {tierConfig && (
        <>
              {/* League Header */}
              <Card className="p-6 border-2" style={{ borderColor: tierConfig.color + '40' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`text-5xl bg-gradient-to-br ${tierConfig.gradient} p-3 rounded-xl shadow-lg`}>
                      {tierConfig.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold" style={{ color: tierConfig.color }}>
                          {tierConfig.name}
                        </h2>
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-80">
                            <div className="space-y-2">
                              <h4 className="font-semibold">How Weekly Leagues Work</h4>
                              <p className="text-sm text-muted-foreground">
                                You're competing in the <span style={{ color: tierConfig.color }} className="font-semibold">{tierConfig.name}</span> tier with up to 20 competitors.
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Each week (Sunday 2pm IST to next Sunday 2pm IST), the <span className="text-green-600 dark:text-green-400 font-semibold">top 25%</span> get promoted 
                                to a higher tier, the <span className="text-red-600 dark:text-red-400 font-semibold">bottom 25%</span> get demoted,
                                and everyone else stays in the same tier.
                              </p>
                              <p className="text-sm text-muted-foreground">
                                All users in each tier are rebalanced into new leagues each week for fair competition. Earn XP by completing assessments and practice problems!
                              </p>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(userLeagueInfo.league.week_start).toLocaleDateString()} - {new Date(userLeagueInfo.league.week_end).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 font-bold">
                      <Clock className="h-5 w-5" />
                      <span className="text-base">{getRemainingTime()}</span>
                    </div>
                  </div>
                </div>

              </Card>

          {/* Leaderboard */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              League Standings
            </h3>

            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {leaderboard.map((member, index) => {
                  const rank = index + 1;
                  const isCurrentUser = member.user_id === user!.id;
                  const zoneColor = getZoneColor(rank, userLeagueInfo.league.tier, userLeagueInfo.totalUsers);
                  const showPromotionZone = rank === promotionCount;
                  const showDemotionZone = rank === demotionThreshold;
                  
                  return (
                    <React.Fragment key={member.id}>
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ 
                          opacity: 1, 
                          y: 0
                        }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ 
                          layout: { type: "spring", stiffness: 300, damping: 30 },
                          opacity: { duration: 0.2 }
                        }}
                        className={`flex items-center gap-4 p-3 rounded-lg border transition-all ${
                          isCurrentUser ? 'bg-primary/5 border-primary/30' : 'border-border'
                        }`}
                      >
                        <motion.div 
                          className="w-8 text-center font-bold"
                          layout
                        >
                          {rank <= 3 ? (
                            <div className="text-3xl">
                              {rank === 1 && '🥇'}
                              {rank === 2 && '🥈'}
                              {rank === 3 && '🥉'}
                            </div>
                          ) : (
                            <span className={zoneColor}>{rank}</span>
                          )}
                        </motion.div>

                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.profiles.avatar_url || undefined} />
                          <AvatarFallback>{member.profiles.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className={`font-semibold ${zoneColor}`}>{member.profiles.full_name}</div>
                        </div>

                        <motion.div 
                          className="text-right"
                          layout
                        >
                          <div className="font-bold text-lg flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            {member.week_xp} XP
                          </div>
                        </motion.div>
                      </motion.div>
                      
                      {showPromotionZone && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="flex items-center justify-center gap-2 py-2 px-4"
                        >
                          <ChevronUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">
                            Promotion Zone
                          </span>
                          <ChevronUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </motion.div>
                      )}
                      
                      {showDemotionZone && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="flex items-center justify-center gap-2 py-2 px-4"
                        >
                          <ChevronDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                          <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
                            Demotion Zone
                          </span>
                          <ChevronDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </motion.div>
                      )}
                    </React.Fragment>
                  );
                })}
              </AnimatePresence>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
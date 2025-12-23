import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, TrendingUp, Users, Award } from 'lucide-react';
import { TIER_CONFIG, LeagueTier } from '@/lib/weeklyLeagueSystem';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LeagueMember {
  user_id: string;
  week_xp: number;
  rank: number;
  profile: {
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
}

interface League {
  id: string;
  tier: LeagueTier;
  league_number: number;
  members: LeagueMember[];
}

export const InstructorClassPerformance: React.FC = () => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<LeagueTier>('initiate');

  useEffect(() => {
    fetchLeaguesData();
  }, []);

  const fetchLeaguesData = async () => {
    try {
      setLoading(true);

      // Get current week boundaries
      const { data: boundaries } = await supabase.rpc('get_current_league_week_boundaries');
      if (!boundaries || boundaries.length === 0) return;

      const { week_start } = boundaries[0];

      // Fetch all active leagues for current week
      const { data: leaguesData, error: leaguesError } = await supabase
        .from('weekly_leagues')
        .select('id, tier, league_number, week_start')
        .eq('week_start', week_start)
        .eq('is_active', true)
        .order('tier')
        .order('league_number');

      if (leaguesError) throw leaguesError;

      // Fetch memberships for all leagues with profiles
      const { data: membershipsData, error: membershipsError } = await supabase
        .from('league_memberships')
        .select(`
          user_id,
          league_id,
          week_xp,
          profiles!inner (
            full_name,
            username,
            avatar_url,
            role
          )
        `)
        .eq('week_start', week_start)
        .eq('profiles.role', 'student')
        .order('week_xp', { ascending: false });

      if (membershipsError) throw membershipsError;

      // Group members by league and calculate ranks
      const leaguesWithMembers: League[] = (leaguesData || []).map(league => {
        const leagueMembers = (membershipsData || [])
          .filter((m: any) => m.league_id === league.id)
          .map((m: any, index: number) => ({
            user_id: m.user_id,
            week_xp: m.week_xp || 0,
            rank: index + 1,
            profile: {
              full_name: m.profiles.full_name,
              username: m.profiles.username,
              avatar_url: m.profiles.avatar_url
            }
          }));

        return {
          id: league.id,
          tier: league.tier as LeagueTier,
          league_number: league.league_number,
          members: leagueMembers
        };
      });

      setLeagues(leaguesWithMembers);
    } catch (error) {
      console.error('Error fetching leagues:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierLeagues = (tier: LeagueTier) => {
    return leagues.filter(league => league.tier === tier);
  };

  const getTierStats = (tier: LeagueTier) => {
    const tierLeagues = getTierLeagues(tier);
    const totalStudents = tierLeagues.reduce((sum, league) => sum + league.members.length, 0);
    const avgXP = tierLeagues.reduce((sum, league) => {
      const leagueAvg = league.members.reduce((s, m) => s + m.week_xp, 0) / (league.members.length || 1);
      return sum + leagueAvg;
    }, 0) / (tierLeagues.length || 1);

    return { totalStudents, avgXP: Math.round(avgXP), leagueCount: tierLeagues.length };
  };

  const getRankBadgeVariant = (rank: number): "default" | "secondary" | "outline" => {
    if (rank === 1) return "default";
    if (rank <= 5) return "secondary";
    return "outline";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Class Performance
          </h2>
          <p className="text-muted-foreground mt-2">
            View all students across different leagues and tiers
          </p>
        </div>
      </div>

      <Tabs value={selectedTier} onValueChange={(value) => setSelectedTier(value as LeagueTier)}>
        <TabsList className="grid w-full grid-cols-6">
          {(Object.keys(TIER_CONFIG) as LeagueTier[]).map((tier) => {
            const stats = getTierStats(tier);
            return (
              <TabsTrigger key={tier} value={tier} className="flex flex-col gap-1">
                <span className="flex items-center gap-1">
                  {TIER_CONFIG[tier].icon} {TIER_CONFIG[tier].name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {stats.totalStudents} students
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {(Object.keys(TIER_CONFIG) as LeagueTier[]).map((tier) => {
          const tierLeagues = getTierLeagues(tier);
          const stats = getTierStats(tier);

          return (
            <TabsContent key={tier} value={tier} className="space-y-6">
              {/* Tier Overview */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalStudents}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Leagues</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.leagueCount}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average XP</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.avgXP}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Leagues */}
              <div className="grid gap-6">
                {tierLeagues.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">
                        No students in {TIER_CONFIG[tier].name} tier yet
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  tierLeagues.map((league) => (
                    <Card key={league.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {TIER_CONFIG[league.tier].icon} {TIER_CONFIG[league.tier].name} League #{league.league_number}
                            </CardTitle>
                            <CardDescription>
                              {league.members.length} students competing
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {league.members.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">
                            No students in this league yet
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {league.members.map((member) => (
                              <div
                                key={member.user_id}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors"
                              >
                                <div className="flex items-center gap-4">
                                  <Badge variant={getRankBadgeVariant(member.rank)} className="w-8 h-8 flex items-center justify-center">
                                    {member.rank}
                                  </Badge>
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={member.profile.avatar_url || undefined} />
                                    <AvatarFallback>
                                      {member.profile.full_name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{member.profile.full_name}</p>
                                    <p className="text-sm text-muted-foreground">@{member.profile.username}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="font-mono">
                                    {member.week_xp} XP
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

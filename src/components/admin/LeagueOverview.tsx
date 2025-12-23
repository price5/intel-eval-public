import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Trophy, Clock, Star, Users, Award, Zap } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface LeagueData {
  id: string;
  tier: string;
  league_number: number;
  week_start: string;
  week_end: string;
  is_active: boolean;
  members: {
    user_id: string;
    week_xp: number;
    profiles: {
      username: string;
      full_name: string;
      avatar_url: string | null;
    };
  }[];
}

const TIER_CONFIG = {
  initiate: { name: 'Initiate', color: '#9CA3AF', icon: '🌱' },
  thinker: { name: 'Thinker', color: '#60A5FA', icon: '💎' },
  strategist: { name: 'Strategist', color: '#A78BFA', icon: '⚔️' },
  analyst: { name: 'Analyst', color: '#F59E0B', icon: '🔥' },
  prodigy: { name: 'Prodigy', color: '#EC4899', icon: '✨' },
  mastermind: { name: 'Mastermind', color: '#8B5CF6', icon: '👑' },
};

const XP_ACTIVITIES = [
  { activity: 'Complete Assessment', xp: '50-100 XP', icon: '📝', description: 'Based on score and difficulty' },
  { activity: 'Complete Practice Problem', xp: '25-50 XP', icon: '💻', description: 'Based on difficulty level' },
  { activity: 'Perfect Score Bonus', xp: '+20 XP', icon: '🎯', description: 'Get 100% on any submission' },
  { activity: 'First Try Success', xp: '+15 XP', icon: '⭐', description: 'Pass all tests on first attempt' },
  { activity: '7-Day Streak Booster', xp: '1.1x multiplier', icon: '🔥', description: '24 hour duration' },
  { activity: '30-Day Streak Booster', xp: '1.2x multiplier', icon: '🔥', description: '48 hour duration' },
  { activity: '60-Day Streak Booster', xp: '1.3x multiplier', icon: '🔥', description: '72 hour duration' },
  { activity: '100-Day Streak Booster', xp: '1.5x multiplier', icon: '🏆', description: '7 day duration' },
];

export const LeagueOverview: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [leagues, setLeagues] = useState<LeagueData[]>([]);
  const [resetTime, setResetTime] = useState<string>('');

  useEffect(() => {
    fetchLeagueData();
  }, []);

  const fetchLeagueData = async () => {
    try {
      setLoading(true);

      // Fetch all active leagues
      const { data: leaguesData, error: leaguesError } = await supabase
        .from('weekly_leagues')
        .select('*')
        .eq('is_active', true)
        .order('tier')
        .order('league_number');

      if (leaguesError) throw leaguesError;

      // Fetch all memberships for active leagues
      const leagueIds = leaguesData?.map(l => l.id) || [];
      const { data: membersData, error: membersError } = await supabase
        .from('league_memberships')
        .select(`
          user_id,
          week_xp,
          league_id,
          profiles (username, full_name, avatar_url)
        `)
        .in('league_id', leagueIds)
        .order('week_xp', { ascending: false });

      if (membersError) throw membersError;

      // Group members by league
      const leaguesWithMembers = leaguesData?.map(league => ({
        ...league,
        members: membersData?.filter(m => m.league_id === league.id) || []
      })) || [];

      setLeagues(leaguesWithMembers);

      // Calculate next reset time
      if (leaguesData && leaguesData.length > 0) {
        const weekEnd = new Date(leaguesData[0].week_end);
        setResetTime(weekEnd.toLocaleString('en-IN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Kolkata'
        }));
      }
    } catch (error) {
      console.error('Error fetching league data:', error);
      toast.error('Failed to load league data');
    } finally {
      setLoading(false);
    }
  };

  const getRemainingTime = () => {
    if (leagues.length === 0) return '';
    const now = new Date();
    const weekEnd = new Date(leagues[0].week_end);
    const diff = weekEnd.getTime() - now.getTime();
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return `${days}d ${hours}h`;
  };

  const groupedLeagues = leagues.reduce((acc, league) => {
    if (!acc[league.tier]) {
      acc[league.tier] = [];
    }
    acc[league.tier].push(league);
    return acc;
  }, {} as Record<string, LeagueData[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Reset</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getRemainingTime()}</div>
            <p className="text-xs text-muted-foreground mt-1">{resetTime}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leagues</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leagues.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all tiers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leagues.reduce((sum, l) => sum + l.members.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">With XP this week</p>
          </CardContent>
        </Card>
      </div>

      {/* XP Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            XP Activities & Boosters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activity</TableHead>
                <TableHead>XP Reward</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {XP_ACTIVITIES.map((activity, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    <span className="mr-2">{activity.icon}</span>
                    {activity.activity}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{activity.xp}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{activity.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* League System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Weekly League System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">How It Works</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Week runs Sunday 2pm IST to next Sunday 2pm IST</li>
                <li>• Maximum 20 users per league</li>
                <li>• Top 25% get promoted to higher tier</li>
                <li>• Bottom 25% get demoted to lower tier</li>
                <li>• Users rebalanced into new leagues each week</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">User Placement</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Users placed when they earn first XP of the week</li>
                <li>• All XP since week start is credited</li>
                <li>• Leagues fill sequentially (1-20, 21-40, etc.)</li>
                <li>• New leagues created when existing ones fill</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leagues by Tier */}
      {Object.entries(TIER_CONFIG).map(([tierKey, tierConfig]) => {
        const tierLeagues = groupedLeagues[tierKey] || [];
        if (tierLeagues.length === 0) return null;

        return (
          <Card key={tierKey}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">{tierConfig.icon}</span>
                <span style={{ color: tierConfig.color }}>{tierConfig.name}</span>
                <Badge variant="outline">{tierLeagues.length} League{tierLeagues.length !== 1 ? 's' : ''}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tierLeagues.map((league) => (
                  <div key={league.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">League #{league.league_number}</h4>
                      <Badge>{league.members.length} user{league.members.length !== 1 ? 's' : ''}</Badge>
                    </div>
                    
                    {league.members.length > 0 ? (
                      <div className="space-y-2">
                        {league.members.slice(0, 10).map((member, index) => (
                          <div key={member.user_id} className="flex items-center gap-3 text-sm">
                            <span className="w-6 text-center font-semibold text-muted-foreground">
                              {index + 1}
                            </span>
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={member.profiles.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {member.profiles.username?.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="flex-1">{member.profiles.username}</span>
                            <span className="font-semibold flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                              {member.week_xp} XP
                            </span>
                          </div>
                        ))}
                        {league.members.length > 10 && (
                          <p className="text-xs text-muted-foreground text-center pt-2">
                            +{league.members.length - 10} more user{league.members.length - 10 !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-2">No users yet</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

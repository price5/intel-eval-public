import React, { useState, useEffect } from 'react';
import { User, Trophy, Calendar, Shield, Award, Target, TrendingUp } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { UserProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { WeeklyLeagueBadge } from './WeeklyLeagueBadge';
import { Star } from 'lucide-react';

interface ProfilePopupProps {
  profile: UserProfile;
}

interface UserRole {
  role_name: string;
  role_category: string;
  unlocked_at: string;
}

export const ProfilePopup: React.FC<ProfilePopupProps> = ({ profile }) => {
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [userRanking, setUserRanking] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(true);
  const [weeklyLeague, setWeeklyLeague] = useState<any>(null);
  const [totalXP, setTotalXP] = useState<number>(0);

  useEffect(() => {
    if (profile) {
      fetchUserBadgesAndRanking();
    }
  }, [profile]);

  const fetchUserBadgesAndRanking = async () => {
    if (!profile?.user_id) return;
    
    try {
      setBadgesLoading(true);
      
      // Fetch user badges
      const { data: badges } = await supabase
        .from('user_badges')
        .select(`
          *,
          badge_definitions:badge_id (
            name,
            description,
            category,
            icon,
            color,
            tier_order
          )
        `)
        .eq('user_id', profile.user_id)
        .order('earned_at', { ascending: false });

      // Fetch user achievement roles
      const { data: roles } = await supabase
        .from('user_achievement_roles')
        .select('role_name, role_category, unlocked_at')
        .eq('user_id', profile.user_id)
        .order('unlocked_at', { ascending: false });

      setUserBadges(badges || []);
      setUserRoles(roles || []);

      // Fetch user ranking
      const { data: ranking } = await supabase
        .from('user_rankings')
        .select('*')
        .eq('user_id', profile.user_id)
        .maybeSingle();

      setUserRanking(ranking);

      // Fetch total XP from user_stats
      const { data: stats } = await supabase
        .from('user_stats')
        .select('total_xp')
        .eq('user_id', profile.user_id)
        .maybeSingle();

      setTotalXP(stats?.total_xp || 0);

      // Fetch current weekly league
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + 1);
      const weekStartStr = weekStart.toISOString().split('T')[0];

      const { data: leagueMembership } = await supabase
        .from('league_memberships')
        .select(`
          *,
          weekly_leagues (tier, league_number, week_start, week_end)
        `)
        .eq('user_id', profile.user_id)
        .eq('week_start', weekStartStr)
        .maybeSingle();

      setWeeklyLeague(leagueMembership);
    } catch (error) {
      console.error('Error fetching badges and ranking:', error);
    } finally {
      setBadgesLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const getBadgeColor = (color: string) => {
    const colors = {
      'gray': 'bg-gray-100 text-gray-800',
      'blue': 'bg-blue-100 text-blue-800',
      'purple': 'bg-purple-100 text-purple-800',
      'gold': 'bg-yellow-100 text-yellow-800',
      'rainbow': 'bg-gradient-to-r from-purple-400 to-pink-400 text-white',
      'green': 'bg-green-100 text-green-800',
      'orange': 'bg-orange-100 text-orange-800',
      'red': 'bg-red-100 text-red-800',
      'cyan': 'bg-cyan-100 text-cyan-800'
    };
    return colors[color as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getAchievementRoleEmoji = (role: string) => {
    const roleEmojis = {
      'Initiate': '🆕',
      'Debugger': '🐛', 
      'Algorithm Adept': '🔧',
      'Logic Crafter': '🧠',
      'Insight Scholar': '💡',
      'Architect of Thought': '🏗️',
      'Grand Evaluator': '👑',
      'Bug Slayer': '🐞',
      'Efficiency Guru': '⚡',
      'One-Liner Wizard': '🧙',
      'Clarity Champion': '🏆',
      'Concept Weaver': '🕸️',
      "Teacher's Voice": '👨‍🏫',
      'Fusionist': '⚖️',
      'Comeback Kid': '🔄',
      'Streak Holder': '🔥',
      'Hall of Fame': '👑'
    };
    return roleEmojis[role as keyof typeof roleEmojis] || '🆕';
  };

  const getCurrentTierProgress = () => {
    if (!profile?.achievement_role || !userRanking) return { current: 0, next: 100, progress: 0 };
    
    const tierMap = {
      'Initiate': { min: 0, max: 10 },
      'Debugger': { min: 11, max: 50 },
      'Algorithm Adept': { min: 51, max: 70 },
      'Logic Crafter': { min: 71, max: 85 },
      'Insight Scholar': { min: 86, max: 95 },
      'Architect of Thought': { min: 96, max: 99 },
      'Grand Evaluator': { min: 100, max: 100 }
    };
    
    const currentTier = tierMap[profile.achievement_role as keyof typeof tierMap];
    const currentScore = userRanking.avg_score_overall || 0;
    
    if (!currentTier) return { current: currentScore, next: 100, progress: 0 };
    
    const progress = ((currentScore - currentTier.min) / (currentTier.max - currentTier.min)) * 100;
    return {
      current: currentScore,
      next: currentTier.max,
      progress: Math.max(0, Math.min(100, progress))
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 pb-4 border-b">
        <Avatar className="h-16 w-16">
          <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
          <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
            {getInitials(profile.full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{profile.full_name}</h2>
          <p className="text-muted-foreground">@{profile.username}</p>
          {(profile.custom_status_emoji || profile.custom_status_text) && (
            <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              {profile.custom_status_emoji && <span>{profile.custom_status_emoji}</span>}
              {profile.custom_status_text && <span>{profile.custom_status_text}</span>}
            </div>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {weeklyLeague?.weekly_leagues && (
              <WeeklyLeagueBadge 
                tier={weeklyLeague.weekly_leagues.tier} 
                leagueNumber={weeklyLeague.weekly_leagues.league_number}
                size="md" 
              />
            )}
            <Badge variant="outline" className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
              {totalXP.toLocaleString()} Total XP
            </Badge>
          </div>
        </div>
      </div>

      <Tabs defaultValue="information" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="information">Information</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="information" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Bio</label>
                <p className="mt-1 text-sm">
                  {profile.bio || 'No bio provided'}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Roles:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {profile.role === 'student' ? 'Student' : 'Instructor'}
                  </Badge>
                  {userRoles.map((role, index) => (
                    <Badge key={index} variant="outline" className="capitalize flex items-center gap-1">
                      {getAchievementRoleEmoji(role.role_name)} {role.role_name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Current Streak:</span>
                <Badge variant="outline" className="flex items-center gap-1">
                  🔥 {profile.streak_count} {profile.streak_count === 1 ? 'day' : 'days'}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Last Login:</span>
                <span className="text-sm text-muted-foreground">
                  {formatDate(profile.last_login_date)}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid gap-4">
            {/* Tier Progress Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Tier Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  const tierProgress = getCurrentTierProgress();
                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Current Tier</span>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <span>{getAchievementRoleEmoji(profile.achievement_role || 'Initiate')}</span>
                          {profile.achievement_role || 'Initiate'}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Progress to next tier</span>
                          <span className="text-sm text-muted-foreground">
                            {tierProgress.current.toFixed(1)}/{tierProgress.next}
                          </span>
                        </div>
                        <Progress value={tierProgress.progress} className="h-2" />
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Badges Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Earned Badges ({userBadges.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {badgesLoading ? (
                  <div className="grid grid-cols-3 gap-2">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : userBadges.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {userBadges.slice(0, 6).map((badge) => (
                      <div
                        key={badge.id}
                        className={`p-2 rounded-lg text-center border ${getBadgeColor(badge.badge_definitions.color)}`}
                        title={badge.badge_definitions.description}
                      >
                        <div className="text-lg mb-1">{badge.badge_definitions.icon}</div>
                        <div className="text-xs font-medium">{badge.badge_definitions.name}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Complete assessments to earn your first badges!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Best Ranks Card */}
            {userRanking && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Best Ranks
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile.highest_rank_overall && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Overall:</span>
                      <Badge variant="secondary">#{profile.highest_rank_overall}</Badge>
                    </div>
                  )}
                  {profile.highest_rank_code && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Code:</span>
                      <Badge variant="secondary">#{profile.highest_rank_code}</Badge>
                    </div>
                  )}
                  {profile.highest_rank_explanation && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Explanation:</span>
                      <Badge variant="secondary">#{profile.highest_rank_explanation}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
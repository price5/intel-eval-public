import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Award, Target, TrendingUp, User, Lock, Loader2, Flame, Zap, Star } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AchievementCard } from './AchievementCard';
import { WeeklyLeagueBadge } from './WeeklyLeagueBadge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const ProfileSection: React.FC = () => {
  const { profile, loading, refetch } = useProfile();
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    avatar_url: ''
  });
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [userRanking, setUserRanking] = useState<any>(null);
  const [badgesLoading, setBadgesLoading] = useState(true);
  const [allAchievements, setAllAchievements] = useState<any[]>([]);
  const [userAchievements, setUserAchievements] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [weeklyLeague, setWeeklyLeague] = useState<any>(null);

  const fetchUserBadgesAndRanking = useCallback(async () => {
    if (!profile?.user_id) return;
    
    try {
      setBadgesLoading(true);
      
      // Fetch all achievements
      const { data: achievements } = await supabase
        .from('achievements')
        .select('*')
        .order('tier', { ascending: true });

      setAllAchievements(achievements || []);

      // Fetch user's earned achievements
      const { data: earned } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', profile.user_id);

      setUserAchievements(earned || []);

      // Fetch user stats
      const { data: stats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', profile.user_id)
        .maybeSingle();

      setUserStats(stats);

      // Evaluate achievements (will auto-award based on current stats)
      await supabase.rpc('evaluate_and_award_achievements', { 
        user_id_param: profile.user_id 
      });

      // Fetch user badges (existing)
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

      setUserBadges(badges || []);

      // Fetch user ranking
      const { data: ranking } = await supabase
        .from('user_rankings')
        .select('*')
        .eq('user_id', profile.user_id)
        .maybeSingle();

      setUserRanking(ranking);

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
  }, [profile?.user_id]);

  useEffect(() => {
    if (profile) {
      setFormData({
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || ''
      });
      fetchUserBadgesAndRanking();
    }
  }, [profile, fetchUserBadgesAndRanking]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          bio: formData.bio,
          avatar_url: formData.avatar_url,
        })
        .eq('user_id', profile!.user_id);

      if (error) throw error;

      toast.success('Profile updated successfully!');
      
      // Refetch profile to ensure UI reflects changes
      if (refetch) {
        await refetch();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsUpdating(false);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  const tierProgress = getCurrentTierProgress();

  const getAchievementsByCategory = (category: string) => {
    if (category === 'all') return allAchievements;
    return allAchievements.filter(a => a.category === category);
  };

  const isAchievementEarned = (achievementId: string) => {
    return userAchievements.some(ua => ua.achievement_id === achievementId);
  };

  const getAchievementProgress = (achievementId: string) => {
    const userAchievement = userAchievements.find(ua => ua.achievement_id === achievementId);
    return userAchievement ? {
      progress: userAchievement.progress,
      progressMax: userAchievement.progress_max
    } : null;
  };

  const earnedCount = userAchievements.length;
  const totalCount = allAchievements.length;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Profile Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your account information and achievements
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>Update your profile details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={formData.avatar_url} />
                <AvatarFallback className="text-lg">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{profile.full_name}</h3>
                <p className="text-muted-foreground">@{profile.username}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {weeklyLeague?.weekly_leagues && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="inline-block cursor-help">
                          <WeeklyLeagueBadge 
                            tier={weeklyLeague.weekly_leagues.tier} 
                            leagueNumber={weeklyLeague.weekly_leagues.league_number}
                            size="sm" 
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs z-50">
                        <div className="space-y-2">
                          <p className="font-semibold">Weekly XP League</p>
                          <p className="text-sm">Compete with others this week! Top 5 get promoted, bottom 5 get demoted.</p>
                          <p className="text-xs text-muted-foreground">This Week: {weeklyLeague.week_xp} XP earned</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    {userStats?.total_xp?.toLocaleString() || 0} XP
                  </Badge>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="avatar_url">Avatar URL</Label>
                <Input
                  id="avatar_url"
                  name="avatar_url"
                  value={formData.avatar_url}
                  onChange={(e) => handleInputChange('avatar_url', e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>

              <Button type="submit" disabled={isUpdating} className="w-full">
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Profile'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>


        {/* Account Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Account Details
            </CardTitle>
            <CardDescription>
              These details cannot be changed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={profile.full_name}
                disabled
                className="bg-muted cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                value={profile.username}
                disabled
                className="bg-muted cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <Label>College</Label>
              <Input
                value={profile.college}
                disabled
                className="bg-muted cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <Label>USN</Label>
              <Input
                value={profile.usn}
                disabled
                className="bg-muted cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Input
                value={profile.role}
                disabled
                className="bg-muted cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <Label>Member Since</Label>
              <Input
                value={new Date(profile.created_at).toLocaleDateString()}
                disabled
                className="bg-muted cursor-not-allowed"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats & Achievements Tabs */}
      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stats">
            <TrendingUp className="w-4 h-4 mr-2" />
            Stats
          </TabsTrigger>
          <TabsTrigger value="achievements">
            <Trophy className="w-4 h-4 mr-2" />
            Achievements
          </TabsTrigger>
        </TabsList>

        {/* Stats Tab */}
        <TabsContent value="stats" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Stats</CardTitle>
              <CardDescription>
                Track your learning progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/20">
                  <div className="text-3xl font-bold flex items-center gap-2 justify-center">
                    <Flame className="w-8 h-8 text-orange-500" />
                    {profile.streak_count}
                  </div>
                  <p className="text-sm font-medium mt-2">Day Streak</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
                  <div className="text-3xl font-bold flex items-center gap-2 justify-center">
                    <Zap className="w-8 h-8 text-blue-500" />
                    {userStats?.submissions_count || 0}
                  </div>
                  <p className="text-sm font-medium mt-2">Total Submissions</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20">
                  <div className="text-3xl font-bold flex items-center gap-2 justify-center">
                    <Star className="w-8 h-8 text-yellow-500" />
                    {profile.days_active || 1}
                  </div>
                  <p className="text-sm font-medium mt-2">Days Active</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                  <div className="text-3xl font-bold flex items-center gap-2 justify-center">
                    <Star className="w-8 h-8 text-purple-500 fill-purple-500" />
                    {userStats?.total_xp?.toLocaleString() || 0}
                  </div>
                  <p className="text-sm font-medium mt-2">Total XP</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                    Achievements
                  </CardTitle>
                  <CardDescription>
                    {earnedCount} of {totalCount} achievements earned
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {earnedCount}/{totalCount}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Category Filter */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={selectedCategory === 'consistency' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('consistency')}
                  >
                    Consistency
                  </Button>
                  <Button
                    variant={selectedCategory === 'quality' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('quality')}
                  >
                    Quality
                  </Button>
                  <Button
                    variant={selectedCategory === 'growth' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('growth')}
                  >
                    Growth
                  </Button>
                  <Button
                    variant={selectedCategory === 'community' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('community')}
                  >
                    Community
                  </Button>
                  <Button
                    variant={selectedCategory === 'special' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('special')}
                  >
                    Special
                  </Button>
                </div>

                {/* Achievement Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {getAchievementsByCategory(selectedCategory).map((achievement) => {
                    const earned = isAchievementEarned(achievement.id);
                    const progress = getAchievementProgress(achievement.id);
                    const userAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id);
                    
                    return (
                      <AchievementCard
                        key={achievement.id}
                        name={achievement.name}
                        description={achievement.description}
                        category={achievement.category}
                        tier={achievement.tier}
                        icon={achievement.icon}
                        earned={earned}
                        earnedAt={userAchievement?.earned_at}
                        progress={progress?.progress}
                        progressMax={progress?.progressMax}
                      />
                    );
                  })}
                </div>

                {getAchievementsByCategory(selectedCategory).length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No achievements in this category yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </TooltipProvider>
  );
};
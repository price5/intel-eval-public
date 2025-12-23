import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Zap, Star, Loader2 } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';

export const StatsSection: React.FC = () => {
  const { profile } = useProfile();
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile?.user_id) return;

      try {
        const { data: stats } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', profile.user_id)
          .maybeSingle();

        setUserStats(stats);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [profile?.user_id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Stats</CardTitle>
        <CardDescription>Track your learning progress and achievements</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/20">
            <div className="text-4xl font-bold flex items-center gap-2 justify-center">
              <Flame className="w-10 h-10 text-orange-500" />
              {profile?.streak_count || 0}
            </div>
            <p className="text-sm font-medium mt-3">Day Streak</p>
            <p className="text-xs text-muted-foreground mt-1">Keep it going!</p>
          </div>

          <div className="text-center p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
            <div className="text-4xl font-bold flex items-center gap-2 justify-center">
              <Zap className="w-10 h-10 text-blue-500" />
              {userStats?.submissions_count || 0}
            </div>
            <p className="text-sm font-medium mt-3">Total Submissions</p>
            <p className="text-xs text-muted-foreground mt-1">Practice makes perfect</p>
          </div>

          <div className="text-center p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20">
            <div className="text-4xl font-bold flex items-center gap-2 justify-center">
              <Star className="w-10 h-10 text-yellow-500" />
              {profile?.days_active || 1}
            </div>
            <p className="text-sm font-medium mt-3">Days Active</p>
            <p className="text-xs text-muted-foreground mt-1">Your dedication</p>
          </div>

          <div className="text-center p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
            <div className="text-4xl font-bold flex items-center gap-2 justify-center">
              <Star className="w-10 h-10 text-purple-500 fill-purple-500" />
              {userStats?.total_xp?.toLocaleString() || 0}
            </div>
            <p className="text-sm font-medium mt-3">Total XP</p>
            <p className="text-xs text-muted-foreground mt-1">Experience earned</p>
          </div>
        </div>

        {userStats?.perfect_scores > 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Perfect Scores</p>
                <p className="text-xs text-muted-foreground">100% accuracy submissions</p>
              </div>
              <div className="text-3xl font-bold text-green-600">
                {userStats.perfect_scores}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Loader2 } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { AchievementCard } from '@/components/profile/AchievementCard';

export const AchievementsSection: React.FC = () => {
  const { profile } = useProfile();
  const [allAchievements, setAllAchievements] = useState<any[]>([]);
  const [userAchievements, setUserAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const fetchAchievements = useCallback(async () => {
    if (!profile?.user_id) return;

    try {
      setLoading(true);

      const { data: achievements } = await supabase
        .from('achievements')
        .select('*')
        .order('tier', { ascending: true });

      setAllAchievements(achievements || []);

      const { data: earned } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', profile.user_id);

      setUserAchievements(earned || []);

      await supabase.rpc('evaluate_and_award_achievements', {
        user_id_param: profile.user_id
      });
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.user_id]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

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
  );
};

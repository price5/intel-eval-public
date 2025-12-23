import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trophy, Plus, RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tier: string;
  points: number;
  criteria: Record<string, any>;
}

export const AchievementManagement: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [retroactiveLoading, setRetroactiveLoading] = useState(false);
  const [newAchievement, setNewAchievement] = useState({
    name: '',
    description: '',
    icon: '🏆',
    category: 'consistency',
    tier: 'bronze',
    points: 10,
    criteria_type: 'submissions_count',
    criteria_value: 1
  });

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('tier', { ascending: true });

      if (error) throw error;
      setAchievements((data as Achievement[]) || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      toast.error('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAchievement = async () => {
    try {
      const { error } = await supabase
        .from('achievements')
        .insert({
          name: newAchievement.name,
          description: newAchievement.description,
          icon: newAchievement.icon,
          category: newAchievement.category,
          tier: newAchievement.tier,
          points: newAchievement.points,
          criteria: {
            type: newAchievement.criteria_type,
            value: newAchievement.criteria_value
          }
        });

      if (error) throw error;
      
      toast.success('Achievement created successfully');
      fetchAchievements();
      
      // Reset form
      setNewAchievement({
        name: '',
        description: '',
        icon: '🏆',
        category: 'consistency',
        tier: 'bronze',
        points: 10,
        criteria_type: 'submissions_count',
        criteria_value: 1
      });
    } catch (error) {
      console.error('Error creating achievement:', error);
      toast.error('Failed to create achievement');
    }
  };

  const runRetroactiveUnlock = async () => {
    if (!confirm('This will evaluate all achievements for all users. This may take a while. Continue?')) {
      return;
    }

    setRetroactiveLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('retroactive-achievements');

      if (error) throw error;

      toast.success(
        `Retroactive unlock complete: Processed ${data.processed}/${data.total} users`,
        { description: data.errors.length > 0 ? `${data.errors.length} errors occurred` : undefined }
      );
    } catch (error) {
      console.error('Error running retroactive unlock:', error);
      toast.error('Failed to run retroactive unlock');
    } finally {
      setRetroactiveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Achievement Management
              </CardTitle>
              <CardDescription>
                Manage achievements and run retroactive unlocks
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Achievement
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Achievement</DialogTitle>
                    <DialogDescription>
                      Define a new achievement for users to earn
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={newAchievement.name}
                          onChange={(e) => setNewAchievement({ ...newAchievement, name: e.target.value })}
                          placeholder="First Submission"
                        />
                      </div>
                      <div>
                        <Label>Icon (Emoji)</Label>
                        <Input
                          value={newAchievement.icon}
                          onChange={(e) => setNewAchievement({ ...newAchievement, icon: e.target.value })}
                          placeholder="🏆"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={newAchievement.description}
                        onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })}
                        placeholder="Complete your first submission"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Category</Label>
                        <Select
                          value={newAchievement.category}
                          onValueChange={(value) => setNewAchievement({ ...newAchievement, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="consistency">Consistency</SelectItem>
                            <SelectItem value="quality">Quality</SelectItem>
                            <SelectItem value="growth">Growth</SelectItem>
                            <SelectItem value="community">Community</SelectItem>
                            <SelectItem value="special">Special</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Tier</Label>
                        <Select
                          value={newAchievement.tier}
                          onValueChange={(value) => setNewAchievement({ ...newAchievement, tier: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bronze">Bronze</SelectItem>
                            <SelectItem value="silver">Silver</SelectItem>
                            <SelectItem value="gold">Gold</SelectItem>
                            <SelectItem value="platinum">Platinum</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Points</Label>
                        <Input
                          type="number"
                          value={newAchievement.points}
                          onChange={(e) => setNewAchievement({ ...newAchievement, points: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Criteria Type</Label>
                        <Select
                          value={newAchievement.criteria_type}
                          onValueChange={(value) => setNewAchievement({ ...newAchievement, criteria_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="submissions_count">Submission Count</SelectItem>
                            <SelectItem value="streak">Streak Days</SelectItem>
                            <SelectItem value="days_active">Days Active</SelectItem>
                            <SelectItem value="perfect_scores">Perfect Scores</SelectItem>
                            <SelectItem value="score_threshold">Score Threshold</SelectItem>
                            <SelectItem value="event_count">Custom Event Count</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Required Value</Label>
                        <Input
                          type="number"
                          value={newAchievement.criteria_value}
                          onChange={(e) => setNewAchievement({ ...newAchievement, criteria_value: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                    <Button onClick={handleCreateAchievement} className="w-full">
                      Create Achievement
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                variant="outline"
                onClick={runRetroactiveUnlock}
                disabled={retroactiveLoading}
              >
                {retroactiveLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retroactive Unlock
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{achievement.icon}</div>
                  <div>
                    <h4 className="font-semibold">{achievement.name}</h4>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{achievement.category}</Badge>
                      <Badge variant="outline">{achievement.tier}</Badge>
                      <Badge variant="outline">{achievement.points} pts</Badge>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {achievement.criteria.type}: {achievement.criteria.value}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
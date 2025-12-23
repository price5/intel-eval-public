import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquare, Bug, Lightbulb, Sparkles, AlertCircle, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FeedbackComments } from '@/components/feedback/FeedbackComments';

interface Feedback {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  vote_count: number;
  comment_count: number;
}

interface UserProfile {
  username: string;
  full_name: string;
  role: string;
}

export const FeedbackManagement: React.FC = () => {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'votes'>('recent');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (feedbackError) throw feedbackError;

      if (feedbackData) {
        setFeedbackList(feedbackData);

        // Fetch user profiles
        const userIds = [...new Set(feedbackData.map(f => f.user_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, username, full_name, role')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        const profilesMap: Record<string, UserProfile> = {};
        profilesData?.forEach(profile => {
          profilesMap[profile.user_id] = {
            username: profile.username,
            full_name: profile.full_name,
            role: profile.role,
          };
        });
        setUserProfiles(profilesMap);
      }
    } catch (error) {
      console.error('Error loading feedback:', error);
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const updateFeedback = async (
    feedbackId: string,
    updates: { status?: string; priority?: string; admin_notes?: string }
  ) => {
    try {
      const { error } = await supabase
        .from('feedback')
        .update(updates)
        .eq('id', feedbackId);

      if (error) throw error;

      toast.success('Feedback updated successfully');
      loadFeedback();
    } catch (error) {
      console.error('Error updating feedback:', error);
      toast.error('Failed to update feedback');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug':
        return <Bug className="h-4 w-4" />;
      case 'feature':
        return <Sparkles className="h-4 w-4" />;
      case 'improvement':
        return <Lightbulb className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 dark:text-red-400';
      case 'high':
        return 'text-orange-600 dark:text-orange-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'low':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const filteredAndSortedFeedback = feedbackList
    .filter((feedback) => {
      if (filterStatus !== 'all' && feedback.status !== filterStatus) return false;
      if (filterType !== 'all' && feedback.type !== filterType) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'votes') {
        return b.vote_count - a.vote_count;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const statusCounts = {
    pending: feedbackList.filter(f => f.status === 'pending').length,
    reviewed: feedbackList.filter(f => f.status === 'reviewed').length,
    in_progress: feedbackList.filter(f => f.status === 'in_progress').length,
    resolved: feedbackList.filter(f => f.status === 'resolved').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reviewed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.reviewed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.in_progress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.resolved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label>Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="bug">Bug Report</SelectItem>
                  <SelectItem value="feature">Feature Request</SelectItem>
                  <SelectItem value="improvement">Improvement</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label>Sort By</Label>
              <Select value={sortBy} onValueChange={(value: 'recent' | 'votes') => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="votes">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      <span>Most Votes</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback Submissions</CardTitle>
          <CardDescription>
            Manage and respond to user feedback ({filteredAndSortedFeedback.length} items)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredAndSortedFeedback.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No feedback found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedFeedback.map((feedback) => {
                const userProfile = userProfiles[feedback.user_id];
                const isExpanded = expandedId === feedback.id;

                return (
                  <Collapsible
                    key={feedback.id}
                    open={isExpanded}
                    onOpenChange={(open) => setExpandedId(open ? feedback.id : null)}
                  >
                    <Card>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="flex flex-col items-center gap-1 px-2 py-1 rounded-md bg-muted min-w-[48px]">
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs font-medium">{feedback.vote_count}</span>
                              </div>
                              <div className="text-muted-foreground mt-1">
                                {getTypeIcon(feedback.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-foreground">{feedback.title}</h4>
                                  <span className={`text-xs font-medium ${getPriorityColor(feedback.priority)}`}>
                                    {feedback.priority.toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  By {userProfile?.username || 'Unknown'} ({userProfile?.role || 'user'})
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(feedback.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                feedback.status === 'pending' ? 'bg-muted text-muted-foreground' :
                                feedback.status === 'reviewed' ? 'bg-primary/10 text-primary' :
                                feedback.status === 'in_progress' ? 'bg-accent text-accent-foreground' :
                                feedback.status === 'resolved' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {feedback.status.replace('_', ' ').toUpperCase()}
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <CardContent className="border-t pt-4">
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium">Description</Label>
                              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                                {feedback.description}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <Label>Status</Label>
                                <Select
                                  value={feedback.status}
                                  onValueChange={(value) => updateFeedback(feedback.id, { status: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="reviewed">Reviewed</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label>Priority</Label>
                                <Select
                                  value={feedback.priority}
                                  onValueChange={(value) => updateFeedback(feedback.id, { priority: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="critical">Critical</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div>
                              <Label>Admin Notes</Label>
                              <Textarea
                                placeholder="Add internal notes about this feedback..."
                                defaultValue={feedback.admin_notes || ''}
                                onBlur={(e) => {
                                  if (e.target.value !== feedback.admin_notes) {
                                    updateFeedback(feedback.id, { admin_notes: e.target.value });
                                  }
                                }}
                                rows={3}
                              />
                            </div>

                            <div className="pt-4 border-t">
                              <FeedbackComments feedbackId={feedback.id} initialCount={feedback.comment_count} />
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

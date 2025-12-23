import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Sparkles, ChevronUp, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { FeedbackComments } from '@/components/feedback/FeedbackComments';

interface Feedback {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  vote_count: number;
  comment_count: number;
}

interface UserProfile {
  username: string;
  full_name: string;
}

export const CommunityFeedbackSection: React.FC = () => {
  const { user } = useAuth();
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'recent' | 'votes'>('votes');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadFeatureRequests();
      loadUserVotes();
    }
  }, [user, sortBy]);

  const loadFeatureRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('feedback')
        .select('*')
        .eq('type', 'feature')
        .in('status', ['pending', 'reviewed', 'in_progress']);

      if (sortBy === 'votes') {
        query = query.order('vote_count', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data: feedbackData, error: feedbackError } = await query;

      if (feedbackError) throw feedbackError;

      if (feedbackData) {
        setFeedbackList(feedbackData);

        // Fetch user profiles
        const userIds = [...new Set(feedbackData.map(f => f.user_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, username, full_name')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        const profilesMap: Record<string, UserProfile> = {};
        profilesData?.forEach(profile => {
          profilesMap[profile.user_id] = {
            username: profile.username,
            full_name: profile.full_name,
          };
        });
        setUserProfiles(profilesMap);
      }
    } catch (error) {
      console.error('Error loading feature requests:', error);
      toast.error('Failed to load feature requests');
    } finally {
      setLoading(false);
    }
  };

  const loadUserVotes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('feedback_votes')
        .select('feedback_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setUserVotes(new Set(data?.map(v => v.feedback_id) || []));
    } catch (error) {
      console.error('Error loading user votes:', error);
    }
  };

  const handleVote = async (feedbackId: string) => {
    if (!user) return;

    const hasVoted = userVotes.has(feedbackId);

    try {
      if (hasVoted) {
        const { error } = await supabase
          .from('feedback_votes')
          .delete()
          .eq('feedback_id', feedbackId)
          .eq('user_id', user.id);

        if (error) throw error;

        setUserVotes(prev => {
          const newSet = new Set(prev);
          newSet.delete(feedbackId);
          return newSet;
        });

        setFeedbackList(prev => prev.map(f => 
          f.id === feedbackId ? { ...f, vote_count: f.vote_count - 1 } : f
        ));
      } else {
        const { error } = await supabase
          .from('feedback_votes')
          .insert({ feedback_id: feedbackId, user_id: user.id });

        if (error) throw error;

        setUserVotes(prev => new Set([...prev, feedbackId]));

        setFeedbackList(prev => prev.map(f => 
          f.id === feedbackId ? { ...f, vote_count: f.vote_count + 1 } : f
        ));
      }
    } catch (error) {
      console.error('Error toggling vote:', error);
      toast.error('Failed to update vote');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: { label: 'Under Review', className: 'bg-muted text-muted-foreground' },
      reviewed: { label: 'Planned', className: 'bg-primary/10 text-primary' },
      in_progress: { label: 'In Development', className: 'bg-accent text-accent-foreground' },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`px-2 py-1 rounded-md text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Community Feature Requests
        </CardTitle>
        <CardDescription>
          Vote on feature requests from the community to help prioritize development
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {feedbackList.length} active feature requests
          </p>
          <div className="flex items-center gap-2">
            <Label className="text-sm">Sort by:</Label>
            <Select value={sortBy} onValueChange={(value: 'recent' | 'votes') => setSortBy(value)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="votes">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Most Votes</span>
                  </div>
                </SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : feedbackList.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No feature requests yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {feedbackList.map((feedback) => {
              const userProfile = userProfiles[feedback.user_id];
              const hasVoted = userVotes.has(feedback.id);

              return (
                <div
                  key={feedback.id}
                  className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => handleVote(feedback.id)}
                      className={cn(
                        "flex flex-col items-center gap-1 px-3 py-2 rounded-md transition-all min-w-[56px]",
                        hasVoted
                          ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                          : "bg-muted hover:bg-muted/80"
                      )}
                      title={hasVoted ? 'Remove your vote' : 'Vote for this feature'}
                    >
                      <ChevronUp className="h-5 w-5" />
                      <span className="text-sm font-bold">{feedback.vote_count}</span>
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-medium text-foreground">
                          {feedback.title}
                        </h4>
                        {getStatusBadge(feedback.status)}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {feedback.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>By {userProfile?.username || 'Unknown'}</span>
                        <span>•</span>
                        <span>{new Date(feedback.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <FeedbackComments feedbackId={feedback.id} initialCount={feedback.comment_count} />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

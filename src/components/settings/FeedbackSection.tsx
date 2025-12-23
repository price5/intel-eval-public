import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Bug, Lightbulb, Sparkles, AlertCircle, CheckCircle2, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { FeedbackComments } from '@/components/feedback/FeedbackComments';

interface Feedback {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  vote_count: number;
  comment_count: number;
}

interface FeedbackVote {
  feedback_id: string;
  user_id: string;
}

export const FeedbackSection: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    type: 'bug',
    title: '',
    description: '',
  });

  useEffect(() => {
    if (user) {
      loadFeedback();
      loadUserVotes();
    }
  }, [user]);

  const loadFeedback = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedbackList(data || []);
    } catch (error) {
      console.error('Error loading feedback:', error);
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
        // Remove vote
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
        // Add vote
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('feedback').insert({
        user_id: user.id,
        type: formData.type,
        title: formData.title.trim(),
        description: formData.description.trim(),
      });

      if (error) throw error;

      toast.success('Feedback submitted successfully!');
      setFormData({ type: 'bug', title: '', description: '' });
      loadFeedback();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setLoading(false);
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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pending', className: 'bg-muted text-muted-foreground' },
      reviewed: { label: 'Reviewed', className: 'bg-primary/10 text-primary' },
      in_progress: { label: 'In Progress', className: 'bg-accent text-accent-foreground' },
      resolved: { label: 'Resolved', className: 'bg-green-500/10 text-green-600 dark:text-green-400' },
      closed: { label: 'Closed', className: 'bg-muted text-muted-foreground' },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`px-2 py-1 rounded-md text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Submit Feedback Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Submit Feedback
          </CardTitle>
          <CardDescription>
            Help us improve by reporting bugs, suggesting features, or sharing your ideas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="feedback-type">Feedback Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger id="feedback-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">
                    <div className="flex items-center gap-2">
                      <Bug className="h-4 w-4" />
                      <span>Bug Report</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="feature">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      <span>Feature Request (can be voted by community)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="improvement">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      <span>Improvement Suggestion</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="other">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>Other</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-title">Title</Label>
              <Input
                id="feedback-title"
                placeholder="Brief summary of your feedback"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-description">Description</Label>
              <Textarea
                id="feedback-description"
                placeholder="Provide detailed information about your feedback..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/2000 characters
              </p>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Previous Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Your Feedback History</CardTitle>
          <CardDescription>
            Track the status of your submitted feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          {feedbackList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No feedback submitted yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedbackList.map((feedback) => (
                <div
                  key={feedback.id}
                  className="border border-border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <button
                        onClick={() => handleVote(feedback.id)}
                        disabled={feedback.type !== 'feature'}
                        className={cn(
                          "flex flex-col items-center gap-1 px-2 py-1 rounded-md transition-colors min-w-[48px]",
                          feedback.type === 'feature' 
                            ? userVotes.has(feedback.id)
                              ? "bg-primary text-primary-foreground hover:bg-primary/90"
                              : "bg-muted hover:bg-muted/80"
                            : "opacity-50 cursor-not-allowed"
                        )}
                        title={feedback.type === 'feature' ? (userVotes.has(feedback.id) ? 'Remove vote' : 'Upvote') : 'Only feature requests can be voted'}
                      >
                        <ChevronUp className="h-4 w-4" />
                        <span className="text-xs font-medium">{feedback.vote_count}</span>
                      </button>
                      <div className="text-muted-foreground mt-1">
                        {getTypeIcon(feedback.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">
                          {feedback.title}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {feedback.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Submitted {new Date(feedback.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(feedback.status)}
                  </div>
                  <FeedbackComments feedbackId={feedback.id} initialCount={feedback.comment_count} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

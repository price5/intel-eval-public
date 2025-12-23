import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Send, Trash2, Edit2, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ProfileDialog } from '@/components/chat/ProfileDialog';
import { UserProfile } from '@/hooks/useProfile';
import { channelManager } from '@/lib/realtimeChannelManager';

interface Comment {
  id: string;
  feedback_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
}

interface FeedbackCommentsProps {
  feedbackId: string;
  initialCount?: number;
}

export const FeedbackComments: React.FC<FeedbackCommentsProps> = ({ feedbackId, initialCount = 0 }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    if (isExpanded) {
      loadComments();
      subscribeToComments();
    }
  }, [isExpanded, feedbackId]);

  const loadComments = async () => {
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from('feedback_comments')
        .select('*')
        .eq('feedback_id', feedbackId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      if (commentsData) {
        setComments(commentsData);

        // Fetch user profiles
        const userIds = [...new Set(commentsData.map(c => c.user_id))];
        if (userIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .in('user_id', userIds);

          if (profilesError) throw profilesError;

          const profilesMap: Record<string, UserProfile> = {};
          profilesData?.forEach(profile => {
            profilesMap[profile.user_id] = profile as UserProfile;
          });
          setUserProfiles(profilesMap);
        }
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const subscribeToComments = () => {
    let mounted = true;
    
    const setupChannel = async () => {
      await channelManager.getOrCreateChannel(
        `feedback-comments-${feedbackId}`,
        (ch) => ch
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'feedback_comments',
              filter: `feedback_id=eq.${feedbackId}`,
            },
            async (payload) => {
              if (!mounted) return;
              const newComment = payload.new as Comment;
              setComments(prev => [...prev, newComment]);

              // Fetch the user profile if we don't have it
              if (!userProfiles[newComment.user_id]) {
                const { data: profileData } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('user_id', newComment.user_id)
                  .single();

                if (profileData) {
                  setUserProfiles(prev => ({
                    ...prev,
                    [profileData.user_id]: profileData as UserProfile,
                  }));
                }
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'feedback_comments',
              filter: `feedback_id=eq.${feedbackId}`,
            },
            (payload) => {
              if (!mounted) return;
              setComments(prev => prev.filter(c => c.id !== payload.old.id));
            }
          )
          .subscribe()
      );
    };

    setupChannel();

    return () => {
      mounted = false;
      channelManager.removeChannel(`feedback-comments-${feedbackId}`);
    };
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('feedback_comments')
        .insert({
          feedback_id: feedbackId,
          user_id: user.id,
          comment: newComment.trim(),
        });

      if (error) throw error;

      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;

    try {
      const { error } = await supabase
        .from('feedback_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const startEditing = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditText(comment.comment);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditText('');
  };

  const handleEditComment = async (commentId: string) => {
    if (!editText.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('feedback_comments')
        .update({ 
          comment: editText.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId);

      if (error) throw error;

      setComments(prev => prev.map(c => 
        c.id === commentId 
          ? { ...c, comment: editText.trim(), updated_at: new Date().toISOString() }
          : c
      ));
      
      cancelEditing();
      toast.success('Comment updated');
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    } finally {
      setLoading(false);
    }
  };

  const canEditComment = (comment: Comment) => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const createdAt = new Date(comment.created_at);
    return createdAt > fiveMinutesAgo;
  };

  const handleProfileClick = (profile: UserProfile) => {
    setSelectedProfile(profile);
    setIsProfileOpen(true);
  };

  const commentCount = comments.length || initialCount;

  return (
    <div className="border-t border-border pt-3 mt-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <MessageCircle className="h-4 w-4" />
        <span>{commentCount} {commentCount === 1 ? 'comment' : 'comments'}</span>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Comment List */}
          <div className="space-y-3">
            {comments.map((comment) => {
              const profile = userProfiles[comment.user_id];
              const isOwner = user?.id === comment.user_id;

              const isEditing = editingCommentId === comment.id;

              return (
                <div key={comment.id} className="flex gap-3 items-start">
                  <Avatar className="h-8 w-8 flex-shrink-0 cursor-pointer mt-4" onClick={() => profile && handleProfileClick(profile)}>
                    {profile?.avatar_url && (
                      <AvatarImage src={profile.avatar_url} alt={profile.username} />
                    )}
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {profile?.username?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => profile && handleProfileClick(profile)}
                        className="text-sm font-medium hover:underline"
                      >
                        {profile?.username || 'Unknown'}
                      </button>
                      {profile?.achievement_role && (
                        <span className="text-xs text-muted-foreground">
                          {profile.achievement_role}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        {comment.updated_at !== comment.created_at && ' (edited)'}
                      </span>
                      {isOwner && (
                        <div className="ml-auto flex gap-1">
                          {!isEditing && canEditComment(comment) && (
                            <button
                              onClick={() => startEditing(comment)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              title="Edit comment"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            title="Delete comment"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {isEditing ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={3}
                          maxLength={1000}
                          className="resize-none"
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleEditComment(comment.id)}
                            disabled={loading || !editText.trim()}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEditing}
                            disabled={loading}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {editText.length}/1000
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-foreground whitespace-pre-wrap break-words -mt-3">
                        {comment.comment}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {comments.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>

          {/* Add Comment Form */}
          {user && (
            <form onSubmit={handleSubmitComment} className="space-y-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                maxLength={1000}
                className="resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {newComment.length}/1000
                </span>
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading || !newComment.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Post Comment
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      <ProfileDialog
        profile={selectedProfile}
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
      />
    </div>
  );
};

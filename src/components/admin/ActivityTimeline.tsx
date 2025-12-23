import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Award,
  Code,
  FileText,
  MessageSquare,
  Trophy,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';

interface TimelineEvent {
  id: string;
  type: 'assessment' | 'practice' | 'chat' | 'achievement' | 'practice_problem';
  title: string;
  description: string;
  timestamp: string;
  metadata?: any;
  status?: string;
  score?: number;
}

interface ActivityTimelineProps {
  userId: string;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ userId }) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchActivityTimeline();
    }
  }, [userId]);

  const fetchActivityTimeline = async () => {
    try {
      setLoading(true);
      const allEvents: TimelineEvent[] = [];

      // Fetch assessment submissions
      const { data: assessments } = await supabase
        .from('assessment_submissions')
        .select(`
          id,
          submitted_at,
          overall_score,
          status,
          assessment_id,
          assessments (title)
        `)
        .eq('student_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(20);

      if (assessments) {
        assessments.forEach((assessment: any) => {
          allEvents.push({
            id: assessment.id,
            type: 'assessment',
            title: 'Assessment Submission',
            description: `Submitted "${assessment.assessments?.title}" - Score: ${assessment.overall_score || 0}%`,
            timestamp: assessment.submitted_at,
            status: assessment.status,
            score: assessment.overall_score,
          });
        });
      }

      // Fetch practice sessions
      const { data: practices } = await supabase
        .from('practice_sessions')
        .select('id, created_at, overall_score, language')
        .eq('student_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (practices) {
        practices.forEach((practice) => {
          allEvents.push({
            id: practice.id,
            type: 'practice',
            title: 'Practice Session',
            description: `Completed practice in ${practice.language} - Score: ${practice.overall_score}%`,
            timestamp: practice.created_at,
            score: practice.overall_score,
          });
        });
      }

      // Fetch practice problem submissions
      const { data: problemSubmissions } = await supabase
        .from('practice_problem_submissions')
        .select(`
          id,
          submitted_at,
          overall_score,
          status,
          problem_id,
          practice_problems (title)
        `)
        .eq('student_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(20);

      if (problemSubmissions) {
        problemSubmissions.forEach((submission: any) => {
          allEvents.push({
            id: submission.id,
            type: 'practice_problem',
            title: 'Practice Problem',
            description: `Submitted "${submission.practice_problems?.title}" - Score: ${submission.overall_score || 0}%`,
            timestamp: submission.submitted_at,
            status: submission.status,
            score: submission.overall_score,
          });
        });
      }

      // Fetch chat messages (limited to prevent overwhelming data)
      const { data: messages } = await supabase
        .from('chat_messages')
        .select(`
          id,
          created_at,
          content,
          chat_channels (name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(15);

      if (messages) {
        messages.forEach((message: any) => {
          allEvents.push({
            id: message.id,
            type: 'chat',
            title: 'Chat Message',
            description: `Posted in #${message.chat_channels?.name}: "${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}"`,
            timestamp: message.created_at,
          });
        });
      }

      // Fetch achievements
      const { data: achievements } = await supabase
        .from('user_achievements')
        .select(`
          id,
          earned_at,
          achievements (name, description, icon, points)
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false })
        .limit(20);

      if (achievements) {
        achievements.forEach((achievement: any) => {
          allEvents.push({
            id: achievement.id,
            type: 'achievement',
            title: 'Achievement Unlocked',
            description: `${achievement.achievements?.icon} ${achievement.achievements?.name} - ${achievement.achievements?.description}`,
            timestamp: achievement.earned_at,
            metadata: { points: achievement.achievements?.points },
          });
        });
      }

      // Sort all events by timestamp
      allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setEvents(allEvents.slice(0, 50)); // Limit to 50 most recent events
    } catch (error) {
      console.error('Error fetching activity timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'assessment':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'practice':
        return <Code className="h-5 w-5 text-purple-500" />;
      case 'practice_problem':
        return <Code className="h-5 w-5 text-indigo-500" />;
      case 'chat':
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      case 'achievement':
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      default:
        return <Calendar className="h-5 w-5 text-gray-500" />;
    }
  };

  const getScoreBadge = (score?: number, status?: string) => {
    if (status === 'pending') {
      return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
    }
    if (score === undefined || score === null) return null;
    
    if (score >= 90) {
      return <Badge className="bg-green-500 gap-1"><CheckCircle2 className="h-3 w-3" />{score}%</Badge>;
    } else if (score >= 70) {
      return <Badge className="bg-blue-500 gap-1">{score}%</Badge>;
    } else if (score >= 50) {
      return <Badge className="bg-orange-500 gap-1">{score}%</Badge>;
    } else {
      return <Badge className="bg-red-500 gap-1"><XCircle className="h-3 w-3" />{score}%</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {events.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No activity recorded yet
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event, index) => (
                <div key={event.id} className="relative">
                  {/* Timeline line */}
                  {index < events.length - 1 && (
                    <div className="absolute left-[18px] top-10 bottom-0 w-[2px] bg-border" />
                  )}
                  
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-muted flex items-center justify-center relative z-10">
                      {getEventIcon(event.type)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 pb-6">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{event.title}</span>
                            {getScoreBadge(event.score, event.status)}
                            {event.metadata?.points && (
                              <Badge variant="outline" className="gap-1">
                                <Award className="h-3 w-3" />
                                +{event.metadata.points} pts
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {event.description}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(event.timestamp), 'MMM dd, HH:mm')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
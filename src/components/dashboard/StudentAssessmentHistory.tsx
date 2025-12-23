import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronLeft, Calendar, Clock, Trophy, FileText, Code, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

interface AssessmentSubmission {
  id: string;
  assessment_id: string;
  code: string;
  explanation: string;
  language: string;
  code_score: number;
  explanation_score: number;
  overall_score: number;
  submitted_at: string;
  strengths: string[] | null;
  improvements: string[] | null;
  recommendations: string[] | null;
  code_feedback: string;
  explanation_feedback: string;
  tab_switch_count: number;
  assessments: {
    title: string;
    difficulty: string;
    points: number;
  };
}

interface StudentAssessmentHistoryProps {
  onBack?: () => void; // Optional - only used if needed for specific navigation flows
}

export const StudentAssessmentHistory: React.FC<StudentAssessmentHistoryProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<AssessmentSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<AssessmentSubmission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubmissions();
    }
  }, [user]);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('assessment_submissions')
        .select(`
          *,
          assessments (
            title,
            difficulty,
            points
          )
        `)
        .eq('student_id', user?.id)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      
      // Filter out submissions without scores (incomplete evaluations) and missing assessment data
      const submissionsWithScores = data?.filter(submission => 
        submission.overall_score !== null && 
        submission.code_score !== null && 
        submission.explanation_score !== null &&
        submission.assessments !== null
      ) || [];
      
      setSubmissions(submissionsWithScores.map(submission => ({
        ...submission,
        strengths: Array.isArray(submission.strengths) ? submission.strengths as string[] : [],
        improvements: Array.isArray(submission.improvements) ? submission.improvements as string[] : [],
        recommendations: Array.isArray(submission.recommendations) ? submission.recommendations as string[] : []
      })));
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (selectedSubmission) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setSelectedSubmission(null)}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to History
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{selectedSubmission.assessments.title}</h2>
            <p className="text-muted-foreground">
              Submitted on {format(new Date(selectedSubmission.submitted_at), 'PPP')}
            </p>
          </div>
        </div>

        {/* Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className={`text-2xl font-bold ${getScoreColor(selectedSubmission.code_score)}`}>
                {selectedSubmission.code_score}/100
              </div>
              <p className="text-sm text-muted-foreground">Code Quality</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className={`text-2xl font-bold ${getScoreColor(selectedSubmission.explanation_score)}`}>
                {selectedSubmission.explanation_score}/100
              </div>
              <p className="text-sm text-muted-foreground">Explanation Quality</p>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 text-center">
              <div className={`text-3xl font-bold ${getScoreColor(selectedSubmission.overall_score)}`}>
                {selectedSubmission.overall_score}/100
              </div>
              <p className="text-sm text-muted-foreground">IntelEval Index</p>
            </CardContent>
          </Card>
        </div>

        {/* Code and Explanation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Your Code ({selectedSubmission.language})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                <code>{selectedSubmission.code}</code>
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Your Explanation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap">
                {selectedSubmission.explanation}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Feedback */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Strengths</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {(selectedSubmission.strengths || []).map((strength, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">Code Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{selectedSubmission.code_feedback}</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-amber-600">Areas for Improvement</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {(selectedSubmission.improvements || []).map((improvement, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-amber-500 mt-1">•</span>
                      {improvement}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">Explanation Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{selectedSubmission.explanation_feedback}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-purple-600">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(selectedSubmission.recommendations || []).map((recommendation, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="text-purple-500 mt-1">•</span>
                  {recommendation}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Assessment Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Assessment Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Tab Switches</p>
                <p className="font-semibold">{selectedSubmission.tab_switch_count}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Language</p>
                <p className="font-semibold capitalize">{selectedSubmission.language}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Difficulty</p>
                <Badge className={getDifficultyColor(selectedSubmission.assessments.difficulty)}>
                  {selectedSubmission.assessments.difficulty}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Points</p>
                <p className="font-semibold">{selectedSubmission.assessments.points}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - no back button needed, use left panel navigation */}
      <div>
        <h2 className="text-2xl font-bold">Assessment History</h2>
        <p className="text-muted-foreground">
          View your past assessment submissions and performance
        </p>
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Assessments Yet</h3>
            <p className="text-muted-foreground">
              You haven't submitted any assessments yet. Take your first assessment to see results here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {submissions.map((submission) => (
            <Card key={submission.id} className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedSubmission(submission)}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{submission.assessments.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(submission.submitted_at), 'PPP')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {format(new Date(submission.submitted_at), 'p')}
                      </div>
                      <Badge className={getDifficultyColor(submission.assessments.difficulty)}>
                        {submission.assessments.difficulty}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getScoreColor(submission.overall_score)}`}>
                        {submission.overall_score}
                      </div>
                      <p className="text-xs text-muted-foreground">IntelEval Index</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">{submission.assessments.points} pts</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
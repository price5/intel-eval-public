import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Timer, Award, AlertCircle, Scale } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { toast } from 'sonner';

interface Assessment {
  id: string;
  title: string;
  description: string;
  problem_statement: string;
  problem_description: string;
  test_cases: any[];
  time_limit: number;
  difficulty: string;
  points: number;
  deadline: string | null;
  is_active: boolean;
  created_at: string;
  allow_reattempts: boolean | null;
  reattempt_scoring_method: string | null;
  code_weight: number | null;
  explanation_weight: number | null;
}

export const AssessmentTab = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isAssessmentActive, currentAssessmentId, completedAssessments, confirmNavigation } = useAssessment();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    averageScore: 0,
    completedCount: 0,
    hasData: false
  });

  useEffect(() => {
    fetchAssessments();
    fetchAssessmentStats();
  }, [user]);

  const fetchAssessments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssessments((data || []).map(assessment => ({
        ...assessment,
        test_cases: Array.isArray(assessment.test_cases) ? assessment.test_cases : []
      })) as Assessment[]);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      toast.error('Failed to fetch assessments');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssessmentStats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('assessment_submissions')
        .select('overall_score')
        .eq('student_id', user.id)
        .not('overall_score', 'is', null);

      if (error) throw error;

      if (data && data.length > 0) {
        const scores = data.map(submission => submission.overall_score).filter(score => score !== null);
        const averageScore = scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
        
        setStats({
          averageScore,
          completedCount: scores.length,
          hasData: true
        });
      } else {
        setStats({
          averageScore: 0,
          completedCount: 0,
          hasData: true
        });
      }
    } catch (error) {
      console.error('Error fetching assessment stats:', error);
    }
  };

  const getStatusBadge = (assessment: Assessment) => {
    if (assessment.deadline && new Date(assessment.deadline) < new Date()) {
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Expired</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Available</Badge>;
  };

  const getDifficultyBadge = (difficulty: string) => {
    const colors = {
      easy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      hard: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    return <Badge className={colors[difficulty as keyof typeof colors]}>{difficulty.toUpperCase()}</Badge>;
  };

  const getActionButton = (assessment: Assessment) => {
    if (assessment.deadline && new Date(assessment.deadline) < new Date()) {
      return <Button variant="outline" disabled>Expired</Button>;
    }

    // Check if this specific assessment is completed
    const isCompleted = completedAssessments.has(assessment.id);
    
    // If completed but reattempts are not allowed, show disabled button
    if (isCompleted && !assessment.allow_reattempts) {
      return (
        <Button variant="outline" disabled>
          Assessment Completed
        </Button>
      );
    }

    const handleStartAssessment = async () => {
      if (isAssessmentActive && currentAssessmentId !== assessment.id) {
        toast.error('Please complete your current assessment first.');
        return;
      }
      
      if (isAssessmentActive) {
        const canStart = await confirmNavigation();
        if (!canStart) return;
      }
      
      // Navigate to dedicated assessment session page
      navigate(`/assessment/session/${assessment.id}`);
    };

    return (
      <Button 
        onClick={handleStartAssessment}
        variant="default"
      >
        {isAssessmentActive && currentAssessmentId === assessment.id 
          ? 'Continue Assessment' 
          : isCompleted 
            ? 'Retake Assessment' 
            : 'Start Assessment'}
      </Button>
    );
  };

  if (loading) {
    return <div className="text-center p-8">Loading assessments...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Assessment Mode
          </CardTitle>
          <CardDescription>
            Take formal assessments created by your instructors. Assessments are timed and graded automatically.
          </CardDescription>
        </CardHeader>
      </Card>

      {assessments.length === 0 ? (
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="text-center p-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Assessments Available</h3>
            <p className="text-muted-foreground">
              Your instructors haven't created any assessments yet. Check back later!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {assessments.map((assessment) => (
            <Card key={assessment.id} className="bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{assessment.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {assessment.description}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {getDifficultyBadge(assessment.difficulty)}
                    {getStatusBadge(assessment)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Timer className="h-4 w-4" />
                      {assessment.time_limit} minutes
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4" />
                      {assessment.points} points
                    </div>
                    <div className="flex items-center gap-1">
                      <Scale className="h-4 w-4" />
                      Code: {assessment.code_weight || 70}% | Explanation: {assessment.explanation_weight || 30}%
                    </div>
                    {assessment.deadline && (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        Due: {new Date(assessment.deadline).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  {getActionButton(assessment)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Assessment Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {stats.hasData ? (stats.completedCount > 0 ? `${stats.averageScore}%` : '--') : '--'}
              </div>
              <div className="text-sm text-muted-foreground">Average Score</div>
            </div>
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.completedCount}</div>
              <div className="text-sm text-muted-foreground">Assessments Completed</div>
            </div>
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <div className="text-2xl font-bold text-primary">{assessments.length}</div>
              <div className="text-sm text-muted-foreground">Assessments Available</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
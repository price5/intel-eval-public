import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Eye, AlertTriangle, Users, FileText } from 'lucide-react';

interface Submission {
  id: string;
  student_id: string;
  score: number | null;
  overall_score: number | null;
  code_score: number | null;
  explanation_score: number | null;
  status: string;
  submitted_at: string;
  tab_switch_count: number;
  test_results: any;
  profiles?: {
    full_name: string;
    username: string;
  } | null;
}

interface ViewSubmissionsProps {
  assessmentId: string;
  assessmentTitle: string;
  onViewDetail: (submissionId: string) => void;
  onBack: () => void;
}

export const ViewSubmissions: React.FC<ViewSubmissionsProps> = ({
  assessmentId,
  assessmentTitle,
  onViewDetail,
  onBack
}) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    completedSubmissions: 0,
    averageScore: 0,
    averageTabSwitches: 0
  });

  useEffect(() => {
    fetchSubmissions();
  }, [assessmentId]);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('assessment_submissions')
        .select(`
          *,
          profiles!fk_assessment_submissions_student_profile(full_name, username)
        `)
        .eq('assessment_id', assessmentId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      
      const processedSubmissions = (data || []).map(submission => {
        const hasValidProfiles = submission.profiles && 
                                typeof submission.profiles === 'object' && 
                                submission.profiles !== null &&
                                'full_name' in (submission.profiles as any);
        
        return {
          ...submission,
          profiles: hasValidProfiles ? submission.profiles as any : null
        };
      });
      
      setSubmissions(processedSubmissions as unknown as Submission[]);
      calculateStats(processedSubmissions as unknown as Submission[]);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (submissions: Submission[]) => {
    const totalSubmissions = submissions.length;
    const completedSubmissions = submissions.filter(s => s.status === 'completed').length;
    const scoredSubmissions = submissions.filter(s => {
      const score = s.overall_score ?? s.score;
      return score !== null;
    });
    const averageScore = scoredSubmissions.length > 0 
      ? Math.round(scoredSubmissions.reduce((acc, s) => acc + (s.overall_score ?? s.score ?? 0), 0) / scoredSubmissions.length)
      : 0;
    const averageTabSwitches = totalSubmissions > 0 
      ? Math.round(submissions.reduce((acc, s) => acc + s.tab_switch_count, 0) / totalSubmissions)
      : 0;

    setStats({
      totalSubmissions,
      completedSubmissions,
      averageScore,
      averageTabSwitches
    });
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      running: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    return <Badge className={colors[status as keyof typeof colors]}>{status.toUpperCase()}</Badge>;
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground';
    if (score >= 80) return 'text-green-600 font-semibold';
    if (score >= 60) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  const getSuspiciousActivityBadge = (tabSwitches: number) => {
    if (tabSwitches === 0) return null;
    if (tabSwitches <= 2) return <Badge variant="secondary">{tabSwitches} switches</Badge>;
    if (tabSwitches <= 5) return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">{tabSwitches} switches</Badge>;
    return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">{tabSwitches} switches</Badge>;
  };

  if (loading) {
    return <div className="text-center p-8">Loading submissions...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Submissions - {assessmentTitle}
              </CardTitle>
              <CardDescription>
                View and analyze student submissions for this assessment
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onBack}>
              ← Back to Assessment History
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="text-center p-4">
            <div className="text-2xl font-bold text-primary">{stats.totalSubmissions}</div>
            <div className="text-sm text-muted-foreground">Total Submissions</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="text-center p-4">
            <div className="text-2xl font-bold text-green-600">{stats.completedSubmissions}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="text-center p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.averageScore}%</div>
            <div className="text-sm text-muted-foreground">Average Score</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="text-center p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.averageTabSwitches}</div>
            <div className="text-sm text-muted-foreground">Avg Tab Switches</div>
          </CardContent>
        </Card>
      </div>

      {/* Submissions Table */}
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center p-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Submissions Yet</h3>
              <p className="text-muted-foreground">
                No students have submitted this assessment yet. Check back later!
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Submitted At</TableHead>
                  <TableHead>Anti-Cheat</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{submission.profiles?.full_name || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">@{submission.profiles?.username || 'unknown'}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(submission.status)}</TableCell>
                    <TableCell>
                      <span className={getScoreColor(submission.overall_score ?? submission.score)}>
                        {(submission.overall_score ?? submission.score) !== null ? `${submission.overall_score ?? submission.score}%` : 'Pending'}
                      </span>
                      {submission.code_score !== null && submission.explanation_score !== null && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Code: {submission.code_score}% • Exp: {submission.explanation_score}%
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(submission.submitted_at).toLocaleDateString()}{' '}
                      {new Date(submission.submitted_at).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getSuspiciousActivityBadge(submission.tab_switch_count)}
                        {submission.tab_switch_count > 5 && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onViewDetail(submission.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
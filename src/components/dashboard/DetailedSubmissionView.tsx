import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Code, CheckCircle, XCircle, AlertTriangle, User, Clock, Award, FileText } from 'lucide-react';

interface DetailedSubmissionViewProps {
  submissionId: string;
  onBack: () => void;
}

interface SubmissionDetail {
  id: string;
  assessment_id: string;
  student_id: string;
  code: string;
  language: string;
  explanation: string | null;
  score: number | null;
  code_score: number | null;
  explanation_score: number | null;
  overall_score: number | null;
  status: string;
  submitted_at: string;
  evaluated_at: string | null;
  test_results: any;
  tab_switch_count: number;
  suspicious_activity: any;
  code_feedback: string | null;
  explanation_feedback: string | null;
  profiles?: {
    full_name: string;
    username: string;
    usn: string;
  };
  assessments?: {
    title: string;
    points: number;
  };
}

export const DetailedSubmissionView: React.FC<DetailedSubmissionViewProps> = ({
  submissionId,
  onBack
}) => {
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissionDetail();
  }, [submissionId]);

  const fetchSubmissionDetail = async () => {
    try {
      const { data, error } = await supabase
        .from('assessment_submissions')
        .select(`
          *,
          profiles(full_name, username, usn),
          assessments(title, points)
        `)
        .eq('id', submissionId)
        .single();

      if (error) throw error;
      const submissionData = {
        ...data,
        test_results: Array.isArray(data.test_results) ? data.test_results : [],
        suspicious_activity: Array.isArray(data.suspicious_activity) ? data.suspicious_activity : []
      };
      setSubmission(submissionData as unknown as SubmissionDetail);
    } catch (error) {
      console.error('Error fetching submission detail:', error);
      toast.error('Failed to fetch submission details');
    } finally {
      setLoading(false);
    }
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

  const getTestCaseResult = (testCase: any, index: number) => {
    const passed = testCase.passed;
    const isHidden = testCase.hidden || false;
    
    return (
      <div key={index} className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={passed ? "default" : "destructive"}>
              {passed ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <XCircle className="h-3 w-3 mr-1" />
              )}
              {testCase.name || `Test Case ${index + 1}`}
            </Badge>
            {isHidden && (
              <Badge variant="outline" className="text-xs">Hidden</Badge>
            )}
          </div>
          {passed ? (
            <span className="text-green-600 text-sm font-medium">✓ Passed</span>
          ) : (
            <span className="text-red-600 text-sm font-medium">✗ Failed</span>
          )}
        </div>
        
        {/* Only show details for non-hidden test cases or for instructors */}
        {!isHidden && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <label className="font-medium text-muted-foreground">Input</label>
              <pre className="bg-muted p-2 rounded mt-1 text-xs overflow-x-auto max-h-24">
                {testCase.input || 'No input'}
              </pre>
            </div>
            <div>
              <label className="font-medium text-muted-foreground">Expected</label>
              <pre className="bg-muted p-2 rounded mt-1 text-xs overflow-x-auto max-h-24">
                {testCase.expected || testCase.expected_output || 'No output'}
              </pre>
            </div>
            <div>
              <label className="font-medium text-muted-foreground">Actual</label>
              <pre className={`p-2 rounded mt-1 text-xs overflow-x-auto max-h-24 ${
                passed ? 'bg-green-50 text-green-800 dark:bg-green-900/20' : 'bg-red-50 text-red-800 dark:bg-red-900/20'
              }`}>
                {testCase.output || testCase.actual_output || 'No output'}
              </pre>
            </div>
          </div>
        )}
        
        {isHidden && (
          <p className="text-xs text-muted-foreground italic">
            Test case details are hidden for student privacy
          </p>
        )}
      </div>
    );
  };

  const getImprovementSuggestions = () => {
    if (!submission?.test_results) return [];
    
    const failedTests = submission.test_results.filter(test => !test.passed);
    const suggestions = [];

    if (failedTests.length > 0) {
      suggestions.push({
        area: "Logic Issues",
        suggestion: `${failedTests.length} test case(s) failed. Review the problem requirements and edge cases.`,
        severity: "high"
      });
    }

    if (submission.tab_switch_count > 5) {
      suggestions.push({
        area: "Academic Integrity",
        suggestion: "High number of tab switches detected. Discuss proper assessment protocols.",
        severity: "critical"
      });
    }

    if (submission.score && submission.score < 60) {
      suggestions.push({
        area: "Overall Performance",
        suggestion: "Score below 60%. Consider additional practice with similar problems.",
        severity: "medium"
      });
    }

    return suggestions;
  };

  if (loading) {
    return <div className="text-center p-8">Loading submission details...</div>;
  }

  if (!submission) {
    return <div className="text-center p-8">Submission not found</div>;
  }

  const improvements = getImprovementSuggestions();

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Submission Details - {submission.profiles?.full_name}
              </CardTitle>
              <CardDescription>
                {submission.assessments?.title} • USN: {submission.profiles?.usn}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Submissions
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="text-center p-4">
            <Award className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold text-primary">
              {submission.overall_score !== null ? `${submission.overall_score}%` : 
               submission.score !== null ? `${submission.score}%` : 'N/A'}
            </div>
            <div className="text-sm text-muted-foreground">Overall Score</div>
            {submission.code_score !== null && submission.explanation_score !== null && (
              <div className="text-xs text-muted-foreground mt-1">
                Code: {submission.code_score}% • Explanation: {submission.explanation_score}%
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="text-center p-4">
            <div className="mb-2">{getStatusBadge(submission.status)}</div>
            <div className="text-sm text-muted-foreground">Status</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="text-center p-4">
            <Clock className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <div className="text-sm font-medium">
              {new Date(submission.submitted_at).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Submitted At</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="text-center p-4">
            <AlertTriangle className={`h-6 w-6 mx-auto mb-2 ${
              submission.tab_switch_count > 5 ? 'text-red-500' : 
              submission.tab_switch_count > 2 ? 'text-yellow-500' : 'text-green-500'
            }`} />
            <div className="text-2xl font-bold">{submission.tab_switch_count}</div>
            <div className="text-sm text-muted-foreground">Tab Switches</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Tabs defaultValue="code" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="code">Code</TabsTrigger>
          <TabsTrigger value="explanation">Explanation</TabsTrigger>
          <TabsTrigger value="tests">Test Results</TabsTrigger>
          <TabsTrigger value="improvements">Improvements</TabsTrigger>
          <TabsTrigger value="integrity">Integrity Check</TabsTrigger>
        </TabsList>

        <TabsContent value="code">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Submitted Code ({submission.language})
              </CardTitle>
              {submission.code_score !== null && (
                <CardDescription>
                  Code Score: <span className="font-semibold text-foreground">{submission.code_score}%</span>
                  {submission.code_feedback && (
                    <span className="block mt-2 text-sm">{submission.code_feedback}</span>
                  )}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                <code>{submission.code}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="explanation">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Student Explanation
              </CardTitle>
              {submission.explanation_score !== null && (
                <CardDescription>
                  Explanation Score: <span className="font-semibold text-foreground">{submission.explanation_score}%</span>
                  {submission.explanation_feedback && (
                    <span className="block mt-2 text-sm">{submission.explanation_feedback}</span>
                  )}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {submission.explanation ? (
                <div className="prose dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap text-sm">{submission.explanation}</p>
                </div>
              ) : (
                <p className="text-muted-foreground italic">No explanation provided</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Test Case Results</CardTitle>
              <CardDescription>
                <div className="flex items-center gap-4 flex-wrap">
                  <span>
                    <span className="font-semibold text-foreground">
                      {submission.test_results?.filter((t: any) => t.passed).length || 0}
                    </span> of {submission.test_results?.length || 0} test cases passed
                  </span>
                  {submission.test_results && submission.test_results.length > 0 && (
                    <>
                      <Badge variant="secondary">
                        {submission.test_results.filter((t: any) => !t.hidden).length} public
                      </Badge>
                      {submission.test_results.filter((t: any) => t.hidden).length > 0 && (
                        <Badge variant="outline">
                          {submission.test_results.filter((t: any) => t.hidden).length} hidden
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {submission.test_results && submission.test_results.length > 0 ? (
                submission.test_results.map((testCase, index) => getTestCaseResult(testCase, index))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No test results available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="improvements">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Areas for Improvement</CardTitle>
              <CardDescription>
                Specific recommendations for this student
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {improvements.length > 0 ? (
                improvements.map((improvement, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={
                        improvement.severity === 'critical' ? 'destructive' :
                        improvement.severity === 'high' ? 'default' : 'secondary'
                      }>
                        {improvement.area}
                      </Badge>
                      <span className="text-sm text-muted-foreground capitalize">
                        {improvement.severity} priority
                      </span>
                    </div>
                    <p className="text-sm">{improvement.suggestion}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-medium mb-2">Great Work!</h3>
                  <p className="text-muted-foreground">
                    No major areas for improvement identified. Keep up the good work!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrity">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Academic Integrity Analysis</CardTitle>
              <CardDescription>
                Anti-cheat monitoring results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className={`h-5 w-5 ${
                      submission.tab_switch_count > 5 ? 'text-red-500' : 
                      submission.tab_switch_count > 2 ? 'text-yellow-500' : 'text-green-500'
                    }`} />
                    <span className="font-medium">Tab Switching</span>
                  </div>
                  <p className="text-2xl font-bold mb-1">{submission.tab_switch_count}</p>
                  <p className="text-sm text-muted-foreground">
                    {submission.tab_switch_count === 0 ? 'No tab switches detected - excellent focus!' :
                     submission.tab_switch_count <= 2 ? 'Minimal tab switching - acceptable behavior' :
                     submission.tab_switch_count <= 5 ? 'Moderate tab switching - monitor closely' :
                     'Excessive tab switching - potential integrity concern'}
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Copy/Paste Protection</span>
                  </div>
                  <p className="text-sm text-green-600 mb-1">Active</p>
                  <p className="text-sm text-muted-foreground">
                    Copy-paste was disabled during assessment
                  </p>
                </div>
              </div>

              {submission.suspicious_activity && submission.suspicious_activity.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Suspicious Activity Log</h4>
                  <div className="space-y-2">
                    {submission.suspicious_activity.map((activity, index) => (
                      <div key={index} className="text-sm bg-muted p-2 rounded">
                        {JSON.stringify(activity)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
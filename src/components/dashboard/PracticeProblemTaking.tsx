import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useAchievementTracking } from '@/hooks/useAchievementTracking';
import { ArrowLeft, Play, Send, Loader2, CheckCircle, XCircle } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { ResultsPage } from './ResultsPage';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface PracticeProblem {
  id: string;
  title: string;
  description: string;
  problem_statement: string;
  problem_description: string;
  difficulty: string;
  topic: string;
  points: number;
  test_cases: Array<{
    input: string;
    expected_output: string;
    description?: string;
  }>;
  hidden_test_cases: Array<{
    input: string;
    expected_output: string;
    description?: string;
  }>;
}

interface TestResult {
  passed: boolean;
  input: string;
  expected: string;
  actual: string;
  description?: string;
}

interface PracticeProblemTakingProps {
  problemId: string;
  onBack: () => void;
}

const languages = [
  { value: 'python', label: 'Python', template: '# Write your Python solution here\n' },
  { value: 'javascript', label: 'JavaScript', template: '// Write your JavaScript solution here\n' },
  { value: 'java', label: 'Java', template: 'public class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}' },
  { value: 'cpp', label: 'C++', template: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}' },
  { value: 'c', label: 'C', template: '#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}' }
];

export const PracticeProblemTaking = ({ problemId, onBack }: PracticeProblemTakingProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { trackEvent } = useAchievementTracking();
  const [problem, setProblem] = useState<PracticeProblem | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [code, setCode] = useState(languages[0].template);
  const [explanation, setExplanation] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [hiddenTestResults, setHiddenTestResults] = useState<{ passed: number; total: number } | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('test-cases');

  useEffect(() => {
    fetchProblem();
  }, [problemId]);

  const fetchProblem = async () => {
    try {
      const { data, error } = await supabase
        .from('practice_problems')
        .select('*')
        .eq('id', problemId)
        .single();

      if (error) throw error;
      setProblem(data as unknown as PracticeProblem);
    } catch (error: any) {
      console.error('Error fetching problem:', error);
      toast({
        title: 'Error',
        description: 'Failed to load problem',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    const selectedLang = languages.find(lang => lang.value === language);
    setCode(selectedLang?.template || '');
  };

  const runTests = async () => {
    if (!code.trim() || !problem) {
      toast({
        title: 'No Code',
        description: 'Please write your solution first',
        variant: 'destructive',
      });
      return;
    }

    setIsRunning(true);
    setTestResults([]);
    setHiddenTestResults(null);

    try {
      // Run all test cases in a single batch request
      const { data, error } = await supabase.functions.invoke('code-execution', {
        body: {
          language: selectedLanguage,
          code: code,
          testCases: problem.test_cases,
          hiddenTestCases: problem.hidden_test_cases,
        },
      });

      if (error) throw error;

      // Extract public test results
      const publicResults = data.testResults?.test_results?.filter((r: any) => r.test_type === 'public') || [];
      const testResultsData: TestResult[] = publicResults.map((r: any) => ({
        passed: r.passed,
        input: r.input,
        expected: r.expected_output,
        actual: r.actual_output,
        description: r.name,
      }));

      setTestResults(testResultsData);
      
      // Extract hidden test results
      const hiddenResults = data.testResults?.test_results?.filter((r: any) => r.test_type === 'hidden') || [];
      const hiddenPassedCount = hiddenResults.filter((r: any) => r.passed).length;
      setHiddenTestResults({ passed: hiddenPassedCount, total: problem.hidden_test_cases.length });
      
      // Switch to results tab
      setActiveTab('results');
    } catch (error: any) {
      console.error('Error running tests:', error);
      toast({
        title: 'Error',
        description: 'Failed to run tests',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim() || !explanation.trim() || !problem || !user) {
      toast({
        title: 'Incomplete Submission',
        description: 'Please provide both code and explanation',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Run all test cases in a single batch request
      const { data: testData, error: testError } = await supabase.functions.invoke('code-execution', {
        body: {
          language: selectedLanguage,
          code: code,
          testCases: problem.test_cases,
          hiddenTestCases: problem.hidden_test_cases,
        },
      });

      if (testError) throw testError;

      // Extract test results
      const allResults = testData.testResults?.test_results || [];
      const results: TestResult[] = allResults.map((r: any) => ({
        passed: r.passed,
        input: r.input,
        expected: r.expected_output,
        actual: r.actual_output,
      }));

      // Calculate test score
      const passedTests = results.filter(r => r.passed).length;
      const totalTests = problem.test_cases.length + problem.hidden_test_cases.length;
      const testScore = Math.round((passedTests / totalTests) * 100);

      // Get AI evaluation
      const { data: aiData, error: aiError } = await supabase.functions.invoke('ai-evaluation', {
        body: {
          code,
          explanation,
          language: selectedLanguage,
          codeWeight: 70,
          explanationWeight: 30,
          problemStatement: problem.problem_statement,
        },
      });

      if (aiError) throw aiError;

      // Save submission
      const { error: saveError } = await supabase
        .from('practice_problem_submissions')
        .insert({
          problem_id: problemId,
          student_id: user.id,
          code,
          explanation,
          language: selectedLanguage,
          code_score: aiData.codeScore,
          explanation_score: aiData.explanationScore,
          overall_score: Math.round((aiData.codeScore + aiData.explanationScore + testScore) / 3),
          code_feedback: aiData.feedback.code,
          explanation_feedback: aiData.feedback.explanation,
          code_heatmap: aiData.codeHeatmap || [] as any,
          explanation_heatmap: aiData.explanationHeatmap || [] as any,
          test_results: results as any,
          strengths: aiData.strengths || [] as any,
          improvements: aiData.improvements || [] as any,
          recommendations: aiData.recommendations || [] as any,
          status: 'completed',
          evaluated_at: new Date().toISOString(),
        } as any);

      if (saveError) throw saveError;

      // Track achievement
      await trackEvent('practice_problem_completed', { problemId, score: aiData.overallScore });

      // Set evaluation result
      setEvaluationResult({
        codeScore: aiData.codeScore,
        explanationScore: aiData.explanationScore,
        overallScore: Math.round((aiData.codeScore + aiData.explanationScore + testScore) / 3),
        strengths: aiData.strengths || [],
        improvements: aiData.improvements || [],
        recommendations: aiData.recommendations || [],
        feedback: aiData.feedback,
        codeHeatmap: aiData.codeHeatmap || [],
        explanationHeatmap: aiData.explanationHeatmap || [],
      });

      setShowResults(true);
      toast({
        title: 'Submission Complete!',
        description: 'Your solution has been evaluated',
      });
    } catch (error: any) {
      console.error('Error submitting solution:', error);
      toast({
        title: 'Submission Failed',
        description: error.message || 'Failed to submit solution',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading problem...</div>;
  }

  if (!problem) {
    return <div className="text-center py-8 text-muted-foreground">Problem not found</div>;
  }

  if (showResults && evaluationResult) {
    return (
      <ResultsPage 
        evaluation={evaluationResult}
        code={code}
        explanation={explanation}
        language={selectedLanguage}
        codeWeight={70}
        onStartNew={onBack}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="ghost">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Problems
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant={problem.difficulty === 'easy' ? 'default' : problem.difficulty === 'medium' ? 'secondary' : 'destructive'}>
            {problem.difficulty}
          </Badge>
          <Badge variant="outline">{problem.topic}</Badge>
        </div>
      </div>

      <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
        <h1 className="text-2xl font-bold text-foreground mb-4">{problem.title}</h1>
        <p className="text-muted-foreground mb-4">{problem.description}</p>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Problem Statement</h3>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {problem.problem_statement}
              </ReactMarkdown>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Description</h3>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {problem.problem_description}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Your Solution</h3>
            <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="border border-border rounded-md overflow-hidden mb-4">
            <Editor
              height="400px"
              language={selectedLanguage === 'cpp' ? 'cpp' : selectedLanguage}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Explanation (required for evaluation)
              </label>
              <Textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Explain your approach, algorithm, time/space complexity..."
                rows={6}
                className="bg-background"
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={runTests} disabled={isRunning || isSubmitting} variant="outline" className="flex-1">
                {isRunning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                Run Tests
              </Button>
              <Button onClick={handleSubmit} disabled={isRunning || isSubmitting} className="flex-1">
                {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Submit Solution
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="test-cases">Test Cases</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>
            
            <TabsContent value="test-cases" className="space-y-4 mt-4">
              <h3 className="text-lg font-semibold text-foreground">Sample Test Cases</h3>
              {problem.test_cases.map((testCase, index) => (
                <Card key={index} className="p-4 bg-background/50">
                  {testCase.description && (
                    <p className="text-sm font-medium text-muted-foreground mb-2">{testCase.description}</p>
                  )}
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-foreground">Input:</span>
                      <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">{testCase.input}</pre>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Expected Output:</span>
                      <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">{testCase.expected_output}</pre>
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>
            
            <TabsContent value="results" className="space-y-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Test Results</h3>
                {hiddenTestResults && (
                  <Badge variant="outline" className="text-sm">
                    Hidden Tests: {hiddenTestResults.passed}/{hiddenTestResults.total} passed
                  </Badge>
                )}
              </div>
              {testResults.length === 0 ? (
                <p className="text-sm text-muted-foreground">Run tests to see results</p>
              ) : (
                testResults.map((result, index) => (
                  <Card key={index} className={`p-4 ${result.passed ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/10 border-red-500/50'}`}>
                    <div className="flex items-start gap-2">
                      {result.passed ? (
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 space-y-2 text-sm">
                        <p className="font-medium text-foreground">Test Case {index + 1}</p>
                        {result.description && (
                          <p className="text-muted-foreground">{result.description}</p>
                        )}
                        <div>
                          <span className="font-medium text-foreground">Expected:</span>
                          <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto">{result.expected}</pre>
                        </div>
                        <div>
                          <span className="font-medium text-foreground">Actual:</span>
                          <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto">{result.actual}</pre>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

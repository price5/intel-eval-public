import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Code, Play, Loader2, ArrowRight, Trophy, BookOpen } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { supabase } from '@/integrations/supabase/client';
import { ResultsPage } from './ResultsPage';
import { useAchievementTracking } from '@/hooks/useAchievementTracking';
import { PracticeProblemsList } from './PracticeProblemsList';
import { PracticeProblemTaking } from './PracticeProblemTaking';

interface EvaluationResult {
  codeScore: number;
  explanationScore: number;
  overallScore: number;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  feedback: {
    code: string;
    explanation: string;
  };
}

export const PracticeTab = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { trackEvent } = useAchievementTracking();
  const [currentStep, setCurrentStep] = useState<'setup' | 'practice' | 'results' | 'problems' | 'problem-solving'>('setup');
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);
  const [codeWeight, setCodeWeight] = useState([70]);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [code, setCode] = useState('');
  const [explanation, setExplanation] = useState('');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);


  const languages = [
    { value: 'python', label: 'Python', template: '# Write your Python code here\nprint("Hello, World!")' },
    { value: 'javascript', label: 'JavaScript', template: '// Write your JavaScript code here\nconsole.log("Hello, World!");' },
    { value: 'java', label: 'Java', template: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}' },
    { value: 'cpp', label: 'C++', template: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}' },
    { value: 'c', label: 'C', template: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}' }
  ];

  const startPractice = () => {
    if (!selectedLanguage) {
      toast({
        title: "Select Language",
        description: "Please select a programming language first.",
        variant: "destructive",
      });
      return;
    }
    
    const selectedLang = languages.find(lang => lang.value === selectedLanguage);
    setCode(selectedLang?.template || '');
    setExplanation('');
    setInput('');
    setOutput('');
    setEvaluation(null);
    setCurrentStep('practice');
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    const selectedLang = languages.find(lang => lang.value === language);
    setCode(selectedLang?.template || '');
  };

  const runCode = async () => {
    if (!code.trim()) {
      toast({
        title: "No Code",
        description: "Please write some code before running.",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    setOutput('');

    try {
      const { data, error } = await supabase.functions.invoke('code-execution', {
        body: {
          language: selectedLanguage,
          code: code,
          input: input
        }
      });

      if (error) throw error;

      if (data.success) {
        let outputText = data.stdout || data.output || '';
        
        // Add compile output if available
        if (data.compile_output) {
          outputText += `\n\n--- Compilation ---\n${data.compile_output}`;
        }
        
        if (data.time_ms || data.executionTime) {
          const time = data.time_ms || data.executionTime || 0;
          outputText += `\n\n--- Execution completed in ${time.toFixed(2)}ms ---`;
        }
        
        setOutput(outputText);
      } else {
        setOutput(data.stderr || data.output || data.error || 'Execution failed');
      }
    } catch (error) {
      console.error('Code execution error:', error);
      setOutput(`Error: ${error.message}`);
      toast({
        title: "Execution Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const evaluateSubmission = async () => {
    if (!code.trim() || !explanation.trim()) {
      toast({
        title: "Incomplete Submission",
        description: "Please provide both code and explanation before evaluation.",
        variant: "destructive",
      });
      return;
    }

    setIsEvaluating(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-evaluation', {
        body: {
          code: code,
          explanation: explanation,
          language: selectedLanguage,
          codeWeight: codeWeight[0],
          explanationWeight: 100 - codeWeight[0],
          problemStatement: 'Free-form coding practice'
        }
      });

      if (error) throw error;

      // Save practice session
      const { error: practiceError } = await supabase
        .from('practice_sessions')
        .insert({
          student_id: user.id,
          language: selectedLanguage,
          code: code,
          explanation: explanation,
          code_score: data.codeScore,
          explanation_score: data.explanationScore,
          overall_score: data.overallScore,
          code_weight: codeWeight[0],
          strengths: data.strengths,
          improvements: data.improvements,
          recommendations: data.recommendations,
          code_feedback: data.feedback.code,
          explanation_feedback: data.feedback.explanation
        });

      if (practiceError) {
        console.error('Error saving practice session:', practiceError);
        // Don't fail the evaluation if practice save fails
      }

      // Track achievement event
      trackEvent('solution_submitted', {
        language: selectedLanguage,
        score: data.overallScore,
        code_score: data.codeScore,
        explanation_score: data.explanationScore,
        is_practice: true
      });

      setEvaluation(data);
      setCurrentStep('results');
      toast({
        title: "Evaluation Complete",
        description: `IntelEval Index: ${data.overallScore}/100`,
      });
    } catch (error) {
      console.error('Evaluation error:', error);
      toast({
        title: "Evaluation Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  if (currentStep === 'problems') {
    return <PracticeProblemsList 
      onSelectProblem={(id) => { setSelectedProblemId(id); setCurrentStep('problem-solving'); }} 
      onBack={() => setCurrentStep('setup')}
    />;
  }

  if (currentStep === 'problem-solving' && selectedProblemId) {
    return <PracticeProblemTaking problemId={selectedProblemId} onBack={() => { setCurrentStep('problems'); setSelectedProblemId(null); }} />;
  }

  if (currentStep === 'results' && evaluation) {
    return (
      <ResultsPage 
        evaluation={evaluation}
        code={code}
        explanation={explanation}
        language={selectedLanguage}
        codeWeight={codeWeight[0]}
        onStartNew={() => {
          setCurrentStep('setup');
          setSelectedLanguage('');
          setCode('');
          setExplanation('');
          setInput('');
          setOutput('');
          setEvaluation(null);
        }}
      />
    );
  }

  if (currentStep === 'setup') {
    return (
      <div className="space-y-6">
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Practice Mode
            </CardTitle>
            <CardDescription>
              Choose your practice mode: solve curated problems or practice freely with any code.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Practice Problems Card */}
          <Card className="bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Practice Problems
              </CardTitle>
              <CardDescription>
                Solve curated coding problems across various topics like Data Structures, Algorithms, OOP, DBMS, and more.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span>Industry-standard problems</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span>Multiple difficulty levels</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span>Test cases and validation</span>
                </div>
              </div>
              <Button 
                onClick={() => setCurrentStep('problems')} 
                size="lg" 
                className="w-full"
              >
                Browse Problems <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Free Practice Card */}
          <Card className="bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                Free Practice
              </CardTitle>
              <CardDescription>
                Write any code in your preferred language and get AI-powered evaluation with the IntelEval index.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-primary" />
                  <span>Any programming language</span>
                </div>
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-primary" />
                  <span>Custom code and explanations</span>
                </div>
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-primary" />
                  <span>Flexible evaluation weights</span>
                </div>
              </div>
              <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select language..." />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={startPractice} 
                size="lg" 
                className="w-full"
                disabled={!selectedLanguage}
              >
                Start Free Practice <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Weightage Selection - Only show when language is selected */}
        {selectedLanguage && (
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Evaluation Weightage (Optional)</CardTitle>
              <CardDescription>
                Adjust the weightage between code quality and explanation quality for your IntelEval index calculation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Code Quality: {codeWeight[0]}%</span>
                  <span>Explanation Quality: {100 - codeWeight[0]}%</span>
                </div>
                <Slider
                  value={codeWeight}
                  onValueChange={setCodeWeight}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Practice Session - {languages.find(l => l.value === selectedLanguage)?.label}
              </CardTitle>
              <CardDescription>
                Write your code and explain your approach. Code: {codeWeight[0]}% | Explanation: {100 - codeWeight[0]}%
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => setCurrentStep('setup')}>
              Back to Setup
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Code Editor Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Code Editor</CardTitle>
                <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-40">
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
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Editor
                  height="300px"
                  language={selectedLanguage === 'cpp' ? 'cpp' : selectedLanguage}
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Input (Optional)</CardTitle>
              <CardDescription>
                Provide input for your program if needed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter input for your program..."
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Output</CardTitle>
                <Button 
                  onClick={runCode} 
                  disabled={isRunning || !code.trim()}
                  size="sm"
                >
                  {isRunning ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running</>
                  ) : (
                    <><Play className="h-4 w-4 mr-2" /> Run Code</>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 p-4 rounded-lg min-h-[200px] font-mono text-sm whitespace-pre-wrap">
                {output || 'Output will appear here...'}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Explanation</CardTitle>
              <CardDescription>
                Explain your approach, logic, and solution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Explain your solution, approach, and thought process..."
                className="min-h-[150px]"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submit and Evaluation */}
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <Button 
              onClick={evaluateSubmission}
              disabled={isEvaluating || !code.trim() || !explanation.trim()}
              size="lg"
              className="min-w-40"
            >
              {isEvaluating ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Evaluating...</>
              ) : (
                <>Submit for Evaluation</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Evaluation Results */}
      {evaluation && (
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Evaluation Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{evaluation.codeScore}</div>
                <div className="text-sm text-muted-foreground">Code Quality</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{evaluation.explanationScore}</div>
                <div className="text-sm text-muted-foreground">Explanation Quality</div>
              </div>
              <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="text-3xl font-bold text-primary">{evaluation.overallScore}</div>
                <div className="text-sm text-muted-foreground">Overall Score</div>
              </div>
            </div>

            <Separator />

            {/* Detailed Feedback */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-green-600 mb-2">Strengths</h4>
                  <ul className="space-y-1">
                    {evaluation.strengths.map((strength, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-blue-600 mb-2">Code Feedback</h4>
                  <p className="text-sm text-muted-foreground">
                    {evaluation.feedback.code}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-amber-600 mb-2">Areas for Improvement</h4>
                  <ul className="space-y-1">
                    {evaluation.improvements.map((improvement, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <span className="text-amber-500 mt-1">•</span>
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-blue-600 mb-2">Explanation Feedback</h4>
                  <p className="text-sm text-muted-foreground">
                    {evaluation.feedback.explanation}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold text-purple-600 mb-2">Recommendations</h4>
              <ul className="space-y-1">
                {evaluation.recommendations.map((recommendation, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <span className="text-purple-500 mt-1">•</span>
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
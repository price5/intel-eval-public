import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { toast } from 'sonner';
import { Clock, AlertTriangle, Send, Code, Loader2, Play, Eye, CheckCircle2, XCircle } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useAchievementTracking } from '@/hooks/useAchievementTracking';

interface Assessment {
  id: string;
  title: string;
  description: string;
  problem_statement: string;
  problem_description: string;
  test_cases: any[];
  hidden_test_cases: any[];
  time_limit: number;
  points: number;
  code_weight: number;
  explanation_weight: number;
}

interface AssessmentTakingProps {
  assessment: Assessment;
  onComplete: (submissionId?: string) => void;
  onCancel: () => void;
}

export const AssessmentTaking: React.FC<AssessmentTakingProps> = ({
  assessment,
  onComplete,
  onCancel
}) => {
  const { user } = useAuth();
  const { startAssessment: startAssessmentContext, endAssessment } = useAssessment();
  const { trackEvent } = useAchievementTracking();
  const [code, setCode] = useState('');
  const [explanation, setExplanation] = useState('');
  const [language, setLanguage] = useState('python');
  const [timeLeft, setTimeLeft] = useState(assessment.time_limit * 60);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [input, setInput] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [assessmentStarted, setAssessmentStarted] = useState(false);
  const [testResults, setTestResults] = useState<{
    publicPassed: number;
    publicTotal: number;
    hiddenPassed: number;
    hiddenTotal: number;
    publicDetails: Array<{passed: boolean; input: string; expected: string; actual: string}>;
  }>({ publicPassed: 0, publicTotal: 0, hiddenPassed: 0, hiddenTotal: 0, publicDetails: [] });
  
  // Enhanced anti-cheat state
  const [focusLossEvents, setFocusLossEvents] = useState<Array<{timestamp: number, type: string, detail?: string}>>([]);
  const [lastMouseActivity, setLastMouseActivity] = useState(Date.now());
  const [lastKeyboardActivity, setLastKeyboardActivity] = useState(Date.now());
  const focusCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const [isWindowFocused, setIsWindowFocused] = useState(true);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const fullscreenRetryTimeout = useRef<NodeJS.Timeout | null>(null);

  // Block navigation during assessment
  useEffect(() => {
    if (!assessmentStarted) return;

    const blockNavigation = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    const blockKeyboardShortcuts = (e: KeyboardEvent) => {
      // Block common navigation shortcuts
      if ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        toast.error('Page refresh is not allowed during assessments');
      }
      if (e.key === 'F5') {
        e.preventDefault();
        toast.error('Page refresh is not allowed during assessments');
      }
    };

    window.addEventListener('beforeunload', blockNavigation);
    document.addEventListener('keydown', blockKeyboardShortcuts);

    return () => {
      window.removeEventListener('beforeunload', blockNavigation);
      document.removeEventListener('keydown', blockKeyboardShortcuts);
    };
  }, [assessmentStarted]);

  // Anti-cheat: Disable right-click and copy-paste
  useEffect(() => {
    if (!assessmentStarted) return;

    const disableRightClick = (e: MouseEvent) => {
      e.preventDefault();
      toast.error('Right-click is disabled during assessments');
    };

    const disableCopyPaste = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
        e.preventDefault();
        toast.error('Copy-paste is disabled during assessments');
      }
    };

    const disableF12 = (e: KeyboardEvent) => {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
        toast.error('Developer tools are disabled during assessments');
      }
    };

    document.addEventListener('contextmenu', disableRightClick);
    document.addEventListener('keydown', disableCopyPaste);
    document.addEventListener('keydown', disableF12);

    return () => {
      document.removeEventListener('contextmenu', disableRightClick);
      document.removeEventListener('keydown', disableCopyPaste);
      document.removeEventListener('keydown', disableF12);
    };
  }, [assessmentStarted]);

  // Clean Anti-cheat system: Focus monitoring and tab switching only
  useEffect(() => {
    if (!assessmentStarted) return;

    let violationWarningShown = false;
    
    const handleVisibilityChange = () => {
      const now = Date.now();
      if (document.hidden || !document.hasFocus()) {
        const event = {
          timestamp: now,
          type: 'tab_switch',
          detail: 'User switched away from assessment'
        };
        setFocusLossEvents(prev => [...prev, event]);
        setTabSwitchCount(prev => prev + 1);
        
        // Show warning only once per violation to avoid spam
        if (!violationWarningShown) {
          setShowWarningDialog(true);
          violationWarningShown = true;
          setTimeout(() => { violationWarningShown = false; }, 2000);
        }
      }
    };

    const handleWindowBlur = () => {
      const now = Date.now();
      setIsWindowFocused(false);
      const event = {
        timestamp: now,
        type: 'window_blur',
        detail: 'User switched to another application'
      };
      setFocusLossEvents(prev => [...prev, event]);
      setTabSwitchCount(prev => prev + 1);
      
      if (!violationWarningShown) {
        setShowWarningDialog(true);
        violationWarningShown = true;
        setTimeout(() => { violationWarningShown = false; }, 2000);
      }
    };

    const handleWindowFocus = () => {
      setIsWindowFocused(true);
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [assessmentStarted]);

  // Flag to allow fullscreen exit during submission
  const [isSubmittingAssessment, setIsSubmittingAssessment] = useState(false);

  // Enhanced Fullscreen mode enforcement
  useEffect(() => {
    if (!assessmentStarted) return;

    const enterFullscreen = () => {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {
          toast.warning('Please enable fullscreen for better assessment security');
        });
      }
    };

    const handleFullscreenChange = () => {
      // Don't count fullscreen exit if we're in the process of submitting
      if (!document.fullscreenElement && assessmentStarted && !isSubmittingAssessment) {
        const event = {
          timestamp: Date.now(),
          type: 'fullscreen_exit',
          detail: 'User exited fullscreen mode'
        };
        setFocusLossEvents(prev => [...prev, event]);
        setFullscreenExitCount(prev => {
          const newCount = prev + 1;
          
          if (newCount === 1) {
            // First exit - show warning
            setShowFullscreenWarning(true);
            toast.error('⚠️ You have exited fullscreen mode. Please return to fullscreen immediately!');
          } else if (newCount === 2) {
            // Second exit - final warning
            toast.error('⚠️ FINAL WARNING: One more fullscreen exit will terminate your assessment!');
          } else if (newCount >= 3) {
            // Third exit - terminate assessment
            toast.error('Assessment terminated due to multiple fullscreen violations!');
            handleTerminateAssessment();
            return newCount;
          }
          
          return newCount;
        });
        
        // Clear any existing retry timeout
        if (fullscreenRetryTimeout.current) {
          clearTimeout(fullscreenRetryTimeout.current);
        }
        
        // Try to re-enter fullscreen after a delay (debounce)
        fullscreenRetryTimeout.current = setTimeout(() => {
          if (!document.fullscreenElement && assessmentStarted && !isSubmittingAssessment) {
            enterFullscreen();
          }
        }, 500);
      } else if (document.fullscreenElement) {
        // Successfully entered fullscreen - clear warning
        setShowFullscreenWarning(false);
      }
    };

    enterFullscreen();
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (fullscreenRetryTimeout.current) {
        clearTimeout(fullscreenRetryTimeout.current);
      }
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [assessmentStarted, isSubmittingAssessment]);

  // Timer countdown
  useEffect(() => {
    if (!assessmentStarted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, assessmentStarted]);

  const handleAutoSubmit = useCallback(async () => {
    if (!user || isSubmitting) return;
    
    toast.info('Time is up! Auto-submitting your code...');
    await evaluateAndSubmit();
  }, [user, isSubmitting]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const languages = [
    { value: 'python', label: 'Python', template: '# Write your Python solution here\n' },
    { value: 'javascript', label: 'JavaScript', template: '// Write your JavaScript solution here\n' },
    { value: 'java', label: 'Java', template: 'public class Solution {\n    // Write your Java solution here\n}' },
    { value: 'cpp', label: 'C++', template: '#include <iostream>\nusing namespace std;\n\n// Write your C++ solution here\n' },
    { value: 'c', label: 'C', template: '#include <stdio.h>\n\n// Write your C solution here\n' },
  ];

  const runCode = async () => {
    if (!code.trim()) {
      toast.error('Please write some code before running.');
      return;
    }

    setIsRunning(true);
    setOutput('');

    try {
      // If custom input is provided, only run with custom input (no test cases)
      // If no custom input, run with test cases
      const { data, error } = await supabase.functions.invoke('code-execution', {
        body: {
          language: language,
          code: code,
          input: input,
          testCases: input.trim() ? [] : (assessment.test_cases || []),
          hiddenTestCases: input.trim() ? [] : (assessment.hidden_test_cases || [])
        }
      });

      if (error) throw error;

      if (data.success) {
        let outputText = data.stdout || data.output || '';
        
        // Add compile output if available
        if (data.compile_output) {
          outputText += `\n\n--- Compilation ---\n${data.compile_output}`;
        }
        
        // Add test case results if available
        if (data.testResults) {
          const passedPublic = data.testResults.publicPassed || 0;
          const totalPublic = data.testResults.publicTotal || 0;
          const passedHidden = data.testResults.hiddenPassed || 0;
          const totalHidden = data.testResults.hiddenTotal || 0;
          
          outputText += '\n\n--- Test Results ---\n';
          outputText += `Public Test Cases: ${passedPublic}/${totalPublic} passed\n`;
          
          if (totalHidden > 0) {
            outputText += `Hidden Test Cases: ${passedHidden}/${totalHidden} passed\n`;
          }
          
          if (data.testResults.failures && data.testResults.failures.length > 0) {
            outputText += '\n--- Failed Test Cases ---\n';
            data.testResults.failures.forEach((failure: any, index: number) => {
              outputText += `Test ${index + 1}:\n`;
              outputText += `  Input: ${failure.input}\n`;
              outputText += `  Expected: "${failure.expected}"\n`;
              outputText += `  Got: "${failure.actual}"\n`;
            });
          }
          
          // Track test results for the Results tab
          if (!input.trim()) {
            const publicTests = data.testResults.test_results?.filter((t: any) => !t.hidden) || [];
            const hiddenTests = data.testResults.test_results?.filter((t: any) => t.hidden) || [];
            
            setTestResults({
              publicPassed: passedPublic,
              publicTotal: totalPublic,
              hiddenPassed: passedHidden,
              hiddenTotal: totalHidden,
              publicDetails: publicTests.map((t: any) => ({
                passed: t.passed,
                input: t.input || '',
                expected: t.expected || t.expected_output || '',
                actual: t.actual_output || t.output || ''
              }))
            });
          } else {
            // Clear test results when running with custom input
            setTestResults({ publicPassed: 0, publicTotal: 0, hiddenPassed: 0, hiddenTotal: 0, publicDetails: [] });
          }
        } else if (input.trim()) {
          // Clear test results when running with custom input
          setTestResults({ publicPassed: 0, publicTotal: 0, hiddenPassed: 0, hiddenTotal: 0, publicDetails: [] });
        }
        
        if (data.time_ms || data.executionTime) {
          const time = data.time_ms || data.executionTime || 0;
          outputText += `\n--- Execution completed in ${time.toFixed(2)}ms ---`;
        }
        
        setOutput(outputText);
      } else {
        setOutput(data.stderr || data.output || data.error || 'Execution failed');
      }
    } catch (error) {
      console.error('Code execution error:', error);
      setOutput(`Error: ${error.message}`);
      toast.error('Code execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  const evaluateAndSubmit = async () => {
    if (!user || !code.trim() || !explanation.trim()) {
      toast.error('Please provide both code and explanation.');
      return;
    }
    
    setIsEvaluating(true);
    setIsSubmittingAssessment(true); // Prevent fullscreen exit from being flagged
    
    try {
      // Exit fullscreen before showing results
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => {});
      }

      // First run code with test cases to get test results
      const { data: execData, error: execError } = await supabase.functions.invoke('code-execution', {
        body: {
          language: language,
          code: code,
          input: '',
          testCases: assessment.test_cases || [],
          hiddenTestCases: assessment.hidden_test_cases || []
        }
      });

      if (execError) throw execError;

      // Then evaluate with AI
      const { data: evalData, error: evalError } = await supabase.functions.invoke('ai-evaluation', {
        body: {
          code: code,
          explanation: explanation,
          language: language,
          codeWeight: assessment.code_weight || 70,
          explanationWeight: assessment.explanation_weight || 30,
          problemStatement: assessment.problem_statement
        }
      });

      if (evalError) throw evalError;

      // Prepare test results for storage
      const testResultsForDB = execData?.testResults?.test_results || [];
      
      // Then submit to database with evaluation results and test results
      const submissionData = {
        assessment_id: assessment.id,
        student_id: user.id,
        code,
        explanation,
        language,
        status: 'completed',
        tab_switch_count: tabSwitchCount,
        suspicious_activity: focusLossEvents,
        test_results: testResultsForDB,
        code_score: evalData.codeScore,
        explanation_score: evalData.explanationScore,
        overall_score: evalData.overallScore,
        score: evalData.overallScore,
        strengths: evalData.strengths,
        improvements: evalData.improvements,
        recommendations: evalData.recommendations,
        code_feedback: evalData.feedback.code,
        explanation_feedback: evalData.feedback.explanation,
        code_heatmap: evalData.codeHeatmap || [],
        explanation_heatmap: evalData.explanationHeatmap || []
      };

      const { data: submissionResult, error: submitError } = await supabase
        .from('assessment_submissions')
        .insert(submissionData)
        .select('id')
        .single();

      if (submitError) throw submitError;
      
      // Track achievement event
      trackEvent('assessment_completed', {
        assessment_id: assessment.id,
        score: evalData.overallScore,
        code_score: evalData.codeScore,
        explanation_score: evalData.explanationScore,
        passed: evalData.overallScore >= 60,
        language
      });
      
      // End assessment state to prevent "Continue Assessment" button
      endAssessment();
      
      toast.success('Assessment submitted and evaluated successfully!');
      
      // Navigate to results page
      if (submissionResult?.id) {
        onComplete(submissionResult.id);
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast.error('Failed to submit assessment');
    } finally {
      setIsSubmitting(false);
      setIsEvaluating(false);
      setIsSubmittingAssessment(false);
    }
  };

  const startAssessmentSession = () => {
    const selectedLang = languages.find(lang => lang.value === language);
    setCode(selectedLang?.template || '');
    setAssessmentStarted(true);
    startAssessmentContext(assessment.id);
    toast.success('Assessment started! Anti-cheat monitoring is active.');
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    const selectedLang = languages.find(lang => lang.value === newLanguage);
    setCode(selectedLang?.template || '');
  };

  const handleCancel = () => {
    // Exit fullscreen and end assessment when canceling
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    endAssessment();
    onCancel();
  };

  const handleTerminateAssessment = async () => {
    // Terminate assessment due to security violations
    if (!user) return;

    try {
      // Exit fullscreen
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => {});
      }

      // Save terminated assessment record
      const submissionData = {
        assessment_id: assessment.id,
        student_id: user.id,
        code: code || '// Assessment terminated due to security violations',
        explanation: explanation || 'Assessment terminated due to security violations',
        language,
        status: 'terminated',
        tab_switch_count: tabSwitchCount,
        suspicious_activity: [...focusLossEvents, {
          timestamp: Date.now(),
          type: 'assessment_terminated',
          detail: 'Multiple fullscreen violations detected'
        }],
        test_results: [],
        code_score: 0,
        explanation_score: 0,
        overall_score: 0,
        score: 0,
        strengths: [],
        improvements: ['Assessment was terminated due to security violations'],
        recommendations: ['Follow assessment guidelines in future attempts'],
        code_feedback: 'Assessment terminated',
        explanation_feedback: 'Assessment terminated'
      };

      const { error } = await supabase
        .from('assessment_submissions')
        .insert(submissionData);

      if (error) throw error;

      endAssessment();
      onCancel();
    } catch (error) {
      console.error('Error terminating assessment:', error);
      endAssessment();
      onCancel();
    }
  };

  // Assessment taking view starts here (no results view anymore, we navigate to results page)

  if (!assessmentStarted) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{assessment.title}</CardTitle>
          <CardDescription className="text-lg">
            {assessment.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <h3 className="font-semibold text-yellow-800">Assessment Guidelines & Security</h3>
            </div>
            <ul className="text-sm text-yellow-700 space-y-1 ml-6 list-disc">
              <li>Time limit: {assessment.time_limit} minutes</li>
              <li>Fullscreen mode is required - 3 exits will terminate the assessment</li>
              <li>Navigating away will CANCEL your assessment (no submission)</li>
              <li>Right-click and copy-paste will be disabled</li>
              <li>Tab switching is monitored and tracked</li>
              <li>Developer tools access is restricted</li>
              <li>Auto-submit when time runs out</li>
            </ul>
          </div>
          
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {assessment.time_limit} minutes
              </div>
              <div>
                {assessment.points} points
              </div>
            </div>
            
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={startAssessmentSession}>
                Start Assessment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Timer and Status Bar */}
      <Card className="bg-card/50 backdrop-blur-sm flex-shrink-0 rounded-none border-x-0 border-t-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span className={`font-mono text-lg ${timeLeft < 300 ? 'text-red-500' : ''}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              <Badge variant="secondary">
                {assessment.points} points
              </Badge>
              
              {/* Focus Status Indicator */}
              <div className="flex items-center gap-2">
                <Eye className={`h-4 w-4 ${isWindowFocused && !document.hidden ? 'text-green-500' : 'text-red-500'}`} />
                <span className="text-xs text-muted-foreground">
                  {isWindowFocused && !document.hidden ? 'Focused' : 'Focus Lost'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Enhanced Anti-cheat Status */}
              {focusLossEvents.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                  <span className="text-muted-foreground">
                    {focusLossEvents.length} events logged
                  </span>
                </div>
              )}
              
              {tabSwitchCount > 0 && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-4 w-4 ${
                    tabSwitchCount > 5 ? 'text-red-500' : 
                    tabSwitchCount > 2 ? 'text-yellow-500' : 'text-orange-500'
                  }`} />
                  <span className="text-sm">Violations: {tabSwitchCount}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex-1 min-h-0 px-4 py-6">
        <div className="grid grid-cols-12 gap-6 h-full">
          {/* Left Section - Problem Statement, Test Cases, Explanation */}
          <div className="col-span-12 lg:col-span-4 h-full flex flex-col">
            {/* Scrollable Top Section */}
            <div className="flex-1 overflow-y-auto min-h-0 mb-4">
              <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Problem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Problem Statement</h4>
                <p className="text-sm whitespace-pre-wrap">{assessment.problem_statement}</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm whitespace-pre-wrap">{assessment.problem_description}</p>
              </div>
              
              {assessment.test_cases && assessment.test_cases.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Public Test Cases</h4>
                  <div className="space-y-3">
                    {assessment.test_cases.map((testCase, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <Badge variant="outline" className="mb-2">Test Case {index + 1}</Badge>
                        <div className="space-y-2 text-xs">
                          <div>
                            <label className="font-medium">Input:</label>
                            <pre className="bg-muted p-2 rounded mt-1">{testCase.input}</pre>
                          </div>
                          <div>
                            <label className="font-medium">Expected Output:</label>
                            <pre className="bg-muted p-2 rounded mt-1">{testCase.expected_output}</pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
            </div>

            {/* Explanation Section - Fixed at Bottom */}
            <Card className="bg-card/50 backdrop-blur-sm flex-shrink-0">
              <CardHeader className="py-3">
                <CardTitle className="text-lg">Explanation</CardTitle>
                <CardDescription>
                  Explain your approach, logic, and solution (required for evaluation)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Explain your solution, approach, and thought process..."
                  className="min-h-[150px] resize-none"
                  required
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Section - Resizable Code Editor and Results */}
          <div className="col-span-12 lg:col-span-8 h-full">
            <ResizablePanelGroup direction="vertical" className="h-full rounded-lg border">
              {/* Code Editor Panel */}
              <ResizablePanel defaultSize={60} minSize={30}>
                <Card className="h-full bg-card/50 backdrop-blur-sm border-0 rounded-none flex flex-col">
                  <CardHeader className="flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Code className="h-5 w-5" />
                        Code Editor
                      </CardTitle>
                      <Select value={language} onValueChange={handleLanguageChange}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="python">Python</SelectItem>
                          <SelectItem value="javascript">JavaScript</SelectItem>
                          <SelectItem value="java">Java</SelectItem>
                          <SelectItem value="cpp">C++</SelectItem>
                          <SelectItem value="c">C</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 min-h-0 flex flex-col p-4">
                    <div className="border rounded-lg overflow-hidden flex-1 min-h-0">
                      <Editor
                        height="100%"
                        language={language === 'cpp' ? 'cpp' : language}
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
                          contextmenu: false,
                        }}
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-3 flex-shrink-0">
                      <Button 
                        onClick={runCode} 
                        disabled={isRunning || !code.trim()}
                        variant="outline"
                        size="sm"
                      >
                        {isRunning ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running</>
                        ) : (
                          <><Play className="h-4 w-4 mr-2" /> Run</>
                        )}
                      </Button>
                      <Button 
                        onClick={() => setShowConfirmDialog(true)}
                        disabled={isSubmitting || isEvaluating || !code.trim() || !explanation.trim()}
                        size="sm"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {isEvaluating ? 'Evaluating...' : isSubmitting ? 'Submitting...' : 'Submit'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Results and Custom Input Panel */}
              <ResizablePanel defaultSize={40} minSize={30}>
                <Card className="h-full bg-card/50 backdrop-blur-sm border-0 rounded-none flex flex-col">
                  <CardContent className="p-0 h-full flex flex-col min-h-0">
                    <Tabs defaultValue="results" className="h-full flex flex-col min-h-0">
                      <TabsList className="w-full justify-start rounded-none border-b flex-shrink-0">
                        <TabsTrigger value="results">Results</TabsTrigger>
                        <TabsTrigger value="custom-input">Custom Input</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="results" className="flex-1 p-4 overflow-auto m-0 min-h-0">
                      <div className="space-y-4">
                        {/* Output */}
                        <div>
                          <h4 className="font-semibold mb-2">Output</h4>
                          <div className="bg-muted/50 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
                            {output || 'Output will appear here...'}
                          </div>
                        </div>

                        {/* Test Results Summary */}
                        {testResults.publicTotal > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span className="text-sm font-medium">
                                  Public Test Cases: {testResults.publicPassed}/{testResults.publicTotal} passed
                                </span>
                              </div>
                              {testResults.hiddenTotal > 0 && (
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                                  <span className="text-sm font-medium">
                                    Hidden Test Cases: {testResults.hiddenPassed}/{testResults.hiddenTotal} passed
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Detailed Public Test Results */}
                            <div>
                              <h4 className="font-semibold mb-2 text-sm">Public Test Case Details</h4>
                              <div className="space-y-2">
                                {testResults.publicDetails.map((test, index) => (
                                  <div 
                                    key={index} 
                                    className={`border rounded-lg p-3 ${
                                      test.passed ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 mb-2">
                                      {test.passed ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                      ) : (
                                        <XCircle className="h-4 w-4 text-red-500" />
                                      )}
                                      <span className="text-sm font-medium">
                                        Test Case {index + 1}: {test.passed ? 'Passed' : 'Failed'}
                                      </span>
                                    </div>
                                    <div className="space-y-1 text-xs">
                                      <div>
                                        <span className="font-medium">Input:</span>
                                        <pre className="bg-muted p-2 rounded mt-1">{test.input}</pre>
                                      </div>
                                      <div>
                                        <span className="font-medium">Expected:</span>
                                        <pre className="bg-muted p-2 rounded mt-1">{test.expected}</pre>
                                      </div>
                                      <div>
                                        <span className="font-medium">Your Output:</span>
                                        <pre className="bg-muted p-2 rounded mt-1">{test.actual}</pre>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      </TabsContent>
                      
                      <TabsContent value="custom-input" className="flex-1 p-4 m-0 min-h-0">
                        <div className="h-full flex flex-col">
                          <div className="flex-shrink-0 mb-3">
                            <h4 className="font-semibold mb-2">Custom Input</h4>
                            <p className="text-sm text-muted-foreground">
                              Provide input for your program to test with custom data
                            </p>
                          </div>
                          <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Enter input for your program..."
                            className="flex-1 min-h-0 resize-none font-mono text-sm"
                          />
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Assessment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit your assessment? You cannot make changes after submission.
              
              {focusLossEvents.length > 0 && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                  <div className="text-red-800 text-sm">
                    <strong>Anti-cheat Summary:</strong>
                    <ul className="mt-1 text-xs space-y-1">
                      <li>• Focus violations: {tabSwitchCount}</li>
                      <li>• Total monitoring events: {focusLossEvents.length}</li>
                      <li>• Assessment integrity: {tabSwitchCount > 5 ? 'COMPROMISED' : tabSwitchCount > 2 ? 'AT RISK' : 'MONITORED'}</li>
                    </ul>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Working</AlertDialogCancel>
            <AlertDialogAction onClick={evaluateAndSubmit} disabled={isSubmitting || isEvaluating}>
              {isEvaluating ? 'Evaluating...' : isSubmitting ? 'Submitting...' : 'Submit Final Answer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tab Switch Warning Dialog */}
      <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Suspicious Activity Detected!
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3">
                <p>Our enhanced monitoring system detected focus loss or suspicious activity during the assessment.</p>
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Detection Summary:</strong>
                  </p>
                  <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                    <li>• Focus violations: {tabSwitchCount}</li>
                    <li>• Current window focus: {isWindowFocused ? '✓ Active' : '✗ Inactive'}</li>
                    <li>• Total events logged: {focusLossEvents.length}</li>
                  </ul>
                  {focusLossEvents.length > 0 && (
                    <div className="mt-2 text-xs text-gray-600">
                      <strong>Latest event:</strong> {focusLossEvents[focusLossEvents.length - 1]?.type.replace('_', ' ')} 
                      {focusLossEvents[focusLossEvents.length - 1]?.detail && 
                        ` - ${focusLossEvents[focusLossEvents.length - 1].detail}`
                      }
                    </div>
                  )}
                  {tabSwitchCount > 3 && (
                    <p className="text-sm text-red-600 mt-2">
                      ⚠️ Excessive violations may result in assessment disqualification.
                    </p>
                  )}
                </div>
                <p className="text-sm">Please maintain focus on the assessment tab. All activities are being monitored and logged.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowWarningDialog(false)}>
              I Understand - Continue Assessment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Fullscreen Exit Warning Dialog */}
      <AlertDialog open={showFullscreenWarning} onOpenChange={setShowFullscreenWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Fullscreen Mode Required!
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3">
                <p className="font-semibold">You have exited fullscreen mode. Please return to fullscreen immediately to continue the assessment.</p>
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-sm text-red-800">
                    <strong>⚠️ Security Warning:</strong>
                  </p>
                  <ul className="text-sm text-red-700 mt-2 space-y-1">
                    <li>• Fullscreen exits: {fullscreenExitCount}/3</li>
                    <li>• {fullscreenExitCount === 1 && 'First warning - Please stay in fullscreen'}
                        {fullscreenExitCount === 2 && 'FINAL WARNING - One more exit will terminate your assessment'}
                        {fullscreenExitCount >= 3 && 'Assessment will be terminated'}</li>
                  </ul>
                </div>
                <p className="text-sm">Fullscreen mode is required for assessment security. The system will attempt to re-enter fullscreen automatically.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowFullscreenWarning(false)}>
              I Understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
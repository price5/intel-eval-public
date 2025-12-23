import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, TrendingUp, Code2, MessageSquare, CheckCircle, AlertTriangle, XCircle, Home } from 'lucide-react';
import Editor from '@monaco-editor/react';

interface LineAnalysis {
  lineNumber: number;
  status: 'positive' | 'negative' | 'neutral';
  reason: string;
}

interface SentenceAnalysis {
  sentence: string;
  status: 'positive' | 'negative' | 'neutral';
  reason: string;
}

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
  codeHeatmap?: LineAnalysis[];
  explanationHeatmap?: SentenceAnalysis[];
}

interface AssessmentResultsPageProps {
  evaluation: EvaluationResult;
  code: string;
  explanation: string;
  language: string;
  codeWeight: number;
  onComplete: () => void;
}

export const AssessmentResultsPage: React.FC<AssessmentResultsPageProps> = ({
  evaluation,
  code,
  explanation,
  language,
  codeWeight,
  onComplete
}) => {
  // Ensure right-click and copy-paste are fully enabled on results page
  useEffect(() => {
    // Remove any existing event listeners that might be blocking interactions
    const originalPreventDefault = Event.prototype.preventDefault;
    
    // Create a whitelist for results page interactions
    Event.prototype.preventDefault = function() {
      const target = this.target as HTMLElement;
      const isResultsPage = target?.closest('[data-results-page="true"]');
      
      if (isResultsPage && (this.type === 'contextmenu' || 
          (this.type === 'keydown' && (this as KeyboardEvent).ctrlKey))) {
        return; // Don't prevent default on results page
      }
      
      return originalPreventDefault.call(this);
    };

    // Cleanup
    return () => {
      Event.prototype.preventDefault = originalPreventDefault;
    };
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (score >= 60) return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getIntelEvalRating = (score: number) => {
    if (score >= 90) return { rating: 'Exceptional', color: 'bg-green-500' };
    if (score >= 80) return { rating: 'Excellent', color: 'bg-blue-500' };
    if (score >= 70) return { rating: 'Good', color: 'bg-yellow-500' };
    if (score >= 60) return { rating: 'Fair', color: 'bg-orange-500' };
    return { rating: 'Needs Work', color: 'bg-red-500' };
  };

  const intelEvalRating = getIntelEvalRating(evaluation.overallScore);

  // Use AI-generated heatmap data
  const codeLines = code.split('\n');
  const codeHeatmap = evaluation.codeHeatmap || [];
  
  // Create a map for quick lookup
  const heatmapMap = new Map(
    codeHeatmap.map(item => [item.lineNumber - 1, item])
  );

  // Use AI-generated explanation heatmap
  const explanationHeatmap = evaluation.explanationHeatmap || [];

  return (
    <div className="space-y-6" data-results-page="true">
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Trophy className="h-6 w-6 text-primary" />
                Assessment Results
              </CardTitle>
              <CardDescription className="text-lg mt-1">
                Your comprehensive assessment evaluation is complete
              </CardDescription>
            </div>
            <Button onClick={onComplete} variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* IntelEval Index - Main Score */}
      <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-lg">IntelEval Index</CardTitle>
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="text-center">
              <div className={`text-6xl font-bold ${getScoreColor(evaluation.overallScore)}`}>
                {evaluation.overallScore}
              </div>
              <div className="text-sm text-muted-foreground">out of 100</div>
            </div>
            <div className="flex flex-col items-center gap-2">
              {getScoreIcon(evaluation.overallScore)}
              <Badge className={`${intelEvalRating.color} text-white`}>
                {intelEvalRating.rating}
              </Badge>
            </div>
          </div>
          <Progress value={evaluation.overallScore} className="w-full mt-4" />
        </CardHeader>
      </Card>

      {/* Score Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="h-5 w-5" />
              Code Quality ({codeWeight}%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-3">
              <div className={`text-3xl font-bold ${getScoreColor(evaluation.codeScore)}`}>
                {evaluation.codeScore}
              </div>
              {getScoreIcon(evaluation.codeScore)}
            </div>
            <Progress value={evaluation.codeScore} className="mb-4" />
            <p className="text-sm text-muted-foreground">
              {evaluation.feedback.code}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Explanation Quality ({100 - codeWeight}%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-3">
              <div className={`text-3xl font-bold ${getScoreColor(evaluation.explanationScore)}`}>
                {evaluation.explanationScore}
              </div>
              {getScoreIcon(evaluation.explanationScore)}
            </div>
            <Progress value={evaluation.explanationScore} className="mb-4" />
            <p className="text-sm text-muted-foreground">
              {evaluation.feedback.explanation}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Code Heatmap */}
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Code Analysis Heatmap
          </CardTitle>
          <CardDescription>
            Lines highlighted in green helped your score, red lines need improvement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <div className="relative">
              <Editor
                height="300px"
                language={language}
                value={code}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  lineHeight: 19,
                }}
              />
              <div className="absolute inset-0 pointer-events-none">
                {codeLines.map((_, index) => {
                  const analysis = heatmapMap.get(index);
                  if (!analysis || analysis.status === 'neutral') return null;
                  
                  return (
                    <div
                      key={index}
                      className={`absolute left-0 right-0 opacity-30 ${
                        analysis.status === 'positive' ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{
                        top: `${index * 19}px`,
                        height: '19px',
                      }}
                      title={analysis.reason}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Explanation Heatmap */}
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Explanation Analysis</CardTitle>
          <CardDescription>
            Sentence-by-sentence analysis: green = clear and accurate, red = needs improvement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {explanationHeatmap.length > 0 ? (
              explanationHeatmap.map((item, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    item.status === 'positive'
                      ? 'bg-green-500/10 border-green-500/30'
                      : item.status === 'negative'
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-muted/30 border-border/30'
                  }`}
                >
                  <p className="text-sm mb-2">{item.sentence}</p>
                  <p className="text-xs text-muted-foreground italic">{item.reason}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No detailed sentence analysis available for this evaluation.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Feedback */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-green-600 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {evaluation.strengths.map((strength, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="text-green-500 mt-1 text-xs">●</span>
                  {strength}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-amber-600 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {evaluation.improvements.map((improvement, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="text-amber-500 mt-1 text-xs">●</span>
                  {improvement}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-primary">Recommendations for Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {evaluation.recommendations.map((recommendation, index) => (
              <li key={index} className="text-sm flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                <span className="text-primary mt-1 font-bold">→</span>
                {recommendation}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Action Button */}
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <Button onClick={onComplete} size="lg">
              Return to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
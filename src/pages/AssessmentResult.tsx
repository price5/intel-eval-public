import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';
import { ResultsPage, PeerStatistics } from '@/components/dashboard/ResultsPage';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { toast } from 'sonner';

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

const AssessmentResult = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [code, setCode] = useState('');
  const [explanation, setExplanation] = useState('');
  const [language, setLanguage] = useState('python');
  const [codeWeight, setCodeWeight] = useState(70);
  const [peerStatistics, setPeerStatistics] = useState<PeerStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) {
      navigate('/dashboard');
      return;
    }

    fetchSubmissionResult();
  }, [id, user]);

  const fetchSubmissionResult = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('assessment_submissions')
        .select('*')
        .eq('id', id)
        .eq('student_id', user?.id)
        .single();

      if (error) throw error;

      if (!data) {
        toast.error('Submission not found');
        navigate('/dashboard');
        return;
      }

      // Parse the data with fallbacks for new fields
      const heatmapData = data as any; // Type assertion for fields not yet in schema
      
      setEvaluation({
        overallScore: data.overall_score || 0,
        codeScore: data.code_score || 0,
        explanationScore: data.explanation_score || 0,
        strengths: (data.strengths as string[]) || [],
        improvements: (data.improvements as string[]) || [],
        recommendations: (data.recommendations as string[]) || [],
        feedback: {
          code: data.code_feedback || '',
          explanation: data.explanation_feedback || '',
        },
        codeHeatmap: (heatmapData.code_heatmap as LineAnalysis[]) || [],
        explanationHeatmap: (heatmapData.explanation_heatmap as SentenceAnalysis[]) || [],
      });

      setCode(data.code || '');
      setExplanation(data.explanation || '');
      setLanguage(data.language || 'python');
      // For assessments, code weight is typically 70%
      setCodeWeight(70);

      // Fetch peer statistics for this assessment
      await fetchPeerStatistics(data.assessment_id, data.overall_score || 0, data.code_score || 0, data.explanation_score || 0);
    } catch (error) {
      console.error('Error fetching submission result:', error);
      toast.error('Failed to load results');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchPeerStatistics = async (
    assessmentId: string, 
    userOverallScore: number, 
    userCodeScore: number, 
    userExplanationScore: number
  ) => {
    try {
      // Fetch all completed submissions for this assessment
      const { data: submissions, error } = await supabase
        .from('assessment_submissions')
        .select('overall_score, code_score, explanation_score')
        .eq('assessment_id', assessmentId)
        .eq('status', 'completed')
        .not('overall_score', 'is', null)
        .not('code_score', 'is', null)
        .not('explanation_score', 'is', null);

      if (error) throw error;

      // Need at least 4 submissions for anonymity
      if (!submissions || submissions.length < 4) {
        setPeerStatistics({
          totalSubmissions: submissions?.length || 0,
          averageScores: { overall: 0, code: 0, explanation: 0 },
          percentiles: { p25: 0, p50: 0, p75: 0, p90: 0 },
          userPercentile: { overall: 0, code: 0, explanation: 0 },
          userScores: { overall: userOverallScore, code: userCodeScore, explanation: userExplanationScore }
        });
        return;
      }

      // Calculate averages
      const totalScores = submissions.reduce(
        (acc, sub) => ({
          overall: acc.overall + (sub.overall_score || 0),
          code: acc.code + (sub.code_score || 0),
          explanation: acc.explanation + (sub.explanation_score || 0)
        }),
        { overall: 0, code: 0, explanation: 0 }
      );

      const averageScores = {
        overall: totalScores.overall / submissions.length,
        code: totalScores.code / submissions.length,
        explanation: totalScores.explanation / submissions.length
      };

      // Calculate percentiles
      const sortedOverall = submissions.map(s => s.overall_score || 0).sort((a, b) => a - b);
      const percentiles = {
        p25: sortedOverall[Math.floor(sortedOverall.length * 0.25)],
        p50: sortedOverall[Math.floor(sortedOverall.length * 0.50)],
        p75: sortedOverall[Math.floor(sortedOverall.length * 0.75)],
        p90: sortedOverall[Math.floor(sortedOverall.length * 0.90)]
      };

      // Calculate user's percentile rank
      const calculatePercentile = (userScore: number, scores: number[]) => {
        const belowCount = scores.filter(s => s < userScore).length;
        return (belowCount / scores.length) * 100;
      };

      const userPercentile = {
        overall: calculatePercentile(userOverallScore, submissions.map(s => s.overall_score || 0)),
        code: calculatePercentile(userCodeScore, submissions.map(s => s.code_score || 0)),
        explanation: calculatePercentile(userExplanationScore, submissions.map(s => s.explanation_score || 0))
      };

      setPeerStatistics({
        totalSubmissions: submissions.length,
        averageScores,
        percentiles,
        userPercentile,
        userScores: {
          overall: userOverallScore,
          code: userCodeScore,
          explanation: userExplanationScore
        }
      });
    } catch (error) {
      console.error('Error fetching peer statistics:', error);
      // Don't show error to user, just skip peer comparison
      setPeerStatistics(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!evaluation) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      {/* Normal header with navigation restored */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <Home className="h-4 w-4" />
                Home
              </Button>
            </Link>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              IntelEval - Assessment Results
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link to="/dashboard">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <ResultsPage
          evaluation={evaluation}
          code={code}
          explanation={explanation}
          language={language}
          codeWeight={codeWeight}
          peerStatistics={peerStatistics}
          onStartNew={() => navigate('/dashboard')}
        />
      </main>
    </div>
  );
};

export default AssessmentResult;

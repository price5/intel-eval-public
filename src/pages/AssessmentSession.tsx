import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { AssessmentTaking } from '@/components/dashboard/AssessmentTaking';
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
  allow_reattempts: boolean;
  reattempt_scoring_method: string;
}

const AssessmentSession = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startAssessment, checkIfCompleted, loadingCompletedAssessments } = useAssessment();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) {
      navigate('/dashboard');
      return;
    }

    if (loadingCompletedAssessments) return;

    fetchAssessment();
  }, [id, user, loadingCompletedAssessments]);

  const fetchAssessment = async () => {
    if (!id || !user) return;

    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      if (!data) {
        toast.error('Assessment not found');
        navigate('/dashboard');
        return;
      }

      // Check if deadline has passed
      if (data.deadline && new Date(data.deadline) < new Date()) {
        toast.error('This assessment has expired');
        navigate('/dashboard');
        return;
      }

      // Check if user has already completed this assessment
      const hasCompleted = await checkIfCompleted(id);
      
      if (hasCompleted && !data.allow_reattempts) {
        toast.error('You have already completed this assessment. Reattempts are not allowed.');
        navigate('/dashboard');
        return;
      }

      if (hasCompleted && data.allow_reattempts) {
        toast.info(`Reattempt mode: ${data.reattempt_scoring_method === 'best_score' ? 'Best score will be kept' : data.reattempt_scoring_method === 'latest_score' ? 'Latest score will be used' : 'Average score will be calculated'}`);
      }

      setAssessment({
        ...data,
        test_cases: Array.isArray(data.test_cases) ? data.test_cases : []
      } as Assessment);

      // Start the assessment in context
      startAssessment(id);
    } catch (error) {
      console.error('Error fetching assessment:', error);
      toast.error('Failed to load assessment');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = (submissionId: string) => {
    // Navigate to results page
    navigate(`/assessment/result/${submissionId}`);
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  useEffect(() => {
    // Prevent accidental navigation away
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '⚠️ WARNING: Leaving this page will CANCEL your current assessment. Your progress will be lost.';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!assessment) {
    return null;
  }

  return (
    <div className="h-screen bg-background">
      {/* Completely isolated - no navigation, no header, just the assessment */}
      <AssessmentTaking
        assessment={assessment as any}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default AssessmentSession;

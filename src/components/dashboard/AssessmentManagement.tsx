import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateAssessmentForm } from './CreateAssessmentForm';
import { EditAssessmentForm } from './EditAssessmentForm';
import { ViewSubmissions } from './ViewSubmissions';
import { DetailedSubmissionView } from './DetailedSubmissionView';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Timer, Users, Calendar, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Assessment {
  id: string;
  title: string;
  description: string;
  problem_statement: string;
  problem_description: string;
  time_limit: number;
  difficulty: string;
  points: number;
  deadline: string | null;
  is_active: boolean;
  created_at: string;
}

export const AssessmentManagement = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit' | 'submissions' | 'detail'>('list');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  useEffect(() => {
    fetchAssessments();
  }, [user]);

  const fetchAssessments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssessments(data || []);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      toast.error('Failed to fetch assessments');
    } finally {
      setLoading(false);
    }
  };

  const handleAssessmentCreated = () => {
    setCurrentView('list');
    fetchAssessments();
    toast.success('Assessment created successfully!');
  };

  const getDifficultyBadge = (difficulty: string) => {
    const colors = {
      easy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      hard: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    return <Badge className={colors[difficulty as keyof typeof colors]}>{difficulty.toUpperCase()}</Badge>;
  };

  const getStatusBadge = (isActive: boolean, deadline: string | null) => {
    if (!isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (deadline && new Date(deadline) < new Date()) {
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Expired</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Active</Badge>;
  };

  if (loading) {
    return <div className="text-center p-8">Loading assessments...</div>;
  }

  // Handle different views
  if (currentView === 'create') {
    return (
      <div>
        <Button 
          variant="outline" 
          onClick={() => setCurrentView('list')}
          className="mb-4"
        >
          ← Back to Assessments
        </Button>
        <CreateAssessmentForm onSuccess={handleAssessmentCreated} />
      </div>
    );
  }

  if (currentView === 'edit' && selectedAssessmentId) {
    const assessment = assessments.find(a => a.id === selectedAssessmentId);
    return (
      <EditAssessmentForm
        assessmentId={selectedAssessmentId}
        onSuccess={() => { setCurrentView('list'); fetchAssessments(); }}
        onCancel={() => setCurrentView('list')}
      />
    );
  }

  if (currentView === 'submissions' && selectedAssessmentId) {
    const assessment = assessments.find(a => a.id === selectedAssessmentId);
    return (
      <ViewSubmissions
        assessmentId={selectedAssessmentId}
        assessmentTitle={assessment?.title || ''}
        onViewDetail={(submissionId) => {
          setSelectedSubmissionId(submissionId);
          setCurrentView('detail');
        }}
        onBack={() => setCurrentView('list')}
      />
    );
  }

  if (currentView === 'detail' && selectedSubmissionId) {
    return (
      <DetailedSubmissionView
        submissionId={selectedSubmissionId}
        onBack={() => setCurrentView('submissions')}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Assessment Management
              </CardTitle>
              <CardDescription>
                Create, manage, and monitor assessments for your students
              </CardDescription>
            </div>
            <Button onClick={() => setCurrentView('create')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Assessment
            </Button>
          </div>
        </CardHeader>
      </Card>

      {assessments.length === 0 ? (
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="text-center p-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Assessments Created</h3>
            <p className="text-muted-foreground mb-4">
              Create your first assessment to get started with testing your students.
            </p>
            <Button onClick={() => setCurrentView('create')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Assessment
            </Button>
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
                    {getStatusBadge(assessment.is_active, assessment.deadline)}
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
                      <FileText className="h-4 w-4" />
                      {assessment.points} points
                    </div>
                    {assessment.deadline && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Due: {new Date(assessment.deadline).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedAssessmentId(assessment.id);
                        setCurrentView('submissions');
                      }}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      View Submissions
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedAssessmentId(assessment.id);
                        setCurrentView('edit');
                      }}
                    >
                      Edit
                    </Button>
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
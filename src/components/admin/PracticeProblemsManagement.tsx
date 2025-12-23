import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { CreatePracticeProblemForm } from './CreatePracticeProblemForm';
import { EditPracticeProblemForm } from './EditPracticeProblemForm';

interface PracticeProblem {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  topic: string;
  points: number;
  is_active: boolean;
  created_at: string;
}

export const PracticeProblemsManagement = () => {
  const { user } = useAuth();
  const [problems, setProblems] = useState<PracticeProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProblems();
    }
  }, [user]);

  const fetchProblems = async () => {
    try {
      const { data, error } = await supabase
        .from('practice_problems')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProblems(data || []);
    } catch (error: any) {
      console.error('Error fetching practice problems:', error);
      toast.error('Failed to load practice problems');
    } finally {
      setLoading(false);
    }
  };

  const handleProblemCreated = () => {
    setCurrentView('list');
    fetchProblems();
  };

  const handleEdit = (problemId: string) => {
    setSelectedProblemId(problemId);
    setCurrentView('edit');
  };

  const handleEditComplete = () => {
    setCurrentView('list');
    setSelectedProblemId(null);
    fetchProblems();
  };

  const toggleActive = async (problemId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('practice_problems')
        .update({ is_active: !currentStatus })
        .eq('id', problemId);

      if (error) throw error;
      toast.success(`Problem ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchProblems();
    } catch (error: any) {
      console.error('Error toggling problem status:', error);
      toast.error('Failed to update problem status');
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    const variants = {
      easy: 'default',
      medium: 'secondary',
      hard: 'destructive',
    } as const;
    return (
      <Badge variant={variants[difficulty as keyof typeof variants] || 'default'}>
        {difficulty}
      </Badge>
    );
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading practice problems...</div>;
  }

  if (currentView === 'create') {
    return (
      <div>
        <Button onClick={() => setCurrentView('list')} variant="ghost" className="mb-4">
          ← Back to List
        </Button>
        <CreatePracticeProblemForm onSuccess={handleProblemCreated} />
      </div>
    );
  }

  if (currentView === 'edit' && selectedProblemId) {
    return (
      <div>
        <Button onClick={handleEditComplete} variant="ghost" className="mb-4">
          ← Back to List
        </Button>
        <EditPracticeProblemForm problemId={selectedProblemId} onSuccess={handleEditComplete} onCancel={handleEditComplete} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Practice Problems Management</h2>
        <Button onClick={() => setCurrentView('create')} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Create Problem
        </Button>
      </div>

      {problems.length === 0 ? (
        <Card className="p-8 text-center bg-card/50 backdrop-blur-sm border-border/50">
          <p className="text-muted-foreground mb-4">No practice problems yet.</p>
          <Button onClick={() => setCurrentView('create')}>
            <Plus className="h-5 w-5 mr-2" />
            Create Your First Problem
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {problems.map((problem) => (
            <Card key={problem.id} className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold text-foreground">{problem.title}</h3>
                    {getDifficultyBadge(problem.difficulty)}
                    <Badge variant="outline">{problem.topic}</Badge>
                    {problem.is_active ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{problem.description}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Points: {problem.points}</span>
                    <span>Created: {new Date(problem.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => toggleActive(problem.id, problem.is_active)}
                    variant="outline"
                    size="sm"
                  >
                    {problem.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button onClick={() => handleEdit(problem.id)} variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

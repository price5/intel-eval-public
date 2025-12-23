import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Code2, Trophy, Clock, Filter, ArrowLeft } from 'lucide-react';

interface PracticeProblem {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  topic: string;
  points: number;
}

interface PracticeProblemsListProps {
  onSelectProblem: (problemId: string) => void;
  onBack: () => void;
}

export const PracticeProblemsList = ({ onSelectProblem, onBack }: PracticeProblemsListProps) => {
  const { user } = useAuth();
  const [problems, setProblems] = useState<PracticeProblem[]>([]);
  const [filteredProblems, setFilteredProblems] = useState<PracticeProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [submissions, setSubmissions] = useState<Record<string, any>>({});

  const topics = ['all', 'Data Structures', 'Algorithms', 'OOP', 'DBMS', 'Web Development', 'Problem-solving'];
  const difficulties = ['all', 'easy', 'medium', 'hard'];

  useEffect(() => {
    fetchProblems();
    fetchSubmissions();
  }, [user]);

  useEffect(() => {
    filterProblems();
  }, [selectedTopic, selectedDifficulty, problems]);

  const fetchProblems = async () => {
    try {
      const { data, error } = await supabase
        .from('practice_problems')
        .select('id, title, description, difficulty, topic, points')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProblems(data || []);
      setFilteredProblems(data || []);
    } catch (error: any) {
      console.error('Error fetching practice problems:', error);
      toast.error('Failed to load practice problems');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('practice_problem_submissions')
        .select('problem_id, overall_score, status')
        .eq('student_id', user.id)
        .eq('status', 'completed');

      if (error) throw error;

      // Group by problem_id and get the best score
      const submissionsMap: Record<string, any> = {};
      data?.forEach((submission) => {
        if (!submissionsMap[submission.problem_id] || 
            (submission.overall_score || 0) > (submissionsMap[submission.problem_id].overall_score || 0)) {
          submissionsMap[submission.problem_id] = submission;
        }
      });
      
      setSubmissions(submissionsMap);
    } catch (error: any) {
      console.error('Error fetching submissions:', error);
    }
  };

  const filterProblems = () => {
    let filtered = [...problems];
    
    if (selectedTopic !== 'all') {
      filtered = filtered.filter(p => p.topic === selectedTopic);
    }
    
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(p => p.difficulty === selectedDifficulty);
    }
    
    setFilteredProblems(filtered);
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

  const getCompletionBadge = (problemId: string) => {
    const submission = submissions[problemId];
    if (!submission) return null;
    
    const score = submission.overall_score || 0;
    return (
      <Badge variant={score >= 80 ? 'default' : 'secondary'} className="gap-1">
        <Trophy className="h-3 w-3" />
        {score}%
      </Badge>
    );
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading practice problems...</div>;
  }

  return (
    <div className="space-y-6">
      <Button onClick={onBack} variant="ghost" className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Practice Menu
      </Button>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <Select value={selectedTopic} onValueChange={setSelectedTopic}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by topic" />
            </SelectTrigger>
            <SelectContent>
              {topics.map((topic) => (
                <SelectItem key={topic} value={topic}>
                  {topic === 'all' ? 'All Topics' : topic}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by difficulty" />
          </SelectTrigger>
          <SelectContent>
            {difficulties.map((difficulty) => (
              <SelectItem key={difficulty} value={difficulty}>
                {difficulty === 'all' ? 'All Difficulties' : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredProblems.length === 0 ? (
        <Card className="p-8 text-center bg-card/50 backdrop-blur-sm border-border/50">
          <p className="text-muted-foreground">No practice problems found with the selected filters.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredProblems.map((problem) => (
            <Card key={problem.id} className="p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-xl font-semibold text-foreground">{problem.title}</h3>
                    {getDifficultyBadge(problem.difficulty)}
                    <Badge variant="outline">{problem.topic}</Badge>
                    {getCompletionBadge(problem.id)}
                  </div>
                  <p className="text-sm text-muted-foreground">{problem.description}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Trophy className="h-4 w-4" />
                      {problem.points} points
                    </span>
                  </div>
                </div>
                <Button onClick={() => onSelectProblem(problem.id)} size="lg">
                  <Code2 className="h-5 w-5 mr-2" />
                  Solve
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

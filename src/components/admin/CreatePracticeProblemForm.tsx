import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { MarkdownEditor } from './MarkdownEditor';

interface TestCase {
  input: string;
  expected_output: string;
  description?: string;
}

interface CreatePracticeProblemFormProps {
  onSuccess: () => void;
}

const TOPICS = ['Data Structures', 'Algorithms', 'OOP', 'DBMS', 'Web Development', 'Problem-solving'];

export const CreatePracticeProblemForm = ({ onSuccess }: CreatePracticeProblemFormProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    problem_statement: '',
    problem_description: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    topic: 'Data Structures',
    points: 100,
  });
  const [publicTestCases, setPublicTestCases] = useState<TestCase[]>([
    { input: '', expected_output: '', description: '' },
  ]);
  const [hiddenTestCases, setHiddenTestCases] = useState<TestCase[]>([
    { input: '', expected_output: '', description: '' },
  ]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTestCase = (isPublic: boolean) => {
    const newTestCase = { input: '', expected_output: '', description: '' };
    if (isPublic) {
      setPublicTestCases([...publicTestCases, newTestCase]);
    } else {
      setHiddenTestCases([...hiddenTestCases, newTestCase]);
    }
  };

  const removeTestCase = (index: number, isPublic: boolean) => {
    if (isPublic) {
      setPublicTestCases(publicTestCases.filter((_, i) => i !== index));
    } else {
      setHiddenTestCases(hiddenTestCases.filter((_, i) => i !== index));
    }
  };

  const updateTestCase = (index: number, field: keyof TestCase, value: string, isPublic: boolean) => {
    if (isPublic) {
      const updated = [...publicTestCases];
      updated[index] = { ...updated[index], [field]: value };
      setPublicTestCases(updated);
    } else {
      const updated = [...hiddenTestCases];
      updated[index] = { ...updated[index], [field]: value };
      setHiddenTestCases(updated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const validPublicTests = publicTestCases.filter(tc => tc.input && tc.expected_output);
      const validHiddenTests = hiddenTestCases.filter(tc => tc.input && tc.expected_output);

      if (validPublicTests.length === 0) {
        toast.error('At least one public test case is required');
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('practice_problems').insert({
        ...formData,
        test_cases: validPublicTests as any,
        hidden_test_cases: validHiddenTests as any,
        created_by: user.id,
      });

      if (error) throw error;

      toast.success('Practice problem created successfully!');
      onSuccess();
    } catch (error: any) {
      console.error('Error creating practice problem:', error);
      toast.error(error.message || 'Failed to create practice problem');
    } finally {
      setLoading(false);
    }
  };

  const renderTestCaseSection = (testCases: TestCase[], isPublic: boolean, title: string) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <Button type="button" onClick={() => addTestCase(isPublic)} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Test Case
        </Button>
      </div>
      {testCases.map((testCase, index) => (
        <Card key={index} className="p-4 space-y-3 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Test Case {index + 1}</span>
            {testCases.length > 1 && (
              <Button
                type="button"
                onClick={() => removeTestCase(index, isPublic)}
                variant="ghost"
                size="sm"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${isPublic ? 'public' : 'hidden'}-input-${index}`}>Input</Label>
            <Textarea
              id={`${isPublic ? 'public' : 'hidden'}-input-${index}`}
              value={testCase.input}
              onChange={(e) => updateTestCase(index, 'input', e.target.value, isPublic)}
              placeholder="Test case input"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${isPublic ? 'public' : 'hidden'}-output-${index}`}>Expected Output</Label>
            <Textarea
              id={`${isPublic ? 'public' : 'hidden'}-output-${index}`}
              value={testCase.expected_output}
              onChange={(e) => updateTestCase(index, 'expected_output', e.target.value, isPublic)}
              placeholder="Expected output"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${isPublic ? 'public' : 'hidden'}-desc-${index}`}>Description (Optional)</Label>
            <Input
              id={`${isPublic ? 'public' : 'hidden'}-desc-${index}`}
              value={testCase.description || ''}
              onChange={(e) => updateTestCase(index, 'description', e.target.value, isPublic)}
              placeholder="Brief description of this test case"
            />
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <Card className="p-6 space-y-6 bg-card/50 backdrop-blur-sm border-border/50">
        <h2 className="text-2xl font-bold text-foreground">Create Practice Problem</h2>

        <div className="space-y-2">
          <Label htmlFor="title">Problem Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="e.g., Two Sum Problem"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Short Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Brief overview of the problem"
            rows={2}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="problem_statement">Problem Statement</Label>
          <MarkdownEditor
            value={formData.problem_statement}
            onChange={(value) => handleInputChange('problem_statement', value)}
            placeholder="Explain what the student needs to solve... Supports markdown and LaTeX math ($x^2$)"
            height="300px"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="problem_description">Detailed Problem Description</Label>
          <MarkdownEditor
            value={formData.problem_description}
            onChange={(value) => handleInputChange('problem_description', value)}
            placeholder="Provide detailed explanation, examples, constraints... Supports markdown and LaTeX math"
            height="300px"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Topic</Label>
            <Select value={formData.topic} onValueChange={(value) => handleInputChange('topic', value)}>
              <SelectTrigger id="topic">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOPICS.map((topic) => (
                  <SelectItem key={topic} value={topic}>
                    {topic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select value={formData.difficulty} onValueChange={(value) => handleInputChange('difficulty', value)}>
              <SelectTrigger id="difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="points">Points</Label>
            <Input
              id="points"
              type="number"
              value={formData.points}
              onChange={(e) => handleInputChange('points', parseInt(e.target.value))}
              min={1}
              max={500}
              required
            />
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-6 bg-card/50 backdrop-blur-sm border-border/50">
        {renderTestCaseSection(publicTestCases, true, 'Public Test Cases (Visible to Students)')}
      </Card>

      <Card className="p-6 space-y-6 bg-card/50 backdrop-blur-sm border-border/50">
        {renderTestCaseSection(hiddenTestCases, false, 'Hidden Test Cases (Used for Evaluation)')}
      </Card>

      <Button type="submit" disabled={loading} size="lg" className="w-full">
        {loading ? 'Creating...' : 'Create Practice Problem'}
      </Button>
    </form>
  );
};

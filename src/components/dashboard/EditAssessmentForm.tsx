import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2, Plus, X } from 'lucide-react';

interface TestCase {
  input: string;
  expected_output: string;
}

interface EditAssessmentFormProps {
  assessmentId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditAssessmentForm: React.FC<EditAssessmentFormProps> = ({
  assessmentId,
  onSuccess,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    problem_statement: '',
    problem_description: '',
    time_limit: 60,
    difficulty: 'easy',
    points: 100,
    deadline: '',
    is_active: true,
    allow_reattempts: false,
    reattempt_scoring_method: 'best_score',
    code_weight: 70,
    explanation_weight: 30
  });
  const [testCases, setTestCases] = useState<TestCase[]>([{ input: '', expected_output: '' }]);
  const [hiddenTestCases, setHiddenTestCases] = useState<TestCase[]>([{ input: '', expected_output: '' }]);

  useEffect(() => {
    fetchAssessment();
  }, [assessmentId]);

  const fetchAssessment = async () => {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (error) throw error;

      setFormData({
        title: data.title,
        description: data.description,
        problem_statement: data.problem_statement,
        problem_description: data.problem_description,
        time_limit: data.time_limit,
        difficulty: data.difficulty,
        points: data.points,
        deadline: data.deadline ? new Date(data.deadline).toISOString().slice(0, 16) : '',
        is_active: data.is_active,
        allow_reattempts: data.allow_reattempts || false,
        reattempt_scoring_method: data.reattempt_scoring_method || 'best_score',
        code_weight: data.code_weight || 70,
        explanation_weight: data.explanation_weight || 30
      });
      setTestCases(Array.isArray(data.test_cases) && data.test_cases.length > 0 ? data.test_cases as unknown as TestCase[] : [{ input: '', expected_output: '' }]);
      setHiddenTestCases(Array.isArray(data.hidden_test_cases) && data.hidden_test_cases.length > 0 ? data.hidden_test_cases as unknown as TestCase[] : [{ input: '', expected_output: '' }]);
    } catch (error) {
      console.error('Error fetching assessment:', error);
      toast.error('Failed to load assessment');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        problem_statement: formData.problem_statement,
        problem_description: formData.problem_description,
        test_cases: testCases.filter(tc => tc.input.trim() || tc.expected_output.trim()) as any,
        hidden_test_cases: hiddenTestCases.filter(tc => tc.input.trim() || tc.expected_output.trim()) as any,
        time_limit: formData.time_limit,
        difficulty: formData.difficulty,
        points: formData.points,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
        is_active: formData.is_active,
        allow_reattempts: formData.allow_reattempts,
        reattempt_scoring_method: formData.reattempt_scoring_method,
        code_weight: formData.code_weight,
        explanation_weight: formData.explanation_weight
      };

      const { error } = await supabase
        .from('assessments')
        .update(updateData)
        .eq('id', assessmentId);

      if (error) throw error;
      
      toast.success('Assessment updated successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error updating assessment:', error);
      toast.error('Failed to update assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('assessments')
        .delete()
        .eq('id', assessmentId);

      if (error) throw error;
      
      toast.success('Assessment deleted successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error deleting assessment:', error);
      toast.error('Failed to delete assessment');
    } finally {
      setDeleting(false);
    }
  };

  const addTestCase = (type: 'visible' | 'hidden') => {
    if (type === 'visible') {
      setTestCases([...testCases, { input: '', expected_output: '' }]);
    } else {
      setHiddenTestCases([...hiddenTestCases, { input: '', expected_output: '' }]);
    }
  };

  const removeTestCase = (index: number, type: 'visible' | 'hidden') => {
    if (type === 'visible') {
      setTestCases(testCases.filter((_, i) => i !== index));
    } else {
      setHiddenTestCases(hiddenTestCases.filter((_, i) => i !== index));
    }
  };

  const updateTestCase = (index: number, field: 'input' | 'expected_output', value: string, type: 'visible' | 'hidden') => {
    if (type === 'visible') {
      const updated = [...testCases];
      updated[index][field] = value;
      setTestCases(updated);
    } else {
      const updated = [...hiddenTestCases];
      updated[index][field] = value;
      setHiddenTestCases(updated);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Edit Assessment</CardTitle>
        <CardDescription>Update assessment details and test cases</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Limit (minutes)</label>
              <Input
                type="number"
                value={formData.time_limit}
                onChange={(e) => setFormData({ ...formData, time_limit: parseInt(e.target.value) })}
                min="1"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Problem Statement</label>
            <Textarea
              value={formData.problem_statement}
              onChange={(e) => setFormData({ ...formData, problem_statement: e.target.value })}
              placeholder="Write the main problem statement here..."
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Problem Description</label>
            <Textarea
              value={formData.problem_description}
              onChange={(e) => setFormData({ ...formData, problem_description: e.target.value })}
              placeholder="Provide detailed explanation, examples, constraints..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Difficulty</label>
              <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
                <SelectTrigger>
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
              <label className="text-sm font-medium">Points</label>
              <Input
                type="number"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                min="1"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Deadline (Optional)</label>
              <DateTimePicker
                value={formData.deadline}
                onChange={(value) => setFormData({ ...formData, deadline: value })}
                placeholder="Select deadline..."
              />
            </div>
          </div>

          {/* Reattempt Settings */}
          <Card className="bg-card/30">
            <CardHeader>
              <CardTitle className="text-base">Reattempt Settings</CardTitle>
              <CardDescription>
                Configure if students can retake this assessment and how scoring is handled
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Allow Reattempts</label>
                  <p className="text-xs text-muted-foreground">
                    Students can take this assessment multiple times
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.allow_reattempts}
                  onChange={(e) => setFormData({ ...formData, allow_reattempts: e.target.checked })}
                  className="h-4 w-4"
                />
              </div>

              {formData.allow_reattempts && (
                <div className="space-y-2 pt-2 border-t">
                  <label className="text-sm font-medium">Scoring Method</label>
                  <Select
                    value={formData.reattempt_scoring_method}
                    onValueChange={(value) => setFormData({ ...formData, reattempt_scoring_method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="best_score">
                        <div className="flex flex-col">
                          <span>Best Score</span>
                          <span className="text-xs text-muted-foreground">Keep the highest score achieved</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="latest_score">
                        <div className="flex flex-col">
                          <span>Latest Score</span>
                          <span className="text-xs text-muted-foreground">Use the most recent attempt</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="average_score">
                        <div className="flex flex-col">
                          <span>Average Score</span>
                          <span className="text-xs text-muted-foreground">Average of all attempts</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Evaluation Weightage */}
          <Card className="bg-card/30">
            <CardHeader>
              <CardTitle className="text-base">Evaluation Weightage</CardTitle>
              <CardDescription>
                Configure how code and explanation quality are weighted (must sum to 100%)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Code Weight (%)</label>
                  <Input
                    type="number"
                    value={formData.code_weight}
                    onChange={(e) => {
                      const codeWeight = parseInt(e.target.value);
                      if (codeWeight >= 0 && codeWeight <= 100) {
                        setFormData({ ...formData, code_weight: codeWeight, explanation_weight: 100 - codeWeight });
                      }
                    }}
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-muted-foreground">
                    Weight given to code quality and correctness
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Explanation Weight (%)</label>
                  <Input
                    type="number"
                    value={formData.explanation_weight}
                    onChange={(e) => {
                      const explanationWeight = parseInt(e.target.value);
                      if (explanationWeight >= 0 && explanationWeight <= 100) {
                        setFormData({ ...formData, explanation_weight: explanationWeight, code_weight: 100 - explanationWeight });
                      }
                    }}
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-muted-foreground">
                    Weight given to explanation clarity and completeness
                  </p>
                </div>
              </div>
              
              {formData.code_weight + formData.explanation_weight !== 100 && (
                <div className="text-sm text-destructive">
                  ⚠️ Weights must sum to 100%. Current sum: {formData.code_weight + formData.explanation_weight}%
                </div>
              )}
            </CardContent>
          </Card>

          {/* Visible Test Cases */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Visible Test Cases</h3>
              <Button type="button" variant="outline" onClick={() => addTestCase('visible')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Test Case
              </Button>
            </div>
            {testCases.map((testCase, index) => (
              <div key={index} className="border p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <Badge variant="secondary">Test Case {index + 1}</Badge>
                  {testCases.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTestCase(index, 'visible')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Input</label>
                    <Textarea
                      value={testCase.input}
                      onChange={(e) => updateTestCase(index, 'input', e.target.value, 'visible')}
                      placeholder="Enter test input..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Expected Output</label>
                    <Textarea
                      value={testCase.expected_output}
                      onChange={(e) => updateTestCase(index, 'expected_output', e.target.value, 'visible')}
                      placeholder="Enter expected output..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Hidden Test Cases */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Hidden Test Cases</h3>
              <Button type="button" variant="outline" onClick={() => addTestCase('hidden')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Hidden Test Case
              </Button>
            </div>
            {hiddenTestCases.map((testCase, index) => (
              <div key={index} className="border p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <Badge variant="outline">Hidden Test Case {index + 1}</Badge>
                  {hiddenTestCases.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTestCase(index, 'hidden')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Input</label>
                    <Textarea
                      value={testCase.input}
                      onChange={(e) => updateTestCase(index, 'input', e.target.value, 'hidden')}
                      placeholder="Enter test input..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Expected Output</label>
                    <Textarea
                      value={testCase.expected_output}
                      onChange={(e) => updateTestCase(index, 'expected_output', e.target.value, 'hidden')}
                      placeholder="Enter expected output..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-6">
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Assessment
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Assessment</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this assessment? This action cannot be undone.
                      All student submissions will also be deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                      {deleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Assessment'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
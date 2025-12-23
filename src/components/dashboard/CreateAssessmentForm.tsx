import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, X, Save, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface TestCase {
  input: string;
  expected_output: string;
  description?: string;
}

interface CreateAssessmentFormProps {
  onSuccess: () => void;
}

export const CreateAssessmentForm: React.FC<CreateAssessmentFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    problem_statement: '',
    problem_description: '',
    time_limit: 60,
    difficulty: 'medium',
    points: 100,
    deadline: '',
    allow_reattempts: false,
    reattempt_scoring_method: 'best_score',
    code_weight: 70,
    explanation_weight: 30
  });
  
  const [testCases, setTestCases] = useState<TestCase[]>([
    { input: '', expected_output: '', description: '' }
  ]);
  
  const [hiddenTestCases, setHiddenTestCases] = useState<TestCase[]>([
    { input: '', expected_output: '', description: '' }
  ]);

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTestCase = (isHidden = false) => {
    const newTestCase = { input: '', expected_output: '', description: '' };
    if (isHidden) {
      setHiddenTestCases(prev => [...prev, newTestCase]);
    } else {
      setTestCases(prev => [...prev, newTestCase]);
    }
  };

  const removeTestCase = (index: number, isHidden = false) => {
    if (isHidden) {
      setHiddenTestCases(prev => prev.filter((_, i) => i !== index));
    } else {
      setTestCases(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateTestCase = (index: number, field: string, value: string, isHidden = false) => {
    if (isHidden) {
      setHiddenTestCases(prev => prev.map((tc, i) => 
        i === index ? { ...tc, [field]: value } : tc
      ));
    } else {
      setTestCases(prev => prev.map((tc, i) => 
        i === index ? { ...tc, [field]: value } : tc
      ));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const insertData = {
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
        allow_reattempts: formData.allow_reattempts,
        reattempt_scoring_method: formData.reattempt_scoring_method,
        code_weight: formData.code_weight,
        explanation_weight: formData.explanation_weight,
        created_by: user.id
      };

      const { error } = await supabase
        .from('assessments')
        .insert(insertData);

      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error('Error creating assessment:', error);
      toast.error('Failed to create assessment');
    } finally {
      setLoading(false);
    }
  };

  const renderTestCaseSection = (cases: TestCase[], isHidden = false) => (
    <Card className="bg-card/30">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          {isHidden ? 'Hidden Test Cases' : 'Public Test Cases'}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addTestCase(isHidden)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </CardTitle>
        <CardDescription>
          {isHidden ? 
            'These test cases will be used for evaluation but not shown to students' :
            'These test cases will be visible to students as examples'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {cases.map((testCase, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="secondary">Test Case {index + 1}</Badge>
              {cases.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTestCase(index, isHidden)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>Input</Label>
                <Textarea
                  value={testCase.input}
                  onChange={(e) => updateTestCase(index, 'input', e.target.value, isHidden)}
                  placeholder="Enter test input..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Expected Output</Label>
                <Textarea
                  value={testCase.expected_output}
                  onChange={(e) => updateTestCase(index, 'expected_output', e.target.value, isHidden)}
                  placeholder="Enter expected output..."
                  rows={3}
                />
              </div>
            </div>
            
            <div>
              <Label>Description (Optional)</Label>
              <Input
                value={testCase.description}
                onChange={(e) => updateTestCase(index, 'description', e.target.value, isHidden)}
                placeholder="Brief description of this test case..."
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create New Assessment
          </CardTitle>
          <CardDescription>
            Create a comprehensive coding assessment for your students
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Assessment Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Algorithm Design Challenge"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) => handleInputChange('difficulty', value)}
              >
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief overview of what this assessment covers..."
              rows={2}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="problem_statement">Problem Statement *</Label>
            <Textarea
              id="problem_statement"
              value={formData.problem_statement}
              onChange={(e) => handleInputChange('problem_statement', e.target.value)}
              placeholder="Clear and concise problem statement..."
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="problem_description">Detailed Description *</Label>
            <Textarea
              id="problem_description"
              value={formData.problem_description}
              onChange={(e) => handleInputChange('problem_description', e.target.value)}
              placeholder="Detailed explanation, constraints, examples, etc..."
              rows={5}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="time_limit">Time Limit (minutes)</Label>
              <Input
                id="time_limit"
                type="number"
                value={formData.time_limit}
                onChange={(e) => handleInputChange('time_limit', parseInt(e.target.value))}
                min="1"
                max="300"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="points">Total Points</Label>
              <Input
                id="points"
                type="number"
                value={formData.points}
                onChange={(e) => handleInputChange('points', parseInt(e.target.value))}
                min="1"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline (Optional)</Label>
              <DateTimePicker
                value={formData.deadline}
                onChange={(value) => handleInputChange('deadline', value)}
                placeholder="Select deadline..."
              />
            </div>
          </div>

          <Card className="bg-card/30">
            <CardHeader>
              <CardTitle className="text-lg">Evaluation Weightage</CardTitle>
              <CardDescription>
                Configure how code and explanation quality are weighted (must sum to 100%)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="code_weight">Code Weight (%)</Label>
                  <Input
                    id="code_weight"
                    type="number"
                    value={formData.code_weight}
                    onChange={(e) => {
                      const codeWeight = parseInt(e.target.value);
                      if (codeWeight >= 0 && codeWeight <= 100) {
                        handleInputChange('code_weight', codeWeight);
                        handleInputChange('explanation_weight', 100 - codeWeight);
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
                  <Label htmlFor="explanation_weight">Explanation Weight (%)</Label>
                  <Input
                    id="explanation_weight"
                    type="number"
                    value={formData.explanation_weight}
                    onChange={(e) => {
                      const explanationWeight = parseInt(e.target.value);
                      if (explanationWeight >= 0 && explanationWeight <= 100) {
                        handleInputChange('explanation_weight', explanationWeight);
                        handleInputChange('code_weight', 100 - explanationWeight);
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

          <Card className="bg-card/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Reattempt Settings
              </CardTitle>
              <CardDescription>
                Configure if students can retake this assessment and how scoring is handled
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allow_reattempts">Allow Reattempts</Label>
                  <p className="text-xs text-muted-foreground">
                    Students can take this assessment multiple times
                  </p>
                </div>
                <input
                  id="allow_reattempts"
                  type="checkbox"
                  checked={formData.allow_reattempts}
                  onChange={(e) => handleInputChange('allow_reattempts', e.target.checked)}
                  className="h-4 w-4"
                />
              </div>

              {formData.allow_reattempts && (
                <div className="space-y-2 pt-2 border-t">
                  <Label htmlFor="reattempt_scoring_method">Scoring Method</Label>
                  <Select
                    value={formData.reattempt_scoring_method}
                    onValueChange={(value) => handleInputChange('reattempt_scoring_method', value)}
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
        </CardContent>
      </Card>

      {renderTestCaseSection(testCases, false)}
      {renderTestCaseSection(hiddenTestCases, true)}

      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={loading} size="lg">
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Creating...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Create Assessment
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
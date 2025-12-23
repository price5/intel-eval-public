import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronLeft, Calendar, Users, FileText, Eye, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { ViewSubmissions } from './ViewSubmissions';
import { DetailedSubmissionView } from './DetailedSubmissionView';

interface Assessment {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  points: number;
  time_limit: number;
  created_at: string;
  deadline: string;
  is_active: boolean;
  _count?: {
    assessment_submissions: number;
  };
}

interface InstructorAssessmentHistoryProps {
  onBack?: () => void; // Optional - only used if needed for specific navigation flows
}

export const InstructorAssessmentHistory: React.FC<InstructorAssessmentHistoryProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAssessments();
    }
  }, [user]);

  const fetchAssessments = async () => {
    try {
      // First get assessments
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('assessments')
        .select('*')
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false });

      if (assessmentsError) throw assessmentsError;

      // Then get submission counts for each assessment
      const assessmentsWithCounts = await Promise.all(
        (assessmentsData || []).map(async (assessment) => {
          const { count } = await supabase
            .from('assessment_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('assessment_id', assessment.id);

          return {
            ...assessment,
            _count: {
              assessment_submissions: count || 0
            }
          };
        })
      );

      setAssessments(assessmentsWithCounts);
    } catch (error) {
      console.error('Error fetching assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isActive: boolean, deadline: string) => {
    if (!isActive) return 'bg-gray-100 text-gray-800';
    if (deadline && new Date(deadline) < new Date()) return 'bg-red-100 text-red-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (isActive: boolean, deadline: string) => {
    if (!isActive) return 'Inactive';
    if (deadline && new Date(deadline) < new Date()) return 'Expired';
    return 'Active';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showDetail && selectedSubmissionId) {
    return (
      <DetailedSubmissionView
        submissionId={selectedSubmissionId}
        onBack={() => {
          setShowDetail(false);
          setSelectedSubmissionId(null);
        }}
      />
    );
  }

  if (showSubmissions && selectedAssessment) {
    return (
      <ViewSubmissions 
        assessmentId={selectedAssessment.id}
        assessmentTitle={selectedAssessment.title}
        onViewDetail={(submissionId) => {
          setSelectedSubmissionId(submissionId);
          setShowDetail(true);
        }}
        onBack={() => {
          setShowSubmissions(false);
          setSelectedAssessment(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - no back button needed, use left panel navigation */}
      <div>
        <h2 className="text-2xl font-bold">Assessment History</h2>
        <p className="text-muted-foreground">
          View and manage your created assessments and submissions
        </p>
      </div>

      {assessments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Assessments Created</h3>
            <p className="text-muted-foreground">
              You haven't created any assessments yet. Create your first assessment to see it here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {assessments.map((assessment) => (
            <Card key={assessment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{assessment.title}</h3>
                      <Badge className={getDifficultyColor(assessment.difficulty)}>
                        {assessment.difficulty}
                      </Badge>
                      <Badge className={getStatusColor(assessment.is_active, assessment.deadline)}>
                        {getStatusText(assessment.is_active, assessment.deadline)}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {assessment.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Created {format(new Date(assessment.created_at), 'PPP')}
                      </div>
                      {assessment.deadline && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Due {format(new Date(assessment.deadline), 'PPP')}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {assessment._count?.assessment_submissions || 0} submissions
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-primary">
                        {assessment.points}
                      </div>
                      <p className="text-xs text-muted-foreground">Points</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {assessment.time_limit}
                      </div>
                      <p className="text-xs text-muted-foreground">Minutes</p>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedAssessment(assessment);
                        setShowSubmissions(true);
                      }}
                      disabled={assessment._count?.assessment_submissions === 0}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Submissions
                    </Button>
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {assessment._count?.assessment_submissions || 0} students participated
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      Assessment ID: {assessment.id.slice(0, 8)}...
                    </div>
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
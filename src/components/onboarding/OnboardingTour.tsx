import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, ArrowRight, ArrowLeft, Sparkles, GraduationCap, Users, BookOpen, Trophy, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetId: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  icon: React.ReactNode;
}

const studentSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to IntelEval! 🎉',
    description: 'Let\'s take a quick tour to help you get started with the platform.',
    targetId: '',
    position: 'bottom',
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    id: 'assessments',
    title: 'Assessments Tab',
    description: 'View and take assessments assigned by your instructors. Track your progress and see detailed feedback.',
    targetId: 'onboarding-assessments-tab',
    position: 'bottom',
    icon: <span className="text-lg">📝</span>,
  },
  {
    id: 'practice',
    title: 'Practice Problems',
    description: 'Sharpen your skills with practice problems. Work at your own pace and get instant feedback.',
    targetId: 'onboarding-practice-tab',
    position: 'bottom',
    icon: <span className="text-lg">💪</span>,
  },
  {
    id: 'leaderboard',
    title: 'Weekly Leaderboard',
    description: 'Compete with peers in weekly leagues! Earn XP and climb the ranks to unlock achievements.',
    targetId: 'onboarding-leaderboard-tab',
    position: 'bottom',
    icon: <span className="text-lg">🏆</span>,
  },
  {
    id: 'community',
    title: 'Community Chat',
    description: 'Connect with fellow students, ask questions, and collaborate. Join the conversation!',
    targetId: 'onboarding-community',
    position: 'right',
    icon: <span className="text-lg">💬</span>,
  },
];

const instructorSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to IntelEval! 🎓',
    description: 'Let\'s explore the instructor features to help you manage assessments effectively.',
    targetId: '',
    position: 'bottom',
    icon: <GraduationCap className="h-5 w-5" />,
  },
  {
    id: 'assessments',
    title: 'Assessment Management',
    description: 'Create, edit, and manage assessments for your students. Set deadlines and track submissions.',
    targetId: 'onboarding-assessments-tab',
    position: 'bottom',
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    id: 'history',
    title: 'Submission History',
    description: 'Review student submissions, provide feedback, and track their progress over time.',
    targetId: 'onboarding-history-tab',
    position: 'bottom',
    icon: <Trophy className="h-5 w-5" />,
  },
  {
    id: 'leaderboard',
    title: 'Class Performance',
    description: 'Monitor overall class performance and identify students who may need additional support.',
    targetId: 'onboarding-leaderboard-tab',
    position: 'bottom',
    icon: <Users className="h-5 w-5" />,
  },
  {
    id: 'community',
    title: 'Community & Communication',
    description: 'Stay connected with your students through community channels and direct messages.',
    targetId: 'onboarding-community',
    position: 'right',
    icon: <MessageCircle className="h-5 w-5" />,
  },
];

const contentContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const contentItemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

interface OnboardingTourProps {
  onComplete: () => void;
  role?: 'student' | 'instructor';
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete, role = 'student' }) => {
  const steps = role === 'instructor' ? instructorSteps : studentSteps;
  const [currentStep, setCurrentStep] = useState(0);
  const [targetPosition, setTargetPosition] = useState<DOMRect | null>(null);
  const { user } = useAuth();

  // Update target position when step changes
  useEffect(() => {
    const updateTargetPosition = () => {
      const targetId = steps[currentStep].targetId;
      
      if (!targetId) {
        // Welcome step has no target
        setTargetPosition(null);
        return;
      }

      const element = document.getElementById(targetId);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetPosition(rect);
      } else {
        console.warn(`Target element not found: ${targetId}`);
        setTargetPosition(null);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(updateTargetPosition, 100);

    // Update on window resize and scroll
    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition, true);
    };
  }, [currentStep]);

  // Handle ESC key to skip tour
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Tour completed! Welcome aboard! 🎉');
      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      onComplete();
    }
  };

  const handleSkip = async () => {
    if (!user) return;

    try {
      await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      onComplete();
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      onComplete();
    }
  };

  const step = steps[currentStep];

  const getTooltipPosition = () => {
    if (!targetPosition) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const tooltipOffset = 20;
    const style: React.CSSProperties = { position: 'fixed' as const };

    switch (step.position) {
      case 'bottom':
        style.top = targetPosition.bottom + tooltipOffset;
        style.left = targetPosition.left + targetPosition.width / 2;
        style.transform = 'translateX(-50%)';
        break;
      case 'top':
        style.bottom = window.innerHeight - targetPosition.top + tooltipOffset;
        style.left = targetPosition.left + targetPosition.width / 2;
        style.transform = 'translateX(-50%)';
        break;
      case 'right':
        style.top = targetPosition.top + targetPosition.height / 2;
        style.left = targetPosition.right + tooltipOffset;
        style.transform = 'translateY(-50%)';
        break;
      case 'left':
        style.top = targetPosition.top + targetPosition.height / 2;
        style.right = window.innerWidth - targetPosition.left + tooltipOffset;
        style.transform = 'translateY(-50%)';
        break;
    }

    return style;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100]">
        {/* Overlay with spotlight effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none"
        />

        {/* Spotlight on target element */}
        {targetPosition && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="fixed pointer-events-none"
            style={{
              top: targetPosition.top - 8,
              left: targetPosition.left - 8,
              width: targetPosition.width + 16,
              height: targetPosition.height + 16,
              boxShadow: '0 0 0 3px hsl(var(--primary) / 0.8), 0 0 24px hsl(var(--primary) / 0.6)',
              borderRadius: '12px',
              zIndex: 101,
            }}
          />
        )}

        {/* Tooltip card */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -10 }}
          transition={{ duration: 0.3 }}
          className="bg-card border border-border rounded-lg shadow-2xl p-6 max-w-md z-[102] pointer-events-auto"
          style={getTooltipPosition()}
        >
          <motion.div
            className="flex items-start justify-between mb-4"
            variants={contentContainerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="flex items-center gap-3" variants={contentItemVariants}>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                {step.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
              </div>
            </motion.div>
            <motion.div variants={contentItemVariants}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -mt-1 -mr-1"
                onClick={handleSkip}
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>

          <div className="flex items-center justify-between mt-6">
            <div className="flex gap-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-8 bg-primary'
                      : index < currentStep
                      ? 'w-1.5 bg-primary/50'
                      : 'w-1.5 bg-muted'
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" size="sm" onClick={handlePrevious}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              <Button size="sm" onClick={handleNext}>
                {currentStep < steps.length - 1 ? (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  <>
                    Finish
                    <Sparkles className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Step {currentStep + 1} of {steps.length} • Press ESC or use the close button to skip
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

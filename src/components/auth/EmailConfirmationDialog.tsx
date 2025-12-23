import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface EmailConfirmationDialogProps {
  email: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EmailConfirmationDialog: React.FC<EmailConfirmationDialogProps> = ({ 
  email, 
  open, 
  onOpenChange 
}) => {
  const [countdown, setCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (!open) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        onOpenChange(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [open, onOpenChange]);

  const handleResend = async () => {
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;

      toast.success('Confirmation email sent! Please check your inbox.');
      setCountdown(60);
      setCanResend(false);
    } catch (error) {
      toast.error('Failed to resend email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1
              }}
            >
              <Mail className="h-16 w-16 text-primary" />
            </motion.div>
          </div>
          <DialogTitle className="text-center text-2xl">Check Your Email</DialogTitle>
          <DialogDescription className="text-center space-y-3 pt-2">
            <p>
              We've sent a confirmation link to:
            </p>
            <p className="font-semibold text-foreground">{email}</p>
            <p className="text-sm">
              Click the link in the email to verify your account and start using IntelEval.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              Didn't receive the email?
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResend}
              disabled={!canResend || isResending}
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : canResend ? (
                'Resend Confirmation Email'
              ) : (
                `Resend in ${countdown}s`
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            This window will automatically close once you confirm your email.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';

interface EditFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldName: string;
  fieldKey: string;
  currentValue: string;
  userId: string;
}

export const EditFieldDialog: React.FC<EditFieldDialogProps> = ({
  open,
  onOpenChange,
  fieldName,
  fieldKey,
  currentValue,
  userId,
}) => {
  const { refetch } = useProfile();
  const [newValue, setNewValue] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim() || !password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Verify password by attempting to sign in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('User email not found');

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (signInError) {
        toast.error('Incorrect password');
        return;
      }

      // Update the profile field
      const { error } = await supabase
        .from('profiles')
        .update({ [fieldKey]: newValue })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success(`${fieldName} updated successfully!`);
      if (refetch) await refetch();
      onOpenChange(false);
      setNewValue('');
      setPassword('');
    } catch (error: any) {
      console.error('Error updating field:', error);
      toast.error(error.message || `Failed to update ${fieldName.toLowerCase()}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {fieldName}</DialogTitle>
          <DialogDescription>
            Enter your password to confirm this change
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-value">Current {fieldName}</Label>
            <Input id="current-value" value={currentValue} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-value">New {fieldName}</Label>
            <Input
              id="new-value"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder={`Enter new ${fieldName.toLowerCase()}`}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password to confirm"
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

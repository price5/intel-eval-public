import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  isAvailable: boolean | null;
  suggestions: string[];
  isChecking: boolean;
}

export const useUsernameValidation = (username: string) => {
  const [result, setResult] = useState<ValidationResult>({
    isValid: false,
    errors: [],
    isAvailable: null,
    suggestions: [],
    isChecking: false,
  });

  useEffect(() => {
    const validateUsername = async () => {
      const errors: string[] = [];
      
      // Basic validation rules
      if (username.length === 0) {
        setResult({
          isValid: false,
          errors: [],
          isAvailable: null,
          suggestions: [],
          isChecking: false,
        });
        return;
      }

      if (username.length < 3) {
        errors.push('Must be at least 3 characters long');
      }

      if (username.length > 20) {
        errors.push('Must be no more than 20 characters long');
      }

      if (!/^[a-zA-Z_]/.test(username)) {
        errors.push('Must start with a letter or underscore');
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        errors.push('Can only contain letters, numbers, and underscores');
      }

      if (/^_+$/.test(username)) {
        errors.push('Cannot be only underscores');
      }

      if (/_{2,}/.test(username)) {
        errors.push('Cannot have consecutive underscores');
      }

      const isValid = errors.length === 0;

      if (!isValid) {
        setResult({
          isValid: false,
          errors,
          isAvailable: null,
          suggestions: [],
          isChecking: false,
        });
        return;
      }

      // Check availability if valid
      setResult(prev => ({ ...prev, isChecking: true }));

      try {
        const { data: isAvailable, error } = await supabase.rpc('is_username_available', {
          username_to_check: username
        });

        if (error) throw error;

        let suggestions: string[] = [];
        if (!isAvailable) {
          const { data: suggestionsData, error: suggestionsError } = await supabase.rpc('suggest_usernames', {
            base_username: username
          });
          
          if (!suggestionsError && suggestionsData) {
            suggestions = suggestionsData;
          }
        }

        setResult({
          isValid: true,
          errors: [],
          isAvailable,
          suggestions,
          isChecking: false,
        });
      } catch (error) {
        console.error('Error checking username availability:', error);
        setResult({
          isValid: true,
          errors: [],
          isAvailable: null,
          suggestions: [],
          isChecking: false,
        });
      }
    };

    const timeoutId = setTimeout(validateUsername, 300);
    return () => clearTimeout(timeoutId);
  }, [username]);

  return result;
};
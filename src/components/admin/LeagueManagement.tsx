import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RefreshCw, Users, Trophy } from 'lucide-react';

export const LeagueManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleInitializeLeagues = async () => {
    try {
      setLoading(true);
      toast.info('Initializing weekly leagues...');

      const { error } = await supabase.functions.invoke('weekly-league-reset');

      if (error) throw error;

      toast.success('Weekly leagues initialized successfully!');
    } catch (error) {
      console.error('Error initializing leagues:', error);
      toast.error('Failed to initialize leagues');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPromotions = async () => {
    try {
      setLoading(true);
      toast.info('Processing weekly promotions...');

      const { error } = await supabase.functions.invoke('weekly-league-reset');

      if (error) throw error;

      toast.success('Promotions processed and new leagues created!');
    } catch (error) {
      console.error('Error processing promotions:', error);
      toast.error('Failed to process promotions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Weekly League Management
        </CardTitle>
        <CardDescription>
          Manage weekly XP leagues and process promotions/demotions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            Initialize Leagues
          </h4>
          <p className="text-sm text-muted-foreground mb-3">
            Create league structure for the current week. New users will be automatically placed when they earn their first XP.
          </p>
          <Button
            onClick={handleInitializeLeagues}
            disabled={loading}
            variant="outline"
          >
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Initializing...
              </>
            ) : (
              'Initialize Leagues'
            )}
          </Button>
        </div>

        <div className="space-y-2 pt-4 border-t">
          <h4 className="font-semibold flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Process Weekly Reset
          </h4>
          <p className="text-sm text-muted-foreground mb-3">
            Manually trigger the weekly reset: process promotions/demotions from last week and rebalance all users into new leagues.
            This normally runs automatically every Sunday at 2pm IST (08:30 UTC).
          </p>
          <Button
            onClick={handleProcessPromotions}
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Process Weekly Reset'
            )}
          </Button>
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h5 className="font-medium text-sm mb-2">ℹ️ About Weekly Leagues</h5>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Week runs Sunday 2pm IST to next Sunday 2pm IST</li>
            <li>• Max 20 users per league; leagues filled sequentially</li>
            <li>• Top 25% promoted, bottom 25% demoted each week</li>
            <li>• All users rebalanced into new leagues each week by rank</li>
            <li>• New users placed immediately with XP backfilled since Sunday</li>
            <li>• Tiers: Initiate → Thinker → Strategist → Analyst → Prodigy → Mastermind</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
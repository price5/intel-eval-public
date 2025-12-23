import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting season archival process...');

    // Calculate current season name (e.g., "October 2025")
    const now = new Date();
    const seasonName = now.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });

    console.log(`Archiving season: ${seasonName}`);

    // First, calculate current rankings
    const { error: rankingError } = await supabase.rpc('calculate_user_rankings');
    
    if (rankingError) {
      console.error('Error calculating rankings:', rankingError);
      throw rankingError;
    }

    // Fetch all current rankings
    const { data: rankings, error: fetchError } = await supabase
      .from('user_rankings')
      .select('*');

    if (fetchError) {
      console.error('Error fetching rankings:', fetchError);
      throw fetchError;
    }

    if (!rankings || rankings.length === 0) {
      console.log('No rankings to archive');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No rankings to archive',
          archived: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${rankings.length} rankings to archive`);

    // Archive each ranking to leaderboard_history
    const archivalPromises = rankings.map(async (ranking) => {
      return supabase
        .from('leaderboard_history')
        .insert({
          user_id: ranking.user_id,
          season: seasonName,
          rank_overall: ranking.current_rank_overall,
          rank_code: ranking.current_rank_code,
          rank_explanation: ranking.current_rank_explanation,
          score_overall: ranking.avg_score_overall,
          score_code: ranking.avg_score_code,
          score_explanation: ranking.avg_score_explanation,
          total_submissions: ranking.total_submissions
        });
    });

    const results = await Promise.allSettled(archivalPromises);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Archival complete: ${successful} succeeded, ${failed} failed`);

    // Log any failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Failed to archive ranking ${index}:`, result.reason);
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        season: seasonName,
        archived: successful,
        failed: failed,
        total: rankings.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in archive-season-rankings:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

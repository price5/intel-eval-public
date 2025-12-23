import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EventPayload {
  event_type: string;
  event_data?: Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const payload: EventPayload = await req.json();
    
    // Insert event into achievement_events
    const { error: eventError } = await supabase
      .from('achievement_events')
      .insert({
        user_id: user.id,
        event_type: payload.event_type,
        event_data: payload.event_data || {}
      });

    if (eventError) {
      console.error('Error inserting event:', eventError);
      throw eventError;
    }

    // Evaluate achievements in real-time
    const { data: newAchievements, error: evalError } = await supabase
      .rpc('evaluate_and_award_achievements', { user_id_param: user.id });

    if (evalError) {
      console.error('Error evaluating achievements:', evalError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        newly_awarded: newAchievements || [] 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
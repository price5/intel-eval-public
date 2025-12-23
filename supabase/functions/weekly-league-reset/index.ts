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
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    console.log('Starting weekly league reset (Sunday 2pm IST / 08:30 UTC)...');

    // Process promotions from last week
    console.log('Processing promotions from last week...');
    const { error: promotionError } = await supabase.rpc('process_weekly_promotions');
    if (promotionError) {
      console.error('Error processing promotions:', promotionError);
      throw promotionError;
    }
    console.log('✅ Promotions processed successfully');

    // Create new balanced leagues for this week (Option A: Rebalance ALL users)
    console.log('Creating new balanced leagues...');
    const { error: creationError } = await supabase.rpc('create_weekly_leagues');
    if (creationError) {
      console.error('Error creating new leagues:', creationError);
      throw creationError;
    }
    console.log('✅ New balanced leagues created successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Weekly league reset completed successfully',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in weekly league reset:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
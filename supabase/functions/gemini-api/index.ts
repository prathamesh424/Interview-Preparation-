import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
}

serve(async (req) => {
  console.log(`--- New gemini-api request: ${req.method} ${req.url} ---`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Validate environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase environment variables not configured');
    }

    // Validate authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authorization header with Bearer token required' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.split(' ')[1];
    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
      auth: {
        persistSession: false
      }
    });

    // Verify the token directly
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication error:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token', details: authError?.message }),
        { status: 401, headers: corsHeaders }
      );
    }

    console.log('Authenticated user:', user.id);

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { action, modelName, content, apiKey } = body;

    // Get user API key from database if not provided
    let geminiApiKey = apiKey;
    if (!geminiApiKey) {
      const { data: apiKeyData, error: apiKeyError } = await supabaseClient
        .from('api_keys')
        .select('key_value')
        .eq('service_name', 'gemini')
        .eq('user_id', user.id)
        .single();

      if (apiKeyError || !apiKeyData) {
        return new Response(
          JSON.stringify({ error: 'API key not found' }),
          { status: 400, headers: corsHeaders }
        );
      }
      geminiApiKey = apiKeyData.key_value;
    }

    // Rest of your existing logic for handling actions...
    // [Keep all your existing action handling code here]
    // ...

  } catch (error) {
    console.error('Unhandled error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createSupabaseServerClient } from '@supabase/auth-helpers-sveltekit';
import type { Handle } from '@sveltejs/kit';
import { createPrivyWallet } from '$lib/server/privy';
import { supabase } from '$lib/supabase';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createSupabaseServerClient({
    supabaseUrl: PUBLIC_SUPABASE_URL,
    supabaseKey: PUBLIC_SUPABASE_ANON_KEY,
    event
  });

  event.locals.getSession = async () => {
    const { data: { session } } = await event.locals.supabase.auth.getSession();
    return session;
  };

  // Handle both new signups and existing user logins
  if (event.url.pathname === '/auth/callback' || event.url.pathname === '/dashboard') {
    const session = await event.locals.getSession();
    if (session) {
      try {
        // Check if user already has a wallet
        const { data: profile } = await event.locals.supabase
          .from('profiles')
          .select('wallet_address')
          .eq('id', session.user.id)
          .single();

        // Create wallet if user doesn't have one
        if (!profile?.wallet_address) {
          console.log('Creating wallet for user:', session.user.id);
          
          // First update profile to show wallet creation is in progress
          await event.locals.supabase
            .from('profiles')
            .update({ 
              wallet_status: 'creating',
              updated_at: new Date().toISOString()
            })
            .eq('id', session.user.id);

          const response = await createPrivyWallet(event.request);
          const data = await response.json();

          if (response.ok) {
            await event.locals.supabase
              .from('profiles')
              .update({ 
                wallet_address: data.address,
                wallet_status: 'active',
                updated_at: new Date().toISOString()
              })
              .eq('id', session.user.id);
            
            console.log('Wallet created successfully:', data.address);
          } else {
            await event.locals.supabase
              .from('profiles')
              .update({ 
                wallet_status: 'failed',
                updated_at: new Date().toISOString()
              })
              .eq('id', session.user.id);
            
            console.error('Failed to create wallet:', data);
          }
        }
      } catch (error) {
        console.error('Failed to check/create wallet for user:', error);
        // Update profile to show wallet creation failed
        await event.locals.supabase
          .from('profiles')
          .update({ 
            wallet_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', session.user.id);
      }
    }
  }

  // Get the session from the request
  const authHeader = event.request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user) {
      event.locals.user = user;
      event.locals.token = token;
    }
  }

  // Check auth for API routes
  if (event.url.pathname.startsWith('/api/')) {
    const session = await event.locals.getSession();
    const authHeader = event.request.headers.get('authorization');

    if (!session?.access_token) {
      return new Response(
        JSON.stringify({ error: 'No active session' }), 
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization header' }), 
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const providedToken = authHeader.split(' ')[1];
    if (providedToken !== session.access_token) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }), 
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Add session to request for downstream handlers
    event.locals.session = session;
  }

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range';
    }
  });
}; 
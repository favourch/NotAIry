import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createSupabaseServerClient } from '@supabase/auth-helpers-sveltekit';
import type { Handle } from '@sveltejs/kit';
import { createPrivyWallet } from '$lib/server/privy';

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

  // Handle new user signup
  if (event.url.pathname === '/auth/callback') {
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
          const response = await createPrivyWallet(event.request);
          const data = await response.json();

          if (response.ok) {
            await event.locals.supabase
              .from('profiles')
              .update({ 
                wallet_address: data.address,
                updated_at: new Date().toISOString()
              })
              .eq('id', session.user.id);
          }
        }
      } catch (error) {
        console.error('Failed to create wallet for new user:', error);
      }
    }
  }

  // Check auth for API routes
  if (event.url.pathname.startsWith('/api/')) {
    const session = await event.locals.getSession();
    if (!session?.access_token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Clone the request and add auth header
    const newRequest = new Request(event.request.url, {
      method: event.request.method,
      headers: new Headers(event.request.headers),
      body: event.request.body
    });
    newRequest.headers.set('Authorization', `Bearer ${session.access_token}`);
    event.request = newRequest;
  }

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range';
    }
  });
}; 
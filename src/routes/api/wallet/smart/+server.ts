import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';
import { PUBLIC_PRIVY_APP_ID } from '$env/static/public';
import type { RequestHandler } from './$types';

const PRIVY_API_BASE = 'https://api.privy.io/api/v1';

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Get the authorization header and verify it's a Bearer token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('No Bearer token found');
      return new Response('Unauthorized - No Bearer token', { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    // Verify the JWT token with Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('Session error:', sessionError);
      return new Response('Invalid session', { status: 401 });
    }

    // Get the user from the session
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error('User error:', userError);
      return new Response('Invalid user', { status: 401 });
    }

    console.log('Authenticated user:', user.email); // Debug log

    // Get user's profile with email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return new Response('Failed to get user profile', { status: 500 });
    }

    const userEmail = profile.email || user.email;
    console.log('Using email:', userEmail); // Debug log

    // Create or get user in Privy
    const privyUserResponse = await fetch(`${PRIVY_API_BASE}/users`, {
      method: 'POST',
      headers: {
        'privy-app-id': PUBLIC_PRIVY_APP_ID,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: userEmail,
        user_id: user.id
      })
    });

    if (!privyUserResponse.ok) {
      const error = await privyUserResponse.json();
      console.error('Privy user creation error:', error);
      throw new Error(error.message || 'Failed to create Privy user');
    }

    const privyUser = await privyUserResponse.json();
    console.log('Privy user created:', privyUser); // Debug log

    // Create smart wallet
    const response = await fetch(`${PRIVY_API_BASE}/wallets`, {
      method: 'POST',
      headers: {
        'privy-app-id': PUBLIC_PRIVY_APP_ID,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: privyUser.id,
        chainId: '0x66eee',
        implementation: 'KERNEL',
        email: userEmail
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Wallet creation error:', error);
      throw new Error(error.message || 'Failed to create smart wallet');
    }

    const wallet = await response.json();
    console.log('Wallet created:', wallet); // Debug log

    // Update user profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        wallet_address: wallet.address,
        wallet_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
    }

    return json({
      address: wallet.address,
      network: 'Arbitrum Sepolia'
    });

  } catch (error) {
    console.error('Error in wallet creation:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to create smart wallet' 
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}; 
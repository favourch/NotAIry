import { json } from '@sveltejs/kit';
import { createPrivyWallet } from '$lib/server/privy';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ request, locals }: RequestEvent) {
  try {
    const session = await locals.getSession();
    if (!session?.access_token) {
      return json(
        { error: 'Unauthorized' }, 
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const response = await createPrivyWallet(request);
    const data = await response.json();

    if (!response.ok) {
      console.error('Privy API error:', data);
      return json({ error: data.message || 'Failed to create wallet' }, { status: response.status });
    }

    // Update user profile with wallet address
    const { error: updateError } = await locals.supabase
      .from('profiles')
      .update({ 
        wallet_address: data.address,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id);

    if (updateError) {
      console.error('Failed to update profile:', updateError);
    }

    return json({
      address: data.address,
      network: 'Arbitrum Sepolia'
    });
  } catch (error) {
    console.error('Failed to create wallet:', error);
    return json({ error: 'Failed to create wallet' }, { status: 500 });
  }
} 
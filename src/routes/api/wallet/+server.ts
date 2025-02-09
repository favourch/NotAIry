import { json } from '@sveltejs/kit';
import { createPrivyWallet } from '$lib/server/privy';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ request, locals }: RequestEvent) {
  try {
    const session = locals.session;
    if (!session?.user?.id) {
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

    // Create the wallet
    try {
      const response = await createPrivyWallet(request);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create wallet');
      }

      // Update user profile with wallet address
      const { error: updateError } = await locals.supabase
        .from('profiles')
        .update({ 
          wallet_address: data.address,
          wallet_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      if (updateError) {
        console.error('Failed to update profile:', updateError);
        return json({ error: 'Failed to update profile' }, { status: 500 });
      }

      return json({
        address: data.address,
        network: 'Arbitrum Sepolia'
      });
    } catch (error: any) {
      console.error('Wallet creation failed:', error);
      
      // Update profile status on failure
      await locals.supabase
        .from('profiles')
        .update({ 
          wallet_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      return json({ 
        error: error.message || 'Failed to create wallet' 
      }, { 
        status: 500 
      });
    }
  } catch (error) {
    console.error('API error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
} 
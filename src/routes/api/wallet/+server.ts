import { json } from '@sveltejs/kit';
import { createPrivyWallet } from '$lib/server/privy';

export async function POST() {
  try {
    const response = await createPrivyWallet();
    const data = await response.json();

    if (!response.ok) {
      return json({ error: data.message }, { status: response.status });
    }

    return json(data);
  } catch (error) {
    return json({ error: 'Failed to create wallet' }, { status: 500 });
  }
} 
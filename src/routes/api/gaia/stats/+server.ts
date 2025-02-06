import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGaiaHeaders } from '$lib/gaia';

export const GET: RequestHandler = async () => {
  try {
    // Mock response for now
    return json({
      total_notes: 156,
      verification_score: 0.945,
      pending_verifications: 3,
      reputation_score: 850
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch stats' }), {
      status: 500
    });
  }
}; 
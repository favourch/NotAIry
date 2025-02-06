import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGaiaHeaders } from '$lib/gaia';

export const GET: RequestHandler = async () => {
  try {
    // Mock response for now
    return json({
      notes: [
        {
          id: 'note-1',
          type: 'smart-contract',
          title: 'Gas Optimization Warning',
          content: 'Potential gas optimization in deposit function',
          created_at: new Date().toISOString(),
          status: 'verified',
          consensus: 0.92
        },
        {
          id: 'note-2',
          type: 'ai-model',
          title: 'Model Limitation Note',
          content: 'GPT-4 showing inconsistent results with complex mathematical proofs',
          created_at: new Date().toISOString(),
          status: 'pending',
          consensus: 0.78
        }
      ]
    });
  } catch (error) {
    console.error('Failed to fetch notes:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch notes' }), {
      status: 500
    });
  }
}; 
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabase';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const event = await request.json();

    switch (event.type) {
      case 'note.created':
        // Update note status in database
        await supabase
          .from('notes')
          .update({ status: 'pending_verification' })
          .eq('id', event.data.note_id);
        break;

      case 'verification.submitted':
        // Update verification count and consensus
        await supabase
          .from('notes')
          .update({
            verification_count: event.data.verification_count,
            consensus: event.data.consensus
          })
          .eq('id', event.data.note_id);
        break;

      case 'consensus.reached':
        // Update note status based on consensus
        await supabase
          .from('notes')
          .update({
            status: event.data.consensus >= 0.75 ? 'verified' : 'rejected',
            final_consensus: event.data.consensus
          })
          .eq('id', event.data.note_id);
        break;
    }

    return json({ success: true });
  } catch (error) {
    console.error('Error processing GAIA webhook:', error);
    return new Response(JSON.stringify({ error: 'Failed to process webhook' }), {
      status: 500
    });
  }
}; 
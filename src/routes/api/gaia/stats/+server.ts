import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabase';

interface UserStats {
  id: string;
  wallet_id: string;
  total_notes: number;
  verification_score: string;
  pending_verifications: number;
  reputation_score: number;
}

export const GET: RequestHandler = async ({ request }) => {
  try {
    const walletId = request.headers.get('x-user-id');
    if (!walletId) {
      return json({
        total_notes: 0,
        verification_score: '0%',
        pending_verifications: 0,
        reputation_score: 0
      });
    }

    // Count user's notes from notes table
    const { count: notesCount, error: countError } = await supabase
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('wallet_id', walletId);

    if (countError) {
      console.error('Error counting notes:', countError);
    }

    // Count pending verifications
    const { count: pendingCount, error: pendingError } = await supabase
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('wallet_id', walletId)
      .eq('status', 'pending');

    if (pendingError) {
      console.error('Error counting pending notes:', pendingError);
    }

    // Calculate verification score (percentage of verified notes)
    const { count: verifiedCount, error: verifiedError } = await supabase
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('wallet_id', walletId)
      .eq('status', 'verified');

    if (verifiedError) {
      console.error('Error counting verified notes:', verifiedError);
    }

    // Ensure we have valid numbers
    const totalNotes = notesCount || 0;
    const verified = verifiedCount || 0;
    const pending = pendingCount || 0;

    // Calculate verification score
    const verificationScore = totalNotes > 0 
      ? ((verified / totalNotes) * 100).toFixed(1)
      : '0';

    // Calculate reputation score based on activity
    const reputationScore = Math.min(
      1000,
      (totalNotes * 10) + (verified * 50)
    );

    // Return calculated stats with proper formatting
    return json({
      total_notes: totalNotes,
      verification_score: `${verificationScore}%`,
      pending_verifications: pending,
      reputation_score: reputationScore
    });

  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return json({
      total_notes: 0,
      verification_score: '0%',
      pending_verifications: 0,
      reputation_score: 0
    });
  }
}; 
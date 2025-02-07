import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabase';

interface Note {
  id: string;
  created_at: string;
  wallet_id: string;
  type: 'smart-contract' | 'ai-model' | 'defi-protocol';
  title: string;
  content: string;
  source_url: string;
  status: 'pending' | 'verified' | 'rejected';
  consensus: number;
  verifications?: Array<{
    is_verified: boolean;
    wallet_id: string;
  }>;
}

export const GET: RequestHandler = async () => {
  try {
    // Fetch all notes with their verifications (if any)
    const { data: notes, error } = await supabase
      .from('notes')
      .select(`
        id,
        created_at,
        wallet_id,
        type,
        title,
        content,
        source_url,
        status,
        consensus,
        verifications:verifications(
          is_verified,
          wallet_id
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform the data to match the frontend expectations
    const transformedNotes = (notes || []).map((note: Note) => {
      // Calculate consensus based on verifications (if any)
      const verifications = note.verifications || [];
      const totalVerifications = verifications.length;
      const positiveVerifications = verifications.filter(v => v.is_verified).length;
      
      // Default to 0% if no verifications
      const calculatedConsensus = totalVerifications > 0 
        ? (positiveVerifications / totalVerifications) * 100 
        : 0;

      return {
        ...note,
        consensus: `${Math.round(calculatedConsensus)}%`,
        timestamp: formatRelativeTime(note.created_at),
        verifications: verifications
      };
    });

    return json({ notes: transformedNotes });
  } catch (error) {
    console.error('Failed to fetch notes:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch notes' }), {
      status: 500
    });
  }
};

// Helper function to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
} 
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabase';
import { GAIA_API_KEY } from '$env/static/private';

export const POST: RequestHandler = async (event) => {
  // Get authenticated user session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { prompt } = await event.request.json();

    const response = await fetch('https://coder.gaia.domains/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GAIA_API_KEY}`
      },
      body: JSON.stringify({
        prompt,
        max_length: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate story ideas');
    }

    const data = await response.json();
    return json({ ideas: data.generated_text });
  } catch (error) {
    console.error('Error generating ideas:', error);
    return new Response('Failed to generate story ideas', { status: 500 });
  }
}; 
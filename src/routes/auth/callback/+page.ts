import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';

export const load = async ({ url }) => {
  const code = url.searchParams.get('code');

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
    throw redirect(303, '/dashboard');
  }

  throw redirect(303, '/');
}; 
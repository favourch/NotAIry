import { invalidate } from '$app/navigation';
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';

export const load = async ({ data, depends }) => {
  depends('supabase:auth');

  const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

  const {
    data: { session }
  } = await supabase.auth.getSession();

  return { ...data, session };
}; 
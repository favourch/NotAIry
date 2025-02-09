<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { user } from '$lib/stores';

  onMount(() => {
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      $user = session?.user ?? null;
    });

    return () => {
      subscription.unsubscribe();
    };
  });
</script>

<main>
  <slot />
</main>

<style>
  main {
    min-height: 100vh;
    background: #0F0F0F;
    color: rgba(255, 255, 255, 0.9);
  }
</style> 
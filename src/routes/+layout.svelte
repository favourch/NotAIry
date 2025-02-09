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

<nav>
  <a href="/">Home</a>
  <a href="/stories">Stories</a>
  <a href="/write">Write</a>
  <a href="/dashboard">Dashboard</a>
  <a href="/reviews">Reviews</a>
  {#if !$user}
    <a href="/login">Login</a>
  {/if}
</nav>

<main>
  <slot />
</main>

<style>
  nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    padding: 16px 40px;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
    display: flex;
    gap: 24px;
    z-index: 100;
  }

  nav a {
    color: #A5A5A5;
    text-decoration: none;
    font-size: 14px;
    transition: all 0.2s;
  }

  nav a:hover {
    color: white;
  }

  main {
    min-height: 100vh;
    background: #0F0F0F;
    color: rgba(255, 255, 255, 0.9);
  }

  @media (max-width: 768px) {
    nav {
      padding: 16px 20px;
    }
  }
</style> 
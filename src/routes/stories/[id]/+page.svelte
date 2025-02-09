<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';
  import Toast from '$lib/components/Toast.svelte';
  import { page } from '$app/stores';

  let story: any = null;
  let loading = true;
  let toast: { message: string; type: 'success' | 'error' | 'info' } | null = null;

  const icons = {
    back: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>`,
    heart: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
    comment: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
  };

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    toast = { message, type };
    setTimeout(() => {
      toast = null;
    }, 3000);
  }

  onMount(async () => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*, profiles(email)')
        .eq('id', $page.params.id)
        .single();

      if (error) throw error;
      story = data;
    } catch (err) {
      console.error('Failed to load story:', err);
      showToast('Failed to load story', 'error');
    } finally {
      loading = false;
    }
  });

  $: formattedAddress = (address: string) => 
    address ? `${address.slice(0,6)}...${address.slice(-4)}` : '';
</script>

<div class="story-container">
  {#if toast}
    <Toast message={toast.message} type={toast.type} />
  {/if}

  <header class="story-header">
    <button class="back-button" on:click={() => goto('/dashboard')}>
      {@html icons.back}
      Back to Dashboard
    </button>
  </header>

  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <span>Loading story...</span>
    </div>
  {:else if story}
    <article class="story">
      <header>
        <h1>{story.title}</h1>
        <div class="meta">
          <span class="author">By {story.profiles.email}</span>
          {#if story.wallet_address}
            <span class="wallet-tag" title="Published with Web3 Wallet">
              <svg 
                class="wallet-mini-icon" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                stroke-width="2" 
                stroke-linecap="round" 
                stroke-linejoin="round"
              >
                <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
                <path d="M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" />
                <line x1="16" y1="11" x2="16" y2="11.01" />
                <line x1="19" y1="11" x2="19" y2="11.01" />
              </svg>
              {formattedAddress(story.wallet_address)}
            </span>
          {/if}
          <div class="engagement">
            <span class="likes" title="Likes">
              {@html icons.heart} {story.likes || 0}
            </span>
            <span class="comments" title="Comments">
              {@html icons.comment} {story.comments || 0}
            </span>
          </div>
        </div>
        <div class="tags">
          {#each story.story_type.split('-') as tag}
            <span class="tag">{tag}</span>
          {/each}
        </div>
      </header>
      <div class="content">
        {story.content}
      </div>
    </article>
  {:else}
    <div class="error">
      <p>Story not found</p>
      <button class="action-button" on:click={() => goto('/dashboard')}>
        Return to Dashboard
      </button>
    </div>
  {/if}
</div>

<style>
  .story-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 104px 40px 80px;
  }

  .story-header {
    margin-bottom: 40px;
  }

  .back-button {
    display: flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: none;
    color: #A5A5A5;
    font-size: 14px;
    cursor: pointer;
    padding: 8px;
    border-radius: 6px;
    transition: all 0.2s;
  }

  .back-button:hover {
    color: white;
    background: rgba(255, 255, 255, 0.05);
  }

  .story {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 32px;
  }

  .story h1 {
    font-size: 32px;
    font-weight: 600;
    margin: 0 0 24px;
    color: white;
  }

  .meta {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .author {
    color: #A5A5A5;
    font-size: 14px;
  }

  .content {
    color: rgba(255, 255, 255, 0.9);
    font-size: 16px;
    line-height: 1.8;
    white-space: pre-wrap;
  }

  /* Reuse existing styles for wallet-tag, tags, etc. */
</style> 
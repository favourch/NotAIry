<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';
  import Toast from '$lib/components/Toast.svelte';
  import { page } from '$app/stores';
  import { marked } from 'marked';

  let story: any = null;
  let loading = true;
  let toast: { message: string; type: 'success' | 'error' | 'info' } | null = null;
  let resubmitting = false;

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
      // First get the story
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .select('*')
        .eq('id', $page.params.id)
        .single();

      if (storyError) throw storyError;

      // Then get the author's profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', storyData.author_id)
        .single();

      if (profileError) throw profileError;

      // Combine the data
      story = {
        ...storyData,
        profiles: profileData
      };
    } catch (err) {
      console.error('Failed to load story:', err);
      showToast('Failed to load story', 'error');
    } finally {
      loading = false;
    }
  });

  $: formattedAddress = (address: string) => 
    address ? `${address.slice(0,6)}...${address.slice(-4)}` : '';

  // Add timestamp formatting
  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Add function to format username from email
  function formatUsername(email: string): string {
    return email.split('@')[0]
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  // Add markdown rendering
  $: renderedContent = story?.content ? marked(story.content) : '';

  async function handleResubmit() {
    if (resubmitting) return;
    resubmitting = true;
    try {
      const { error } = await supabase
        .from('stories')
        .update({ 
          status: 'in_review',
          updated_at: new Date().toISOString()
        })
        .eq('id', story.id);

      if (error) throw error;
      
      showToast('Story resubmitted for review', 'success');
      goto(`/stories/${story.id}?${Date.now()}`, { replaceState: true });
    } catch (err) {
      console.error('Failed to resubmit story:', err);
      showToast('Failed to resubmit story', 'error');
    } finally {
      resubmitting = false;
    }
  }
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
      <header class="story-meta">
        <div class="meta-top">
          <div class="status-badge {story.status}">{story.status}</div>
          <div class="meta-actions">
            <time class="timestamp">{formatDate(story.created_at)}</time>
            {#if story.status === 'rejected' || story.status === 'in_review'}
              <button class="resubmit-button" on:click={handleResubmit} disabled={resubmitting}>
                {#if resubmitting}
                  <svg 
                    class="spinner-icon" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    stroke-width="2" 
                    stroke-linecap="round" 
                    stroke-linejoin="round"
                  >
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                    <path d="M12 2v4"></path>
                  </svg>
                {:else}
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    stroke-width="2" 
                    stroke-linecap="round" 
                    stroke-linejoin="round"
                  >
                    <path d="M21 2v6h-6"></path>
                    <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                    <path d="M3 22v-6h6"></path>
                    <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                  </svg>
                {/if}
                {resubmitting ? 'Resubmitting...' : 'Resubmit for Review'}
              </button>
            {/if}
            <a 
              href="/stories/{story.id}/review" 
              class="review-link"
              title="View review details"
            >
              View Review
            </a>
          </div>
        </div>
        <h1>{story.title}</h1>
        <div class="meta">
          {#if story.wallet_address}
            <span class="author">
              By 
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
      <div class="content markdown-content">
        {@html renderedContent}
      </div>
      <footer class="story-footer">
        <div class="engagement-actions">
          <button class="action-button like-button" title="Like this story">
            {@html icons.heart}
            <span>Like</span>
          </button>
          <button class="action-button comment-button" title="Comment on this story">
            {@html icons.comment}
            <span>Comment</span>
          </button>
        </div>
      </footer>
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
    display: flex;
    align-items: center;
    gap: 8px;
    color: #A5A5A5;
    font-size: 14px;
  }

  .content {
    color: rgba(255, 255, 255, 0.9);
    font-size: 16px;
    line-height: 1.8;
  }

  .story-meta {
    margin-bottom: 32px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 24px;
  }

  .meta-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .status-badge {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .status-badge.draft {
    background: rgba(255, 255, 255, 0.1);
    color: #A5A5A5;
  }

  .status-badge.in_review {
    background: rgba(234, 179, 8, 0.1);
    color: #EAB308;
  }

  .status-badge.published {
    background: rgba(34, 197, 94, 0.1);
    color: #22C55E;
  }

  .status-badge.rejected {
    background: rgba(239, 68, 68, 0.1);
    color: #EF4444;
  }

  .timestamp {
    color: #A5A5A5;
    font-size: 14px;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 16px;
  }

  .tag {
    background: rgba(255, 255, 255, 0.05);
    color: #A5A5A5;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    text-transform: capitalize;
  }

  .engagement {
    display: flex;
    gap: 16px;
  }

  .likes, .comments {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #A5A5A5;
    font-size: 14px;
  }

  .story-footer {
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .engagement-actions {
    display: flex;
    gap: 16px;
  }

  .action-button {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .action-button:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
  }

  .like-button:hover {
    color: #EF4444;
    border-color: #EF4444;
    background: rgba(239, 68, 68, 0.1);
  }

  .comment-button:hover {
    color: #3B82F6;
    border-color: #3B82F6;
    background: rgba(59, 130, 246, 0.1);
  }

  .wallet-tag {
    display: flex;
    align-items: center;
    gap: 4px;
    background: rgba(246, 133, 27, 0.1);
    border: 1px solid #F6851B;
    color: #F6851B;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-family: 'SF Mono', monospace;
  }

  .wallet-mini-icon {
    width: 12px;
    height: 12px;
  }

  .loading {
    display: flex;
    align-items: center;
    gap: 12px;
    color: rgba(255, 255, 255, 0.7);
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 768px) {
    .story-container {
      padding: 80px 20px 40px;
    }

    .meta {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .story h1 {
      font-size: 24px;
    }
  }

  /* Markdown content styles */
  .markdown-content :global(h1) {
    font-size: 2em;
    margin: 0.67em 0;
    color: white;
  }

  .markdown-content :global(h2) {
    font-size: 1.5em;
    margin: 0.83em 0;
    color: white;
  }

  .markdown-content :global(h3) {
    font-size: 1.17em;
    margin: 1em 0;
    color: white;
  }

  .markdown-content :global(p) {
    margin: 1em 0;
  }

  .markdown-content :global(ul), 
  .markdown-content :global(ol) {
    margin: 1em 0;
    padding-left: 2em;
  }

  .markdown-content :global(li) {
    margin: 0.5em 0;
  }

  .markdown-content :global(code) {
    background: rgba(255, 255, 255, 0.1);
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-family: 'SF Mono', monospace;
    font-size: 0.9em;
  }

  .markdown-content :global(pre) {
    background: rgba(255, 255, 255, 0.05);
    padding: 1em;
    border-radius: 6px;
    overflow-x: auto;
    margin: 1em 0;
  }

  .markdown-content :global(pre code) {
    background: none;
    padding: 0;
  }

  .markdown-content :global(blockquote) {
    margin: 1em 0;
    padding-left: 1em;
    border-left: 4px solid rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.7);
  }

  .markdown-content :global(a) {
    color: #8B5CF6;
    text-decoration: none;
  }

  .markdown-content :global(a:hover) {
    text-decoration: underline;
  }

  .markdown-content :global(hr) {
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    margin: 2em 0;
  }

  .markdown-content :global(table) {
    border-collapse: collapse;
    width: 100%;
    margin: 1em 0;
  }

  .markdown-content :global(th),
  .markdown-content :global(td) {
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 0.5em;
    text-align: left;
  }

  .markdown-content :global(th) {
    background: rgba(255, 255, 255, 0.05);
  }

  .markdown-content :global(img) {
    max-width: 100%;
    height: auto;
    border-radius: 6px;
    margin: 1em 0;
  }

  .meta-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .review-link {
    color: #8B5CF6;
    font-size: 14px;
    text-decoration: none;
    transition: all 0.2s;
  }

  .review-link:hover {
    text-decoration: underline;
  }

  .resubmit-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .spinner-icon {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .story-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 32px;
  }
</style> 
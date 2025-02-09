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
    check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    x: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    clock: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`
  };

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    toast = { message, type };
    setTimeout(() => {
      toast = null;
    }, 3000);
  }

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

  onMount(async () => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
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

  $: statusIcon = story?.status === 'published' ? icons.check :
                  story?.status === 'rejected' ? icons.x :
                  icons.clock;

  $: statusColor = story?.status === 'published' ? '#22C55E' :
                   story?.status === 'rejected' ? '#EF4444' :
                   '#EAB308';

  $: scoreColor = (score: number) => 
    score >= 80 ? '#22C55E' :
    score >= 60 ? '#EAB308' :
    '#EF4444';
</script>

<div class="review-container">
  {#if toast}
    <Toast message={toast.message} type={toast.type} />
  {/if}

  <header class="review-header">
    <button class="back-button" on:click={() => goto(`/stories/${$page.params.id}`)}>
      {@html icons.back}
      Back to Story
    </button>
  </header>

  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <span>Loading review...</span>
    </div>
  {:else if story}
    <div class="review-content">
      <div class="status-section">
        <div class="status-header">
          <h1>Review Status</h1>
          <div class="status-badge" style="--status-color: {statusColor}">
            {@html statusIcon}
            {story.status}
          </div>
        </div>
        {#if story.reviewed_at}
          <p class="review-timestamp">Reviewed on {formatDate(story.reviewed_at)}</p>
        {/if}
      </div>

      {#if story.ai_review_score !== null}
        <div class="scores-section">
          <h2>AI Review Scores</h2>
          <div class="score-grid">
            <div class="score-card">
              <h3>Overall Score</h3>
              <div class="score" style="--score-color: {scoreColor(story.ai_review_score)}">
                {Math.round(story.ai_review_score)}%
              </div>
            </div>
            <div class="score-card">
              <h3>Technical Accuracy</h3>
              <div class="score" style="--score-color: {scoreColor(story.technical_accuracy)}">
                {Math.round(story.technical_accuracy)}%
              </div>
            </div>
            <div class="score-card">
              <h3>Content Quality</h3>
              <div class="score" style="--score-color: {scoreColor(story.content_quality)}">
                {Math.round(story.content_quality)}%
              </div>
            </div>
            <div class="score-card">
              <h3>Engagement</h3>
              <div class="score" style="--score-color: {scoreColor(story.engagement)}">
                {Math.round(story.engagement)}%
              </div>
            </div>
          </div>
        </div>

        {#if story.ai_review_feedback}
          <div class="feedback-section">
            <h2>AI Feedback</h2>
            <div class="feedback-content">
              {story.ai_review_feedback}
            </div>
          </div>
        {/if}
      {/if}
    </div>
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
  .review-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 104px 40px 80px;
  }

  .review-header {
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

  .review-content {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 32px;
  }

  .status-section {
    margin-bottom: 40px;
  }

  .status-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .status-header h1 {
    font-size: 32px;
    font-weight: 600;
    margin: 0;
    color: white;
  }

  .status-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    background: color-mix(in srgb, var(--status-color) 10%, transparent);
    color: var(--status-color);
    border: 1px solid var(--status-color);
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
    text-transform: capitalize;
  }

  .review-timestamp {
    color: #A5A5A5;
    font-size: 14px;
    margin: 0;
  }

  .scores-section {
    margin-bottom: 40px;
  }

  .scores-section h2 {
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 24px;
    color: white;
  }

  .score-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 24px;
  }

  .score-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 20px;
    text-align: center;
  }

  .score-card h3 {
    font-size: 14px;
    font-weight: 500;
    color: #A5A5A5;
    margin: 0 0 12px;
  }

  .score {
    font-size: 32px;
    font-weight: 600;
    color: var(--score-color);
  }

  .feedback-section h2 {
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 24px;
    color: white;
  }

  .feedback-content {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 20px;
    color: rgba(255, 255, 255, 0.9);
    font-size: 16px;
    line-height: 1.6;
    white-space: pre-line;
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
    .review-container {
      padding: 80px 20px 40px;
    }

    .status-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }

    .status-header h1 {
      font-size: 24px;
    }

    .score-grid {
      grid-template-columns: 1fr;
    }
  }
</style> 
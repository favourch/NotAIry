<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import Toast from '$lib/components/Toast.svelte';

  let stories: any[] = [];
  let loading = true;
  let toast: { message: string; type: 'success' | 'error' | 'info' } | null = null;
  let filter = 'all';
  let searchQuery = '';

  const icons = {
    check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    x: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    clock: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
    search: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`
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
      day: 'numeric'
    });
  }

  async function loadStories() {
    try {
      let query = supabase
        .from('stories')
        .select(`
          id,
          title,
          story_type,
          status,
          created_at,
          reviewed_at,
          ai_review_score,
          technical_accuracy,
          content_quality,
          engagement
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      stories = data;
    } catch (err) {
      console.error('Failed to load stories:', err);
      showToast('Failed to load stories', 'error');
    } finally {
      loading = false;
    }
  }

  onMount(loadStories);

  $: {
    if (filter || searchQuery !== undefined) {
      loading = true;
      loadStories();
    }
  }

  $: averageScore = stories.length ? 
    Math.round(stories.reduce((acc, story) => acc + (story.ai_review_score || 0), 0) / stories.length) : 0;

  $: publishRate = stories.length ?
    Math.round((stories.filter(s => s.status === 'published').length / stories.length) * 100) : 0;

  $: averageReviewTime = stories.filter(s => s.reviewed_at).length ?
    Math.round(stories
      .filter(s => s.reviewed_at)
      .reduce((acc, story) => {
        const reviewTime = new Date(story.reviewed_at).getTime() - new Date(story.created_at).getTime();
        return acc + reviewTime;
      }, 0) / (stories.filter(s => s.reviewed_at).length * 1000 * 60)) : 0; // in minutes
</script>

<div class="reviews-container">
  {#if toast}
    <Toast message={toast.message} type={toast.type} />
  {/if}

  <header class="reviews-header">
    <h1>Review Statistics</h1>
    <div class="stats-cards">
      <div class="stat-card">
        <h3>Average Score</h3>
        <div class="stat-value">{averageScore}%</div>
      </div>
      <div class="stat-card">
        <h3>Publication Rate</h3>
        <div class="stat-value">{publishRate}%</div>
      </div>
      <div class="stat-card">
        <h3>Avg Review Time</h3>
        <div class="stat-value">{averageReviewTime} min</div>
      </div>
    </div>
  </header>

  <div class="filters">
    <div class="search-box">
      {@html icons.search}
      <input
        type="text"
        placeholder="Search stories..."
        bind:value={searchQuery}
      />
    </div>
    <div class="filter-buttons">
      <button
        class="filter-button {filter === 'all' ? 'active' : ''}"
        on:click={() => filter = 'all'}
      >
        All
      </button>
      <button
        class="filter-button {filter === 'published' ? 'active' : ''}"
        on:click={() => filter = 'published'}
      >
        Published
      </button>
      <button
        class="filter-button {filter === 'in_review' ? 'active' : ''}"
        on:click={() => filter = 'in_review'}
      >
        In Review
      </button>
      <button
        class="filter-button {filter === 'rejected' ? 'active' : ''}"
        on:click={() => filter = 'rejected'}
      >
        Rejected
      </button>
    </div>
  </div>

  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <span>Loading reviews...</span>
    </div>
  {:else}
    <div class="reviews-grid">
      {#each stories as story (story.id)}
        <a href="/stories/{story.id}/review" class="review-card">
          <div class="review-header">
            <div class="status-badge {story.status}">
              {@html story.status === 'published' ? icons.check :
                     story.status === 'rejected' ? icons.x :
                     icons.clock}
              {story.status}
            </div>
            <time>{formatDate(story.created_at)}</time>
          </div>
          <h2>{story.title}</h2>
          <div class="story-type">{story.story_type}</div>
          {#if story.ai_review_score !== null}
            <div class="scores">
              <div class="score-item">
                <span>Overall</span>
                <div class="score">{Math.round(story.ai_review_score)}%</div>
              </div>
              <div class="score-item">
                <span>Technical</span>
                <div class="score">{Math.round(story.technical_accuracy)}%</div>
              </div>
              <div class="score-item">
                <span>Quality</span>
                <div class="score">{Math.round(story.content_quality)}%</div>
              </div>
              <div class="score-item">
                <span>Engagement</span>
                <div class="score">{Math.round(story.engagement)}%</div>
              </div>
            </div>
          {/if}
        </a>
      {/each}
    </div>
  {/if}
</div>

<style>
  .reviews-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 104px 40px 80px;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }

  .reviews-header {
    margin-bottom: 40px;
  }

  .reviews-header h1 {
    font-size: 32px;
    font-weight: 600;
    margin: 0 0 24px;
    color: white;
    font-family: 'Cal Sans', sans-serif;
  }

  .stats-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 24px;
    margin-bottom: 40px;
  }

  .stat-card {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 24px;
    text-align: center;
  }

  .stat-card h3 {
    font-size: 14px;
    font-weight: 500;
    color: #A5A5A5;
    margin: 0 0 12px;
    font-family: 'Cal Sans', sans-serif;
  }

  .stat-value {
    font-size: 36px;
    font-weight: 600;
    color: #8B5CF6;
    font-family: 'Cal Sans', sans-serif;
  }

  .filters {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
    gap: 24px;
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    padding: 8px 12px;
    flex: 1;
    max-width: 300px;
  }

  .search-box input {
    background: none;
    border: none;
    color: white;
    font-size: 14px;
    width: 100%;
    font-family: inherit;
  }

  .search-box input:focus {
    outline: none;
  }

  .filter-buttons {
    display: flex;
    gap: 8px;
  }

  .filter-button {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #A5A5A5;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
  }

  .filter-button:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .filter-button.active {
    background: rgba(139, 92, 246, 0.1);
    border-color: #8B5CF6;
    color: #8B5CF6;
  }

  .reviews-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
  }

  .review-card {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 24px;
    text-decoration: none;
    color: inherit;
    transition: all 0.2s;
  }

  .review-card:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.03);
  }

  .review-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .status-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 12px;
    text-transform: capitalize;
  }

  .status-badge.published {
    background: rgba(34, 197, 94, 0.1);
    color: #22C55E;
  }

  .status-badge.rejected {
    background: rgba(239, 68, 68, 0.1);
    color: #EF4444;
  }

  .status-badge.in_review {
    background: rgba(234, 179, 8, 0.1);
    color: #EAB308;
  }

  .review-card time {
    color: #A5A5A5;
    font-size: 12px;
  }

  .review-card h2 {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 8px;
    color: white;
    font-family: 'Cal Sans', sans-serif;
  }

  .story-type {
    font-size: 12px;
    color: #A5A5A5;
    margin-bottom: 16px;
    text-transform: capitalize;
  }

  .scores {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .score-item {
    text-align: center;
  }

  .score-item span {
    font-size: 12px;
    color: #A5A5A5;
  }

  .score-item .score {
    font-size: 18px;
    font-weight: 600;
    color: #8B5CF6;
    font-family: 'Cal Sans', sans-serif;
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
    .reviews-container {
      padding: 80px 20px 40px;
    }

    .filters {
      flex-direction: column;
      align-items: stretch;
    }

    .search-box {
      max-width: none;
    }

    .filter-buttons {
      overflow-x: auto;
      padding-bottom: 8px;
    }

    .filter-button {
      white-space: nowrap;
    }
  }
</style> 
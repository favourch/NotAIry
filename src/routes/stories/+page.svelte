<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import Toast from '$lib/components/Toast.svelte';
  import { marked } from 'marked';

  let stories: any[] = [];
  let loading = true;
  let toast: { message: string; type: 'success' | 'error' | 'info' } | null = null;
  let searchQuery = '';

  // Add pagination variables
  let currentPage = 1;
  let pageSize = 9;
  let totalStories = 0;
  let totalPages = 0;

  const icons = {
    search: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
    heart: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
    comment: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`
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

  // Function to safely get preview text from markdown
  function getPreviewText(markdown: string, length: number = 150): string {
    try {
      // Convert markdown to plain text by removing HTML tags
      const plainText = marked(markdown)
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      // Get preview and add ellipsis if needed
      return plainText.length > length 
        ? plainText.slice(0, length) + '...'
        : plainText;
    } catch (err) {
      console.error('Failed to parse markdown:', err);
      return markdown.slice(0, length) + '...';
    }
  }

  async function loadStories() {
    try {
      // First get total count
      let countQuery = supabase
        .from('stories')
        .select('id', { count: 'exact' })
        .eq('status', 'published');

      if (searchQuery) {
        countQuery = countQuery.ilike('title', `%${searchQuery}%`);
      }

      const { count, error: countError } = await countQuery;
      
      if (countError) throw countError;
      
      totalStories = count || 0;
      totalPages = Math.ceil(totalStories / pageSize);

      // Then get paginated data with proper join
      let query = supabase
        .from('stories')
        .select(`
          id,
          title,
          content,
          story_type,
          created_at,
          author:author_id (
            email
          )
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      stories = data || [];
    } catch (err) {
      console.error('Failed to load stories:', err);
      showToast('Failed to load stories', 'error');
    } finally {
      loading = false;
    }
  }

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
      loading = true;
      loadStories();
    }
  }

  // Watch for search changes
  $: {
    if (searchQuery !== undefined) {
      currentPage = 1;
      loading = true;
      loadStories();
    }
  }

  onMount(() => {
    loadStories();
  });
</script>

<div class="stories-container">
  {#if toast}
    <Toast message={toast.message} type={toast.type} />
  {/if}

  <header>
    <h1>NotAIry Stories</h1>
    <p class="subtitle">Discover stories from the Web3 community</p>
    <div class="search-box">
      {@html icons.search}
      <input
        type="text"
        placeholder="Search stories..."
        bind:value={searchQuery}
      />
    </div>
  </header>

  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <span>Loading stories...</span>
    </div>
  {:else}
    <div class="stories-grid">
      {#each stories as story (story.id)}
        <a href="/stories/{story.id}" class="story-card">
          <div class="story-meta">
            <div class="story-type">{story.story_type.replace(/-/g, ' ')}</div>
            <time>{formatDate(story.created_at)}</time>
          </div>
          <h2>{story.title}</h2>
          <p class="preview">
            {@html getPreviewText(story.content)}
          </p>
          <div class="story-footer">
            <div class="author">By {story.author?.email?.split('@')[0] || 'Anonymous'}</div>
            <div class="read-more">Read more →</div>
          </div>
        </a>
      {/each}
    </div>

    {#if totalPages > 1}
      <div class="pagination">
        <button 
          class="pagination-button" 
          disabled={currentPage === 1}
          on:click={() => goToPage(currentPage - 1)}
        >
          Previous
        </button>
        
        <div class="page-numbers">
          {#if currentPage > 2}
            <button 
              class="page-number"
              on:click={() => goToPage(1)}
            >
              1
            </button>
            {#if currentPage > 3}
              <span class="ellipsis">...</span>
            {/if}
          {/if}

          {#if currentPage > 1}
            <button 
              class="page-number"
              on:click={() => goToPage(currentPage - 1)}
            >
              {currentPage - 1}
            </button>
          {/if}

          <button class="page-number active">
            {currentPage}
          </button>

          {#if currentPage < totalPages}
            <button 
              class="page-number"
              on:click={() => goToPage(currentPage + 1)}
            >
              {currentPage + 1}
            </button>
          {/if}

          {#if currentPage < totalPages - 1}
            {#if currentPage < totalPages - 2}
              <span class="ellipsis">...</span>
            {/if}
            <button 
              class="page-number"
              on:click={() => goToPage(totalPages)}
            >
              {totalPages}
            </button>
          {/if}
        </div>

        <button 
          class="pagination-button" 
          disabled={currentPage === totalPages}
          on:click={() => goToPage(currentPage + 1)}
        >
          Next
        </button>
      </div>

      <div class="pagination-info">
        Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalStories)} of {totalStories} stories
      </div>
    {/if}
  {/if}
</div>

<style>
  .stories-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 104px 40px 80px;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }

  header {
    text-align: center;
    margin-bottom: 60px;
  }

  h1 {
    font-size: 48px;
    font-weight: 600;
    color: white;
    margin: 0 0 16px;
    font-family: 'Cal Sans', sans-serif;
  }

  .subtitle {
    font-size: 18px;
    color: #A5A5A5;
    margin: 0 0 32px;
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 12px 24px;
    border-radius: 8px;
    max-width: 500px;
    margin: 0 auto;
  }

  .search-box input {
    background: none;
    border: none;
    color: white;
    font-size: 16px;
    width: 100%;
    font-family: inherit;
  }

  .search-box input:focus {
    outline: none;
  }

  .stories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 32px;
    margin-bottom: 60px;
  }

  .story-card {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 32px;
    color: white;
    text-decoration: none;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
  }

  .story-card:hover {
    background: rgba(255, 255, 255, 0.05);
    transform: translateY(-2px);
  }

  .story-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .story-type {
    font-size: 14px;
    color: #8B5CF6;
    text-transform: capitalize;
    font-weight: 500;
  }

  time {
    font-size: 14px;
    color: #A5A5A5;
  }

  h2 {
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 16px;
    color: white;
    font-family: 'Cal Sans', sans-serif;
    line-height: 1.3;
  }

  .preview {
    color: #A5A5A5;
    font-size: 16px;
    line-height: 1.6;
    margin: 0 0 24px;
    flex-grow: 1;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }

  /* Add styles for any markdown elements that might show up in preview */
  .preview :global(p) {
    margin: 0;
  }

  .preview :global(a) {
    color: #8B5CF6;
    text-decoration: none;
  }

  .preview :global(code) {
    font-family: 'SF Mono', monospace;
    font-size: 14px;
    padding: 2px 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }

  .preview :global(pre) {
    overflow: hidden;
    max-height: 1.6em;
  }

  .story-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
    padding-top: 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .author {
    font-size: 14px;
    color: #A5A5A5;
  }

  .read-more {
    color: #8B5CF6;
    font-size: 14px;
    font-weight: 500;
  }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 40px;
  }

  .pagination-button {
    background: none;
    border: none;
    color: white;
    font-size: 14px;
    padding: 8px 16px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .pagination-button:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .pagination-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .page-numbers {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .page-number {
    background: none;
    border: none;
    color: white;
    font-size: 14px;
    padding: 8px 16px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .page-number:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .page-number.active {
    background: rgba(255, 255, 255, 0.05);
  }

  .ellipsis {
    color: #A5A5A5;
    font-size: 14px;
  }

  .pagination-info {
    margin-top: 20px;
    text-align: center;
    color: #A5A5A5;
    font-size: 14px;
  }

  @media (max-width: 768px) {
    .stories-container {
      padding: 80px 20px 40px;
    }

    h1 {
      font-size: 36px;
    }

    .subtitle {
      font-size: 16px;
    }

    .stories-grid {
      grid-template-columns: 1fr;
    }

    .story-card {
      padding: 24px;
    }

    h2 {
      font-size: 20px;
    }
  }
</style> 
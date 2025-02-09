<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';
  import Toast from '$lib/components/Toast.svelte';

  let title = '';
  let content = '';
  let storyType = 'smart-contract';
  let saving = false;
  let toast: { message: string; type: 'success' | 'error' | 'info' } | null = null;

  const types = [
    { value: 'smart-contract', label: 'Smart Contract' },
    { value: 'ai-model', label: 'AI Model' },
    { value: 'defi-protocol', label: 'DeFi Protocol' }
  ];

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    toast = { message, type };
  }

  async function handleSubmit() {
    if (!title.trim() || !content.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    saving = true;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        showToast('Please sign in to publish', 'error');
        goto('/login');
        return;
      }

      const { error } = await supabase.from('stories').insert({
        title,
        content,
        story_type: storyType,
        author_id: user.id,
        status: 'published'
      });

      if (error) {
        console.error('Error details:', error);
        throw error;
      }

      showToast('Story published successfully', 'success');
      goto('/dashboard');
    } catch (err) {
      console.error('Failed to publish story:', err);
      showToast(`Failed to publish story: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      saving = false;
    }
  }

  onMount(() => {
    // Check authentication
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast('Please sign in to write', 'error');
        goto('/login');
      }
    };
    checkAuth();
  });
</script>

<div class="write-container">
  {#if toast}
    <Toast message={toast.message} type={toast.type} />
  {/if}
  
  <header class="write-header">
    <h1>Write Your Story</h1>
    <button 
      class="publish-button" 
      on:click={handleSubmit}
      disabled={saving}
    >
      {saving ? 'Publishing...' : 'Publish'}
    </button>
  </header>

  <div class="write-form">
    <div class="form-group">
      <input
        type="text"
        placeholder="Enter your title"
        bind:value={title}
        class="title-input"
      />
    </div>

    <div class="form-group">
      <select bind:value={storyType} class="type-select">
        {#each types as typeOption}
          <option value={typeOption.value}>{typeOption.label}</option>
        {/each}
      </select>
    </div>

    <div class="form-group">
      <textarea
        placeholder="Write your story..."
        bind:value={content}
        class="content-input"
        rows="20"
      ></textarea>
    </div>
  </div>
</div>

<style>
  .write-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 40px 20px;
  }

  .write-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40px;
  }

  .write-header h1 {
    font-size: 32px;
    font-weight: 600;
    color: white;
    margin: 0;
  }

  .publish-button {
    background: rgba(255, 255, 255, 0.05);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 12px 24px;
    border-radius: 6px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .publish-button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
  }

  .publish-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .write-form {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .title-input {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    padding: 16px;
    border-radius: 6px;
    font-size: 24px;
    font-weight: 600;
    width: 100%;
  }

  .type-select {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    padding: 12px;
    border-radius: 6px;
    font-size: 16px;
    width: 200px;
  }

  .content-input {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    padding: 16px;
    border-radius: 6px;
    font-size: 16px;
    line-height: 1.6;
    width: 100%;
    resize: vertical;
    min-height: 400px;
  }

  .title-input:focus,
  .type-select:focus,
  .content-input:focus {
    outline: none;
    border-color: white;
  }

  /* Dark theme adjustments for select */
  .type-select option {
    background: #161616;
    color: white;
  }
</style> 
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';
  import Toast from '$lib/components/Toast.svelte';
  import { connectMetaMask } from '$lib/metamask';

  let title = '';
  let content = '';
  let storyType = 'smart-contract';
  let saving = false;
  let toast: { message: string; type: 'success' | 'error' | 'info' } | null = null;
  let user: any = null;
  let metamaskAddress: string | null = null;

  const types = [
    { value: 'smart-contract', label: 'Smart Contract', icon: '⚡' },
    { value: 'ai-model', label: 'AI Model', icon: '🤖' },
    { value: 'defi-protocol', label: 'DeFi Protocol', icon: '💰' }
  ];

  const icons = {
    pen: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`,
    save: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>`,
    back: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>`
  };

  const STATUS = {
    DRAFT: 'draft',
    PENDING: 'in_review',
    PUBLISHED: 'published',
    REJECTED: 'rejected'
  } as const;

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    toast = { message, type };
    setTimeout(() => {
      toast = null;
    }, 3000);
  }

  async function handleSubmit() {
    if (!title.trim() || !content.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    if (!metamaskAddress) {
      try {
        const address = await connectMetaMask();
        metamaskAddress = address;
        // Save to localStorage when connecting
        localStorage.setItem('metamask_address', address);
      } catch (err) {
        showToast('Please connect MetaMask to publish', 'error');
        return;
      }
    }

    saving = true;
    try {
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
        wallet_address: metamaskAddress,
        status: STATUS.PENDING,
        created_at: new Date().toISOString()
      });

      if (error) {
        console.error('Error details:', error);
        throw error;
      }

      showToast('Story submitted for review', 'success');
      goto('/dashboard');
    } catch (err) {
      console.error('Failed to publish story:', err);
      showToast('Failed to submit story', 'error');
    } finally {
      saving = false;
    }
  }

  async function handleSaveDraft() {
    if (!title.trim()) {
      showToast('Please enter a title', 'error');
      return;
    }

    saving = true;
    try {
      if (!user) {
        showToast('Please sign in to save', 'error');
        goto('/login');
        return;
      }

      const { error } = await supabase.from('stories').insert({
        title,
        content,
        story_type: storyType,
        author_id: user.id,
        status: STATUS.DRAFT,
        created_at: new Date().toISOString()
      });

      if (error) throw error;

      showToast('Draft saved successfully', 'success');
    } catch (err) {
      console.error('Failed to save draft:', err);
      showToast('Failed to save draft', 'error');
    } finally {
      saving = false;
    }
  }

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      showToast('Please sign in to write', 'error');
      goto('/login');
      return;
    }
    user = session.user;

    // Check for saved MetaMask connection
    const savedAddress = localStorage.getItem('metamask_address');
    if (savedAddress) {
      metamaskAddress = savedAddress;
    }
  });
</script>

<div class="write-container">
  {#if toast}
    <Toast message={toast.message} type={toast.type} />
  {/if}
  
  <header class="write-header">
    <div class="header-left">
      <button class="back-button" on:click={() => goto('/dashboard')}>
        {@html icons.back}
        Back
      </button>
      <h1>Write Your Story</h1>
    </div>
    <div class="header-actions">
      <button 
        class="save-button" 
        on:click={handleSaveDraft}
        disabled={saving}
      >
        {@html icons.save}
        Save Draft
      </button>
      <button 
        class="publish-button" 
        on:click={handleSubmit}
        disabled={saving}
      >
        {@html icons.pen}
        {saving ? 'Submitting...' : 'Submit for Review'}
      </button>
    </div>
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
          <option value={typeOption.value}>{typeOption.icon} {typeOption.label}</option>
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
    padding: 104px 40px 80px;
  }

  .write-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 24px;
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

  .write-header h1 {
    font-size: 32px;
    font-weight: 600;
    background: linear-gradient(90deg, #FFFFFF 0%, #A5A5A5 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0;
  }

  .header-actions {
    display: flex;
    gap: 16px;
  }

  .save-button,
  .publish-button {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.05);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 12px 24px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .save-button:hover:not(:disabled),
  .publish-button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
  }

  .publish-button {
    background: #10B981;
    border-color: #10B981;
  }

  .publish-button:hover:not(:disabled) {
    background: #059669;
  }

  .save-button:disabled,
  .publish-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
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
    font-size: 14px;
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
    font-family: inherit;
  }

  .title-input:focus,
  .type-select:focus,
  .content-input:focus {
    outline: none;
    border-color: white;
  }

  .type-select option {
    background: #161616;
    color: white;
    padding: 8px;
  }

  @media (max-width: 768px) {
    .write-container {
      padding: 80px 20px 40px;
    }

    .write-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }

    .header-actions {
      width: 100%;
    }

    .save-button,
    .publish-button {
      flex: 1;
      justify-content: center;
    }
  }
</style> 
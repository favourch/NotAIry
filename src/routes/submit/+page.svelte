<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { createWallet, getWalletBalance } from '$lib/privy';
  import { supabase } from '$lib/supabase';

  let loading = false;
  let wallet: any = null;
  let balance = '0';
  let error = '';

  // Form data
  let noteType = 'smart-contract';
  let title = '';
  let content = '';
  let sourceUrl = '';

  const noteTypes = [
    { id: 'smart-contract', label: 'Smart Contract' },
    { id: 'ai-model', label: 'AI Model' },
    { id: 'defi-protocol', label: 'DeFi Protocol' }
  ];

  onMount(async () => {
    try {
      wallet = await createWallet();
      if (wallet?.id) {
        balance = await getWalletBalance(wallet.id);
      }
    } catch (error) {
      console.error('Failed to initialize:', error);
    }
  });

  async function handleSubmit(event: Event) {
    event.preventDefault();
    loading = true;
    error = '';

    try {
      if (!wallet?.id) {
        throw new Error('Please connect your wallet first');
      }

      const { data, error: supabaseError } = await supabase
        .from('notes')
        .insert([
          {
            wallet_id: wallet.id,
            type: noteType,
            title,
            content,
            source_url: sourceUrl || null,
            status: 'pending',
            consensus: 0
          }
        ])
        .select()
        .single();

      if (supabaseError) {
        console.error('Supabase error:', supabaseError);
        throw new Error(supabaseError.message || 'Failed to submit note');
      }

      // Reset form and redirect
      title = '';
      content = '';
      sourceUrl = '';
      goto('/dashboard');
    } catch (err) {
      console.error('Failed to submit note:', err);
      error = err.message || 'Failed to submit note. Please try again.';
    } finally {
      loading = false;
    }
  }
</script>

<div class="submit-page">
  <nav class="nav">
    <div class="nav-content">
      <div class="left">
        <a href="/dashboard" class="logo">NotAIry</a>
        <span class="divider">/</span>
        <span class="page-title">Submit Note</span>
      </div>
      <div class="right">
        <span class="balance">USDC {balance}</span>
      </div>
    </div>
  </nav>

  <main class="content">
    <div class="form-container">
      <h1>Submit New Note</h1>
      <p class="subtitle">Share your observations about Web3 & AI systems</p>

      {#if error}
        <div class="error-message">
          {error}
        </div>
      {/if}

      <form on:submit={handleSubmit} class="note-form">
        <div class="form-group">
          <label for="noteType">Note Type</label>
          <div class="type-selector">
            {#each noteTypes as type}
              <label class="type-option">
                <input
                  type="radio"
                  name="noteType"
                  value={type.id}
                  bind:group={noteType}
                />
                <span class="type-label">{type.label}</span>
              </label>
            {/each}
          </div>
        </div>

        <div class="form-group">
          <label for="title">Title</label>
          <input
            type="text"
            id="title"
            bind:value={title}
            placeholder="Brief description of the observation"
            required
          />
        </div>

        <div class="form-group">
          <label for="content">Content</label>
          <textarea
            id="content"
            bind:value={content}
            placeholder="Detailed explanation of your observation..."
            rows="6"
            required
          ></textarea>
        </div>

        <div class="form-group">
          <label for="sourceUrl">Source URL (Optional)</label>
          <input
            type="url"
            id="sourceUrl"
            bind:value={sourceUrl}
            placeholder="https://"
          />
        </div>

        <div class="form-actions">
          <a href="/dashboard" class="cancel-button">Cancel</a>
          <button type="submit" class="submit-button" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Note'}
          </button>
        </div>
      </form>
    </div>
  </main>
</div>

<style>
  .submit-page {
    min-height: 100vh;
    background: linear-gradient(180deg, #161616 0%, #1E1E1E 100%);
    color: white;
  }

  .nav {
    position: sticky;
    top: 0;
    z-index: 10;
    background: rgba(22, 22, 22, 0.8);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding: 1rem 2rem;
    backdrop-filter: blur(10px);
  }

  .nav-content {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .logo {
    font-weight: 700;
    font-size: 1.25rem;
    color: white;
    text-decoration: none;
    letter-spacing: -0.03em;
  }

  .divider {
    color: #A5A5A5;
  }

  .page-title {
    font-size: 1rem;
    color: #A5A5A5;
  }

  .balance {
    color: white;
    font-weight: 600;
  }

  .content {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  .form-container {
    background: rgba(22, 22, 22, 0.8);
    padding: 2rem;
    border-radius: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
  }

  h1 {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    background: linear-gradient(90deg, #FFFFFF 0%, #A5A5A5 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.03em;
  }

  .subtitle {
    color: #A5A5A5;
    margin-bottom: 2rem;
  }

  .note-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  label {
    font-weight: 500;
    color: #A5A5A5;
  }

  .type-selector {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .type-option {
    flex: 1;
    min-width: 150px;
  }

  .type-option input[type="radio"] {
    display: none;
  }

  .type-label {
    display: block;
    padding: 0.75rem;
    text-align: center;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .type-option input[type="radio"]:checked + .type-label {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.4);
  }

  input[type="text"],
  input[type="url"],
  textarea {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 0.5rem;
    padding: 0.75rem;
    color: white;
    font-family: inherit;
    font-size: 1rem;
  }

  input[type="text"]:focus,
  input[type="url"]:focus,
  textarea:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.4);
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }

  .submit-button {
    flex: 1;
    background: white;
    color: #161616;
    padding: 0.75rem;
    border: none;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .submit-button:hover {
    opacity: 0.9;
  }

  .submit-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .cancel-button {
    flex: 1;
    background: none;
    color: white;
    padding: 0.75rem;
    border: 1px solid white;
    border-radius: 0.5rem;
    font-weight: 600;
    text-decoration: none;
    text-align: center;
    transition: all 0.2s;
  }

  .cancel-button:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  @media (max-width: 768px) {
    .content {
      padding: 1rem;
    }

    .form-container {
      padding: 1.5rem;
    }

    .type-option {
      min-width: 100%;
    }
  }

  .error-message {
    background: rgba(255, 59, 48, 0.1);
    border: 1px solid rgba(255, 59, 48, 0.2);
    color: #ff3b30;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1.5rem;
  }
</style> 
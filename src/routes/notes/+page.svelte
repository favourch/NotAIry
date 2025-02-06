<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { createWallet } from '$lib/privy';
  import Toast from '$lib/components/Toast.svelte';

  // SVG Icons
  const icons = {
    trophy: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>`,
    bolt: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>`,
    robot: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="16" r="2"></circle><path d="M12 7v4"></path><path d="M8 7h8"></path><path d="M12 3v4"></path></svg>`,
    coins: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"></circle><path d="M18.09 10.37A6 6 0 1 1 10.34 18"></path></svg>`
  };

  let loading = true;
  let notes = [];
  let wallet: any = null;
  let selectedFilter = 'all';
  let searchQuery = '';
  let toast: { message: string; type: 'success' | 'error' | 'info' } | null = null;

  const filters = [
    { id: 'all', label: 'All Notes' },
    { id: 'smart-contract', label: 'Smart Contracts' },
    { id: 'ai-model', label: 'AI Models' },
    { id: 'defi-protocol', label: 'DeFi Protocols' }
  ];

  onMount(async () => {
    try {
      wallet = await createWallet();
      await fetchNotes();
    } catch (error) {
      console.error('Failed to initialize:', error);
    } finally {
      loading = false;
    }
  });

  async function fetchNotes() {
    let query = supabase
      .from('notes')
      .select(`
        *,
        verifications!inner (
          is_verified,
          wallet_id
        )
      `)
      .order('created_at', { ascending: false });

    if (selectedFilter !== 'all') {
      query = query.eq('type', selectedFilter);
    }

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching notes:', error);
      return;
    }

    // Process notes to include user's verification status
    notes = data.map(note => {
      const userVerification = note.verifications?.find(v => v.wallet_id === wallet?.id);
      return {
        ...note,
        userVerified: userVerification?.is_verified,
        verifications: undefined // Remove verifications array from note object
      };
    });
  }

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    toast = { message, type };
  }

  async function handleVerify(noteId: string, isVerified: boolean) {
    if (!wallet?.id) {
      showToast('Please connect your wallet to verify notes', 'error');
      return;
    }

    try {
      // First check if verification already exists
      const { data: existingVerification } = await supabase
        .from('verifications')
        .select('*')
        .eq('note_id', noteId)
        .eq('wallet_id', wallet.id)
        .single();

      if (existingVerification) {
        // If verification exists and status is the same, do nothing
        if (existingVerification.is_verified === isVerified) {
          showToast(
            'You have already ' + (isVerified ? 'verified' : 'disputed') + ' this note',
            'info'
          );
          return;
        }

        // Update existing verification
        const { error: updateError } = await supabase
          .from('verifications')
          .update({ is_verified: isVerified })
          .eq('note_id', noteId)
          .eq('wallet_id', wallet.id);

        if (updateError) throw updateError;
      } else {
        // Create new verification
        const { error: insertError } = await supabase
          .from('verifications')
          .insert({
            note_id: noteId,
            wallet_id: wallet.id,
            is_verified: isVerified
          });

        if (insertError) throw insertError;
      }
      
      showToast(
        'Successfully ' + (isVerified ? 'verified' : 'disputed') + ' the note',
        'success'
      );
      
      // Refresh notes to update consensus
      await fetchNotes();
    } catch (error) {
      console.error('Error verifying note:', error);
      showToast(
        'Failed to ' + (isVerified ? 'verify' : 'dispute') + ' note. Please try again.',
        'error'
      );
    }
  }

  $: {
    if (!loading) {
      fetchNotes();
    }
  }
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="notes-page">
  <nav class="nav">
    <div class="nav-content">
      <div class="left">
        <a href="/" class="logo">NotAIry</a>
        <span class="divider">/</span>
        <span class="page-title">Public Notes</span>
      </div>
      <div class="right">
        <a href="/submit" class="submit-button">+ New Note</a>
      </div>
    </div>
  </nav>

  <main class="content">
    <div class="filters-section">
      <div class="search-bar">
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search notes..."
        />
      </div>
      <div class="type-filters">
        {#each filters as filter}
          <button
            class="filter-button"
            class:active={selectedFilter === filter.id}
            on:click={() => selectedFilter = filter.id}
          >
            {filter.label}
          </button>
        {/each}
      </div>
    </div>

    {#if loading}
      <div class="loading">Loading notes...</div>
    {:else if notes.length === 0}
      <div class="empty-state">
        <p>No notes found. {searchQuery ? 'Try a different search term.' : 'Be the first to submit a note!'}</p>
      </div>
    {:else}
      <div class="notes-grid">
        {#each notes as note}
          <div class="note-card">
            <div class="note-header">
              <div class="note-icon" class:verified={note.status === 'verified'}>
                {#if note.type === 'smart-contract'}
                  {@html icons.bolt}
                {:else if note.type === 'ai-model'}
                  {@html icons.robot}
                {:else}
                  {@html icons.coins}
                {/if}
              </div>
              <div class="note-meta">
                <h3>{note.title}</h3>
                <span class="note-type">{note.type.replace('-', ' ')}</span>
              </div>
            </div>
            
            <p class="note-content">{note.content}</p>
            
            {#if note.source_url}
              <a href={note.source_url} target="_blank" rel="noopener noreferrer" class="source-link">
                View Source
              </a>
            {/if}

            <div class="note-footer">
              <div class="consensus">
                <span class="consensus-score" class:high={note.consensus > 90}>
                  {note.consensus}% consensus
                </span>
              </div>
              
              <div class="verification-actions">
                <button
                  class="verify-button"
                  class:verified={note.userVerified === true}
                  on:click={() => handleVerify(note.id, true)}
                >
                  Verify
                </button>
                <button
                  class="dispute-button"
                  class:disputed={note.userVerified === false}
                  on:click={() => handleVerify(note.id, false)}
                >
                  Dispute
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </main>

  {#if toast}
    <Toast
      message={toast.message}
      type={toast.type}
      onClose={() => toast = null}
    />
  {/if}
</div>

<style>
  :global(body) {
    background: #000000;
    margin: 0;
    padding: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .notes-page {
    min-height: 100vh;
    background: #000000;
    color: white;
  }

  .nav {
    position: sticky;
    top: 0;
    z-index: 10;
    background: rgba(0, 0, 0, 0.8);
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
    font-family: 'Inter', sans-serif;
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

  .submit-button {
    background: white;
    color: #161616;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.2s;
  }

  .submit-button:hover {
    opacity: 0.9;
  }

  .content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .filters-section {
    margin-bottom: 2rem;
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .search-bar {
    flex: 1;
    min-width: 300px;
  }

  .search-bar input {
    width: 100%;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 0.5rem;
    color: white;
    font-size: 1rem;
  }

  .search-bar input:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.4);
  }

  .type-filters {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .filter-button {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Inter', sans-serif;
  }

  .filter-button:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .filter-button.active {
    background: white;
    color: #161616;
  }

  .notes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .note-card {
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 1rem;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .note-header {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
  }

  .note-icon {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .note-icon.verified {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.4);
  }

  .note-meta {
    flex: 1;
  }

  .note-meta h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: white;
    font-family: 'Inter', sans-serif;
    letter-spacing: -0.02em;
  }

  .note-type {
    font-size: 0.875rem;
    color: #A5A5A5;
    text-transform: capitalize;
  }

  .note-content {
    margin: 0;
    color: #A5A5A5;
    font-size: 0.9375rem;
    line-height: 1.5;
  }

  .source-link {
    color: white;
    text-decoration: none;
    font-size: 0.875rem;
    background: rgba(255, 255, 255, 0.1);
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    display: inline-block;
    transition: all 0.2s;
  }

  .source-link:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .note-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
  }

  .consensus-score {
    font-size: 0.875rem;
    color: white;
    background: rgba(255, 255, 255, 0.1);
    padding: 0.25rem 0.5rem;
    border-radius: 1rem;
  }

  .consensus-score.high {
    background: rgba(255, 255, 255, 0.2);
  }

  .verification-actions {
    display: flex;
    gap: 0.5rem;
  }

  .verify-button,
  .dispute-button {
    font-size: 0.875rem;
    padding: 0.25rem 0.75rem;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .verify-button {
    background: rgba(52, 199, 89, 0.1);
    border: 1px solid rgba(52, 199, 89, 0.2);
    color: #34c759;
  }

  .verify-button:hover {
    background: rgba(52, 199, 89, 0.2);
  }

  .verify-button.verified {
    background: #34c759;
    color: white;
  }

  .dispute-button {
    background: rgba(255, 59, 48, 0.1);
    border: 1px solid rgba(255, 59, 48, 0.2);
    color: #ff3b30;
  }

  .dispute-button:hover {
    background: rgba(255, 59, 48, 0.2);
  }

  .dispute-button.disputed {
    background: #ff3b30;
    color: white;
  }

  .loading,
  .empty-state {
    text-align: center;
    padding: 4rem;
    color: #A5A5A5;
  }

  @media (max-width: 768px) {
    .content {
      padding: 1rem;
    }

    .notes-grid {
      grid-template-columns: 1fr;
    }

    .search-bar {
      min-width: 100%;
    }
  }
</style> 
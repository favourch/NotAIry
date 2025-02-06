<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { createWallet, getWalletBalance } from '$lib/privy';

  // SVG Icons
  const icons = {
    trophy: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>`,
    bolt: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>`,
    robot: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="16" r="2"></circle><path d="M12 7v4"></path><path d="M8 7h8"></path><path d="M12 3v4"></path></svg>`,
    coins: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"></circle><path d="M18.09 10.37A6 6 0 1 1 10.34 18"></path></svg>`
  };

  let loading = true;
  let wallet: any = null;
  let balance = '0';
  let stats = {
    notesSubmitted: 0,
    verificationScore: '0%',
    pendingVerifications: 0,
    reputationScore: 0
  };

  let recentNotes = [
    {
      type: 'smart-contract',
      title: 'Gas Optimization Warning',
      content: 'Potential gas optimization in deposit function - using calldata instead of memory could save ~15%',
      timestamp: '2 hours ago',
      status: 'verified',
      consensus: '92%'
    },
    {
      type: 'ai-model',
      title: 'Model Limitation Note',
      content: 'GPT-4 showing inconsistent results with complex mathematical proofs',
      timestamp: '5 hours ago',
      status: 'pending',
      consensus: '78%'
    },
    {
      type: 'defi-protocol',
      title: 'Security Advisory',
      content: 'New upgrade includes unaudited code in core lending function',
      timestamp: '1 day ago',
      status: 'verified',
      consensus: '95%'
    }
  ];

  onMount(async () => {
    try {
      // Create or get wallet
      wallet = await createWallet();
      if (wallet?.id) {
        balance = await getWalletBalance(wallet.id);
      }

      // Fetch stats
      stats = {
        notesSubmitted: 156,
        verificationScore: '94.5%',
        pendingVerifications: 3,
        reputationScore: 850
      };
    } catch (error) {
      console.error('Failed to initialize:', error);
    } finally {
      loading = false;
    }
  });

  async function handleConnect() {
    try {
      wallet = await createWallet();
      if (wallet?.id) {
        balance = await getWalletBalance(wallet.id);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  }
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="dashboard">
  <nav class="dashboard-nav">
    <div class="nav-content">
      <div class="left">
        <div class="logo">NotAIry</div>
        <span class="divider">/</span>
        <span class="page-title">Verification Dashboard</span>
      </div>
      <div class="right">
        {#if !wallet}
          <button class="connect-button" on:click={handleConnect}>
            Connect Wallet
          </button>
        {:else}
          <span class="balance">USDC {balance}</span>
        {/if}
        <span class="reputation-score">
          {@html icons.trophy}
          <span>{stats.reputationScore} Rep</span>
        </span>
        <a href="/submit" class="submit-button">+ New Note</a>
        <a href="/" class="nav-link">Home</a>
      </div>
    </div>
  </nav>

  <main class="dashboard-content">
    {#if loading}
      <div class="loading">Loading your verification data...</div>
    {:else}
      <div class="welcome-section">
        <h1>Verification Dashboard</h1>
        <p class="subtitle">Track your contributions to Web3 & AI transparency</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <h3>Notes Submitted</h3>
          <p class="stat-value">{stats.notesSubmitted}</p>
        </div>
        <div class="stat-card">
          <h3>Verification Score</h3>
          <p class="stat-value">{stats.verificationScore}</p>
        </div>
        <div class="stat-card">
          <h3>Pending Verifications</h3>
          <p class="stat-value">{stats.pendingVerifications}</p>
        </div>
        <div class="stat-card highlight">
          <h3>Reputation Score</h3>
          <p class="stat-value">{stats.reputationScore}</p>
        </div>
      </div>

      <div class="recent-activity">
        <h2>Recent Notes</h2>
        <div class="activity-list">
          {#each recentNotes as note}
            <div class="activity-card">
              <div class="activity-icon" class:verified={note.status === 'verified'}>
                {#if note.type === 'smart-contract'}
                  {@html icons.bolt}
                {:else if note.type === 'ai-model'}
                  {@html icons.robot}
                {:else}
                  {@html icons.coins}
                {/if}
              </div>
              <div class="activity-details">
                <div class="note-header">
                  <h4>{note.title}</h4>
                  <span class="consensus" class:high={parseInt(note.consensus) > 90}>
                    {note.consensus} consensus
                  </span>
                </div>
                <p>{note.content}</p>
                <div class="note-footer">
                  <span class="activity-time">{note.timestamp}</span>
                  <span class="status" class:verified={note.status === 'verified'}>
                    {note.status}
                  </span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </main>
</div>

<style>
  :global(body) {
    background: #161616;
    margin: 0;
    padding: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .dashboard {
    min-height: 100vh;
    background: linear-gradient(180deg, #161616 0%, #1E1E1E 100%);
    color: white;
    letter-spacing: -0.02em;
  }

  .dashboard-nav {
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
    letter-spacing: -0.03em;
  }

  .divider {
    color: #A5A5A5;
  }

  .page-title {
    font-size: 1rem;
    color: #A5A5A5;
  }

  .right {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .connect-button {
    background: none;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-weight: 600;
    border: 1px solid white;
    cursor: pointer;
    transition: all 0.2s;
  }

  .connect-button:hover {
    background: white;
    color: #161616;
  }

  .balance {
    color: white;
    font-weight: 600;
  }

  .reputation-score {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 1rem;
    font-weight: 600;
    border: 1px solid rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    letter-spacing: -0.01em;
  }

  .submit-button {
    background: none;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.2s;
    border: 1px solid white;
    letter-spacing: -0.01em;
  }

  .submit-button:hover {
    background: white;
    color: #161616;
  }

  .nav-link {
    color: white;
    text-decoration: none;
    font-size: 0.9375rem;
    opacity: 0.8;
    transition: opacity 0.2s;
  }

  .nav-link:hover {
    opacity: 1;
  }

  .dashboard-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .welcome-section {
    margin-bottom: 2rem;
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
    font-size: 1.125rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    background: rgba(22, 22, 22, 0.8);
    padding: 1.5rem;
    border-radius: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
  }

  .stat-card h3 {
    color: #A5A5A5;
    font-size: 1rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
    letter-spacing: -0.01em;
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    margin: 0;
    color: white;
    letter-spacing: -0.03em;
  }

  .recent-activity {
    background: rgba(22, 22, 22, 0.8);
    padding: 1.5rem;
    border-radius: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
  }

  h2 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: white;
    letter-spacing: -0.02em;
  }

  .activity-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .activity-card {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: rgba(22, 22, 22, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
    backdrop-filter: blur(10px);
  }

  .activity-icon {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.2s;
  }

  .activity-icon.verified {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
  }

  .activity-details h4 {
    margin: 0 0 0.25rem;
    font-size: 1rem;
    font-weight: 600;
    color: white;
    letter-spacing: -0.01em;
  }

  .activity-details p {
    margin: 0 0 0.25rem;
    color: #A5A5A5;
    font-size: 0.9375rem;
  }

  .activity-time {
    color: #A5A5A5;
    font-size: 0.875rem;
  }

  .consensus {
    font-size: 0.875rem;
    color: white;
    background: rgba(255, 255, 255, 0.1);
    padding: 0.25rem 0.5rem;
    border-radius: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .consensus.high {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
  }

  .status {
    font-size: 0.875rem;
    color: white;
    background: rgba(255, 255, 255, 0.1);
    padding: 0.25rem 0.5rem;
    border-radius: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .status.verified {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
  }

  .highlight {
    border: 2px solid rgba(255, 255, 255, 0.3);
  }

  .loading {
    text-align: center;
    padding: 2rem;
    color: #A5A5A5;
  }

  @media (max-width: 768px) {
    .dashboard-content {
      padding: 1rem;
    }

    .stats-grid {
      grid-template-columns: 1fr;
    }

    h1 {
      font-size: 1.5rem;
    }
  }
</style> 
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { createWallet, getWalletBalance } from '$lib/privy';
  import Toast from '$lib/components/Toast.svelte';
  import { supabase } from '$lib/supabase';
  import { 
    deployVerificationAgent, 
    getAgentMetrics, 
    updateAgentConfig,
    CONSENSUS_API,
    CODER_API,
    getGaiaHeaders 
  } from '$lib/gaia';

  let toast: { message: string; type: 'success' | 'error' | 'info' } | null = null;
  
  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    toast = { message, type };
    setTimeout(() => {
      toast = null;
    }, 3000);
  }

  function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
  }

  const icons = {
    pen: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`,
    heart: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
    comment: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
    logout: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`,
    profile: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
    menu: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`,
    copy: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`
  };

  interface Note {
    id: string;
    type: 'smart-contract' | 'ai-model' | 'defi-protocol';
    title: string;
    content: string;
    timestamp: string;
    status: 'pending' | 'verified' | 'rejected';
    consensus: string;
  }

  let loading = true;
  let loadingNotes = false;
  let loadingStats = false;
  let wallet: any = null;
  let recentNotes: Note[] = [];
  let stats = {
    notesSubmitted: 0,
    verificationScore: '0%',
    pendingVerifications: 0,
    reputationScore: 0
  };

  let agentStatus = null;
  let agentMetrics = null;
  let isDeploying = false;
  let configuring = false;
  let configModal = false;
  let showAgentInfo = false;
  let configSettings = {
    consensus_threshold: 75,
    min_verifications: 3,
    timeout: {
      hours: 48,
      minutes: 0
    },
    reward_points: 10
  };

  let user: any = null;
  let userInitials = '';
  let showProfileMenu = false;

  let walletBalance = '0.00';

  async function fetchRecentNotes() {
    loadingNotes = true;
    try {
      const { data: stories, error } = await supabase
        .from('stories')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return (stories || []).map((story) => ({
        id: story.id,
        title: story.title,
        content: story.content,
        status: story.status,
        timestamp: formatRelativeTime(story.created_at),
        type: 'story', // Default type
        likes: story.likes,
        comments: story.comments
      }));
    } catch (err) {
      console.error('Failed to fetch stories:', err);
      showToast('Failed to load stories', 'error');
      return [];
    } finally {
      loadingNotes = false;
    }
  }

  async function fetchUserStats() {
    try {
      // First ensure the profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: user.id, email: user.email })
        .select()
        .single();

      if (profileError) throw profileError;

      // Then get the stats
      const { data: stats, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('id', user.id)
        .single();

      if (statsError) {
        // If no stats found, return defaults
        return {
          notesSubmitted: 0,
          verificationScore: '0',
          pendingVerifications: 0,
          reputationScore: 0
        };
      }

      return {
        notesSubmitted: stats.stories_published || 0,
        verificationScore: `${stats.total_likes || 0}`,
        pendingVerifications: stats.drafts_count || 0,
        reputationScore: stats.total_comments || 0
      };
    } catch (err) {
      console.error('Failed to fetch user stats:', err);
      return {
        notesSubmitted: 0,
        verificationScore: '0',
        pendingVerifications: 0,
        reputationScore: 0
      };
    }
  }

  async function fetchWalletBalance() {
    if (!wallet?.address) return;
    try {
      const balance = await getWalletBalance(wallet);
      walletBalance = balance;
    } catch (err) {
      console.error('Failed to fetch wallet balance:', err);
      walletBalance = '0.00';
    }
  }

  async function handleWalletCreation() {
    try {
      const newWallet = await createWallet();
      if (newWallet?.id) {
        await supabase
          .from('profiles')
          .update({ 
            wallet_address: newWallet.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
        wallet = newWallet;
        // Fetch balance after wallet creation
        await fetchWalletBalance();
      }
    } catch (err) {
      console.error('Failed to create wallet:', err);
      showToast('Failed to create wallet', 'error');
    }
  }

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      goto('/');
      return;
    }

    user = session.user;
    // Get initials from email
    userInitials = user.email
      ?.split('@')[0]
      .split('.')
      .map((n: string) => n[0].toUpperCase())
      .join('') || '?';

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_address')
        .eq('id', session.user.id)
        .single();

      if (profile?.wallet_address) {
        wallet = { address: profile.wallet_address };
      } else {
        await handleWalletCreation();
      }

      recentNotes = await fetchRecentNotes();
      stats = await fetchUserStats();

      if (wallet?.address) {
        await fetchWalletBalance();
      }
    } catch (err) {
      console.error('Error initializing dashboard:', err);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      loading = false;
    }
  });

  async function handleSignOut() {
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      goto('/');
    } catch (err) {
      console.error('Failed to sign out:', err);
      showToast('Failed to sign out', 'error');
    }
  }

  async function fetchAgentStatus() {
    // ... your existing code ...
  }

  // Add function to copy wallet address
  async function copyAddress(address: string) {
    try {
      await navigator.clipboard.writeText(address);
      showToast('Address copied to clipboard', 'success');
    } catch (err) {
      console.error('Failed to copy address:', err);
      showToast('Failed to copy address', 'error');
    }
  }
</script>

<nav class="navbar">
  <div class="nav-content">
    <div class="nav-left">
      <a href="/dashboard" class="logo">NotAIry</a>
      <div class="nav-links">
        <a href="/dashboard" class="nav-link active">
          {@html icons.home}
          Dashboard
        </a>
        <a href="/stories" class="nav-link">
          {@html icons.pen}
          Stories
        </a>
      </div>
    </div>
    <div class="nav-right">
      {#if user}
        <div class="profile-menu" class:active={showProfileMenu}>
          <button 
            class="profile-button" 
            on:click={() => showProfileMenu = !showProfileMenu}
            title="Profile Menu"
          >
            <div class="user-avatar">
              {userInitials}
            </div>
          </button>
          {#if showProfileMenu}
            <div class="dropdown-menu">
              <div class="menu-header">
                <span class="user-email">{user.email}</span>
                <div class="wallet-section">
                  <span class="wallet-label">Privy Wallet</span>
                  {#if wallet}
                    <div class="wallet-info">
                      <div class="wallet-details">
                        <span class="wallet-status connected">Connected to {wallet.network}</span>
                        <div class="balance">
                          <span class="balance-label">Balance:</span>
                          <span class="balance-amount">{walletBalance} ETH</span>
                        </div>
                      </div>
                      <div class="address-container">
                        <span class="wallet-address" title={wallet.address}>
                          {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                        </span>
                        <button 
                          class="copy-button" 
                          on:click={() => copyAddress(wallet.address)}
                          title="Copy full address"
                        >
                          {@html icons.copy}
                          <span class="tooltip">Copy full address</span>
                        </button>
                        <a 
                          href={`${CURRENT_NETWORK.explorer}/address/${wallet.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          class="explorer-link"
                          title="View on Explorer"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                          </svg>
                        </a>
                      </div>
                    </div>
                  {:else}
                    <div class="wallet-info">
                      <span class="wallet-status">Not Connected</span>
                      <button class="connect-wallet" on:click={handleWalletCreation}>
                        Connect Wallet
                      </button>
                    </div>
                  {/if}
                </div>
              </div>
              <div class="menu-items">
                <a href="/profile" class="menu-item">
                  {@html icons.profile}
                  Profile Settings
                </a>
                <button class="menu-item" on:click={handleSignOut}>
                  {@html icons.logout}
                  Sign Out
                </button>
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</nav>

<div class="dashboard">
  {#if toast}
    <Toast message={toast.message} type={toast.type} />
  {/if}

  <header>
    <div class="left">
      <div class="header-content">
        <h1>Dashboard</h1>
        <p class="subtitle">Welcome back! Here's an overview of your startup's story.</p>
      </div>
      <div class="stats">
        <div class="stat-card">
          <h3>Stories Published</h3>
          <p>{stats.notesSubmitted}</p>
        </div>
        <div class="stat-card">
          <h3>Total Reads</h3>
          <p>{stats.verificationScore}</p>
        </div>
        <div class="stat-card">
          <h3>Community Score</h3>
          <p>{stats.reputationScore}</p>
        </div>
        <div class="stat-card">
          <h3>Pending Stories</h3>
          <p>{stats.pendingVerifications}</p>
        </div>
      </div>
    </div>
  </header>

  <main>
    <section class="stories-section">
      <div class="section-header">
        <h2>Your Stories</h2>
        <div class="view-options">
          <button class="view-all">View All</button>
        </div>
      </div>
      {#if loadingNotes}
        <div class="loading">
          <div class="loader"></div>
          <span>Loading your stories...</span>
        </div>
      {:else if recentNotes.length === 0}
        <div class="empty">
          <div class="empty-content">
            <h3>Start Your Story</h3>
            <p>Document your startup's journey and inspire others in the community.</p>
            <a href="/write" class="write-button">
              {@html icons.pen}
              Write Your First Story
            </a>
          </div>
        </div>
      {:else}
        <div class="stories-grid">
          {#each recentNotes as note}
            <article class="story-card">
              <div class="story-header">
                <h3>{note.title}</h3>
                <span class="status {note.status}">{note.status}</span>
              </div>
              <p class="preview">{note.content.slice(0, 200)}...</p>
              <div class="meta">
                <span class="timestamp">{note.timestamp}</span>
                <div class="engagement">
                  <span class="likes" title="Likes">
                    {@html icons.heart} {Math.floor(Math.random() * 100)}
                  </span>
                  <span class="comments" title="Comments">
                    {@html icons.comment} {Math.floor(Math.random() * 20)}
                  </span>
                </div>
              </div>
              <div class="tags">
                {#each note.type.split('-') as tag}
                  <span class="tag">{tag}</span>
                {/each}
              </div>
            </article>
          {/each}
        </div>
      {/if}
    </section>
  </main>
</div>

<style>
  /* Global styles match */
  :global(body) {
    background: #161616;
    margin: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .dashboard {
    padding: 104px 40px 80px;
    max-width: 1400px;
    margin: 0 auto;
    min-height: 100vh;
  }

  header {
    margin-bottom: 60px;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 40px;
  }

  h1 {
    font-size: 42px;
    line-height: 1.2;
    font-weight: 700;
    margin: 0;
    letter-spacing: -0.02em;
    background: linear-gradient(90deg, #FFFFFF 0%, #A5A5A5 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .subtitle {
    font-size: 18px;
    line-height: 1.5;
    color: #A5A5A5;
    margin: 8px 0 0;
    max-width: 480px;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
  }

  .wallet-address {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 8px 16px;
    border-radius: 12px;
    color: #A5A5A5;
    font-size: 14px;
    font-family: 'SF Mono', monospace;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
  }

  .stat-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 24px;
    border-radius: 16px;
    transition: all 0.3s ease;
  }

  .stat-card:hover {
    background: rgba(255, 255, 255, 0.05);
    transform: translateY(-2px);
  }

  .stat-card h3 {
    color: #A5A5A5;
    font-size: 14px;
    font-weight: 500;
    margin: 0 0 8px;
    letter-spacing: 0.02em;
  }

  .stat-card p {
    font-size: 36px;
    font-weight: 700;
    margin: 0;
    background: linear-gradient(90deg, #FFFFFF 0%, #A5A5A5 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
  }

  .view-all {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #A5A5A5;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .view-all:hover {
    border-color: #FFFFFF;
    color: #FFFFFF;
  }

  .stories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 24px;
  }

  .story-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 24px;
    border-radius: 16px;
    transition: all 0.3s ease;
  }

  .story-card:hover {
    background: rgba(255, 255, 255, 0.05);
    transform: translateY(-2px);
  }

  .story-header h3 {
    font-size: 24px;
    font-weight: 600;
    color: white;
    margin: 0 0 16px;
  }

  .preview {
    color: #A5A5A5;
    font-size: 16px;
    line-height: 1.5;
    margin: 0 0 24px;
  }

  .meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #A5A5A5;
    font-size: 14px;
  }

  .engagement {
    display: flex;
    gap: 16px;
  }

  .tags {
    display: flex;
    gap: 8px;
    margin-top: 24px;
  }

  .tag {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #A5A5A5;
    padding: 4px 12px;
    border-radius: 16px;
    font-size: 12px;
    text-transform: capitalize;
  }

  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
  }

  .loader {
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top: 4px solid #FFFFFF;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .empty {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
  }

  .empty-content {
    text-align: center;
  }

  .write-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: white;
    color: #161616;
    padding: 16px 32px;
    border-radius: 32px;
    font-size: 16px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s;
    cursor: pointer;
  }

  .write-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .logout-button {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 8px 16px;
    border-radius: 32px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .logout-button:hover {
    border-color: white;
  }

  @media (max-width: 1024px) {
    h1 {
      font-size: 48px;
    }

    .stories-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    h1 {
      font-size: 36px;
    }

    .subtitle {
      font-size: 18px;
    }

    .stats {
      grid-template-columns: 1fr;
    }
  }

  .navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 64px;
    background: rgba(22, 22, 22, 0.8);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    z-index: 100;
  }

  .nav-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 40px;
    height: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .nav-left {
    display: flex;
    align-items: center;
    gap: 48px;
  }

  .logo {
    color: white;
    font-size: 20px;
    font-weight: 600;
    text-decoration: none;
    letter-spacing: -0.02em;
  }

  .nav-links {
    display: flex;
    gap: 24px;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #A5A5A5;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    padding: 8px 12px;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .nav-link:hover {
    color: white;
    background: rgba(255, 255, 255, 0.05);
  }

  .nav-link.active {
    color: white;
    background: rgba(255, 255, 255, 0.05);
  }

  .profile-menu {
    position: relative;
  }

  .profile-button {
    background: transparent;
    border: none;
    padding: 2px;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .profile-button:hover {
    transform: scale(1.05);
  }

  .dropdown-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    width: 280px;
    background: rgba(32, 32, 32, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 8px;
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .menu-header {
    padding: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .user-email {
    display: block;
    color: white;
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 12px;
  }

  .wallet-label {
    display: block;
    color: #A5A5A5;
    font-size: 12px;
    margin-bottom: 4px;
  }

  .wallet-address {
    display: block;
    color: #A5A5A5;
    font-size: 13px;
    font-family: 'SF Mono', monospace;
  }

  .menu-items {
    padding: 8px;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 12px;
    background: transparent;
    border: none;
    color: #A5A5A5;
    font-size: 14px;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s;
    text-decoration: none;
  }

  .menu-item:hover {
    color: white;
    background: rgba(255, 255, 255, 0.05);
  }

  .user-avatar {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #a5b4fc 0%, #818cf8 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 14px;
    letter-spacing: -0.02em;
  }

  @media (max-width: 768px) {
    .nav-links {
      display: none;
    }
    
    .nav-content {
      padding: 0 20px;
    }
  }

  .wallet-section {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .wallet-info {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 8px;
  }

  .wallet-status {
    font-size: 12px;
    color: #A5A5A5;
  }

  .wallet-status.connected {
    color: #10B981;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .wallet-status.connected::before {
    content: "";
    display: inline-block;
    width: 6px;
    height: 6px;
    background: #10B981;
    border-radius: 50%;
  }

  .connect-wallet {
    background: transparent;
    border: 1px solid #a5b4fc;
    color: #a5b4fc;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .connect-wallet:hover {
    background: rgba(165, 180, 252, 0.1);
  }

  .wallet-address {
    font-family: 'SF Mono', monospace;
    font-size: 12px;
    color: #A5A5A5;
  }

  .address-container {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .copy-button {
    position: relative;
    background: transparent;
    border: none;
    color: #A5A5A5;
    padding: 4px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
  }

  .copy-button:hover {
    color: white;
    background: rgba(255, 255, 255, 0.05);
  }

  .copy-button:hover .tooltip {
    opacity: 1;
    transform: translateY(0);
  }

  .tooltip {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%) translateY(4px);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: all 0.2s;
  }

  .tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 4px;
    border-style: solid;
    border-color: rgba(0, 0, 0, 0.8) transparent transparent transparent;
  }

  .wallet-address {
    font-family: 'SF Mono', monospace;
    font-size: 12px;
    color: #A5A5A5;
    cursor: default;
  }

  .wallet-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .balance {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
  }

  .balance-label {
    color: #A5A5A5;
    font-size: 12px;
  }

  .balance-amount {
    color: #10B981;
    font-size: 14px;
    font-weight: 500;
    font-family: 'SF Mono', monospace;
  }

  .explorer-link {
    color: #A5A5A5;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .explorer-link:hover {
    color: white;
    background: rgba(255, 255, 255, 0.05);
  }

  .wallet-status.connected {
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
</style> 
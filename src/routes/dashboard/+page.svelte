<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { getWalletBalance } from '$lib/privy';
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
  import { connectMetaMask, getMetaMaskBalance } from '$lib/metamask';
  import { browser } from '$app/environment';
  import type { BaseNameProfile } from '$lib/basename';
  import { getBaseNameProfile } from '$lib/basename';

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
    copy: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
    link: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`,
  };

  interface Note {
    id: string;
    type: 'smart-contract' | 'ai-model' | 'defi-protocol';
    title: string;
    content: string;
    timestamp: string;
    status: 'pending' | 'verified' | 'rejected';
    consensus: string;
    wallet_address?: string;
    likes?: number;
    comments?: number;
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
  let walletStatus = '';

  let metamaskAddress: string | null = null;
  let metamaskBalance = '0.0000';
  let hasMetaMask = false;
  let testAddress = '';

  let baseName: BaseNameProfile | null = null;
  let baseNameLoading = false;

  // Update test addresses
  const TEST_ADDRESSES = {
    vitalik: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // vitalik.eth
    cb: '0xa4b8c69f0d741b1baa779ab157ec671c99604e6f', // coinbase.eth
  };

  // Add pagination variables
  let currentPage = 1;
  let pageSize = 6;
  let totalStories = 0;
  let totalPages = 0;

  onMount(() => {
    // Check for MetaMask availability
    hasMetaMask = browser && typeof window !== 'undefined' && window.ethereum !== undefined;
  });

  onMount(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        goto('/');
        return;
      }

      user = session.user;
      userInitials = user.email
        ?.split('@')[0]
        .split('.')
        .map((n: string) => n[0].toUpperCase())
        .join('') || '?';

      // Create profile if it doesn't exist
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          email: user.email,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
        .select('wallet_address, wallet_status')
        .single();

      if (profileError) throw profileError;

      walletStatus = profile?.wallet_status || '';

      if (profile?.wallet_address) {
        wallet = { 
          address: profile.wallet_address,
          network: 'Arbitrum Sepolia'
        };
        await fetchWalletBalance();
      } else if (walletStatus === 'creating') {
        // Subscribe to profile changes
        const subscription = supabase
          .channel('profile-changes')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${user.id}`
            },
            async (payload) => {
              const updatedProfile = payload.new;
              if (updatedProfile.wallet_status === 'active' && updatedProfile.wallet_address) {
                wallet = {
                  address: updatedProfile.wallet_address,
                  network: 'Arbitrum Sepolia'
                };
                await fetchWalletBalance();
                showToast('Wallet created successfully', 'success');
                subscription.unsubscribe();
              } else if (updatedProfile.wallet_status === 'failed') {
                walletStatus = 'failed';
                showToast('Failed to create wallet', 'error');
                subscription.unsubscribe();
              }
            }
          )
          .subscribe();

        // Set timeout to prevent infinite waiting
        setTimeout(() => {
          if (walletStatus === 'creating') {
            walletStatus = 'failed';
            showToast('Wallet creation timed out', 'error');
            subscription.unsubscribe();
          }
        }, 30000);
      }

      // Fetch initial data
      recentNotes = await fetchRecentNotes();
      stats = await fetchUserStats();
    } catch (err) {
      console.error('Failed to initialize dashboard:', err);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      loading = false;
    }

    if (wallet?.address) {
      await fetchBaseName();
    }

    // Restore MetaMask connection if previously connected
    if (hasMetaMask) {
      const savedAddress = localStorage.getItem('metamask_address');
      if (savedAddress) {
        try {
          metamaskAddress = savedAddress;
          metamaskBalance = await getMetaMaskBalance(savedAddress);
        } catch (err) {
          console.error('Failed to restore MetaMask connection:', err);
          // If there's an error, clear the saved address
          localStorage.removeItem('metamask_address');
          metamaskAddress = null;
          metamaskBalance = '0.0000';
        }
      }
    }
  });

  // Update fetchRecentNotes to handle pagination
  async function fetchRecentNotes() {
    loadingNotes = true;
    try {
      // First get total count
      let countQuery = supabase
        .from('stories')
        .select('id', { count: 'exact' });

      // If MetaMask is connected, include its stories too
      if (metamaskAddress) {
        countQuery = countQuery.or(`wallet_address.eq.${metamaskAddress},author_id.eq.${user.id}`);
      } else {
        countQuery = countQuery.eq('author_id', user.id);
      }

      const { count, error: countError } = await countQuery;
      
      if (countError) throw countError;
      
      totalStories = count || 0;
      totalPages = Math.ceil(totalStories / pageSize);

      // Then get paginated data
      let query = supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      // If MetaMask is connected, include its stories too
      if (metamaskAddress) {
        query = query.or(`wallet_address.eq.${metamaskAddress},author_id.eq.${user.id}`);
      } else {
        query = query.eq('author_id', user.id);
      }

      const { data: stories, error } = await query;

      if (error) throw error;

      return (stories || []).map((story) => ({
        id: story.id,
        title: story.title,
        content: story.content,
        status: story.status,
        timestamp: formatRelativeTime(story.created_at),
        type: story.story_type,
        wallet_address: story.wallet_address,
        likes: story.likes || 0,
        comments: story.comments || 0
      }));
    } catch (err) {
      console.error('Failed to fetch stories:', err);
      showToast('Failed to load stories', 'error');
      return [];
    } finally {
      loadingNotes = false;
    }
  }

  // Add pagination controls
  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
      loadingNotes = true;
      fetchRecentNotes().then(notes => {
        recentNotes = notes;
      });
    }
  }

  async function fetchUserStats() {
    try {
      // First ensure the profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          email: user.email,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Then get the stats
      const { data: stats, error: statsError } = await supabase
        .from('user_stats')
        .select('stories_published, total_likes, total_comments, drafts_count')
        .eq('id', user.id)
        .maybeSingle(); // Use maybeSingle instead of single

      if (statsError) {
        console.error('Stats error:', statsError);
      return {
          notesSubmitted: 0,
          verificationScore: '0',
          pendingVerifications: 0,
          reputationScore: 0
        };
      }

      return {
        notesSubmitted: stats?.stories_published || 0,
        verificationScore: `${stats?.total_likes || 0}`,
        pendingVerifications: stats?.drafts_count || 0,
        reputationScore: stats?.total_comments || 0
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

  async function fetchBaseName() {
    if (!wallet?.address) return;
    
    baseNameLoading = true;
    try {
      baseName = await getBaseNameProfile(wallet.address);
    } catch (err) {
      console.error('Failed to fetch Base name:', err);
      showToast('Failed to load Base name profile', 'error');
    } finally {
      baseNameLoading = false;
    }
  }

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

  async function handleCreateWallet() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      // Update status to creating
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          wallet_status: 'creating',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;
      walletStatus = 'creating';

      // Make sure we're using the latest session token
      const response = await fetch('/api/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create wallet');
      }

      wallet = {
        address: data.address,
        network: data.network
      };

      await fetchWalletBalance();
      showToast('Wallet created successfully', 'success');
    } catch (err) {
      console.error('Failed to create wallet:', err);
      walletStatus = 'failed';
      showToast('Failed to create wallet', 'error');

      // Update profile status on failure
      if (user?.id) {
        await supabase
          .from('profiles')
          .update({ 
            wallet_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
      }
    }
  }

  async function handleConnectMetaMask() {
    try {
      const address = await connectMetaMask();
      metamaskAddress = address;
      metamaskBalance = await getMetaMaskBalance(address);
      // Save to localStorage
      localStorage.setItem('metamask_address', address);
      showToast('MetaMask connected successfully', 'success');
    } catch (err: any) {
      console.error('Failed to connect MetaMask:', err);
      showToast(err.message || 'Failed to connect MetaMask', 'error');
    }
  }

  async function handleDisconnectMetaMask() {
    try {
      metamaskAddress = null;
      metamaskBalance = '0.0000';
      // Remove from localStorage
      localStorage.removeItem('metamask_address');
      showToast('MetaMask disconnected successfully', 'success');
    } catch (err) {
      console.error('Failed to disconnect MetaMask:', err);
      showToast('Failed to disconnect MetaMask', 'error');
    }
  }

  async function testBaseName(address: string) {
    baseNameLoading = true;
    try {
      baseName = await getBaseNameProfile(address);
      if (baseName) {
        showToast('Base name profile loaded', 'success');
      } else {
        showToast('No Base name found for this address', 'info');
      }
    } catch (err) {
      console.error('Failed to fetch Base name:', err);
      showToast('Failed to load Base name profile', 'error');
    } finally {
      baseNameLoading = false;
    }
  }

  // Update the story card to show wallet address if present
  $: formattedAddress = (address: string) => 
    address ? `${address.slice(0,6)}...${address.slice(-4)}` : '';
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
                
                <!-- Privy Wallet Card -->
                <div class="wallet-card privy">
                  <h3>Privy Wallet</h3>
                  {#if wallet}
                    <div class="wallet-status connected">
                      <div class="wallet-details">
                        <div class="address-container">
                          <span class="wallet-address">{wallet.address.slice(0,6)}...{wallet.address.slice(-4)}</span>
                          <button 
                            class="copy-button" 
                            on:click={() => copyAddress(wallet.address)}
                            aria-label="Copy wallet address"
                          >
                            {@html icons.copy}
                            <span class="tooltip">Copy address</span>
                          </button>
                          <a 
                            href={`https://sepolia.arbiscan.io/address/${wallet.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="explorer-link"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                              <polyline points="15 3 21 3 21 9"></polyline>
                              <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                          </a>
                        </div>
                        <div class="balance">
                          <span class="balance-label">Balance:</span>
                          <span class="balance-amount">{walletBalance} ETH</span>
                        </div>
                      </div>
                    </div>
                  {:else}
                    <div class="wallet-status">
                      {#if walletStatus === 'creating'}
                        <div class="loading">
                          <div class="spinner"></div>
                          Creating your Arbitrum Sepolia wallet...
                        </div>
                      {:else if walletStatus === 'failed'}
                        <div class="error">
                          Failed to create wallet. 
                          <button class="retry-button" on:click={handleCreateWallet}>
                            Try Again
                          </button>
                        </div>
                      {:else}
                        <div class="no-wallet">
                          <p>No wallet connected</p>
                          <button class="create-wallet-button" on:click={handleCreateWallet}>
                            Create Wallet
                          </button>
                        </div>
                      {/if}
                    </div>
                  {/if}
                </div>

                <!-- MetaMask Wallet Card -->
                <div class="wallet-card metamask">
                  <h3>MetaMask</h3>
                  {#if !hasMetaMask}
                    <div class="no-metamask">
                      <p>MetaMask not installed</p>
                      <a 
                        href="https://metamask.io/download/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        class="install-metamask-button"
                      >
                        Install MetaMask
                      </a>
                    </div>
                  {:else if metamaskAddress}
                    <div class="wallet-status connected">
                      <div class="wallet-details">
                        <div class="address-container">
                          <span class="wallet-address">{metamaskAddress.slice(0,6)}...{metamaskAddress.slice(-4)}</span>
                          <button 
                            class="copy-button" 
                            on:click={() => copyAddress(metamaskAddress)}
                            aria-label="Copy wallet address"
                          >
                            {@html icons.copy}
                            <span class="tooltip">Copy address</span>
                          </button>
                          <a 
                            href={`https://sepolia.etherscan.io/address/${metamaskAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="explorer-link"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                              <polyline points="15 3 21 3 21 9"></polyline>
                              <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                          </a>
                        </div>
                        <div class="balance">
                          <span class="balance-label">Balance:</span>
                          <span class="balance-amount">{metamaskBalance} ETH</span>
                        </div>
                        <button class="disconnect-button" on:click={handleDisconnectMetaMask}>
                          Disconnect
                        </button>
                      </div>
                    </div>
                  {:else}
                    <div class="connect-metamask">
                      <p>Connect to Sepolia testnet</p>
                      <button 
                        class="connect-metamask-button" 
                        on:click={handleConnectMetaMask}
                      >
                        <img 
                          src="https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg" 
                          alt="MetaMask" 
                          class="metamask-icon"
                        />
                        Connect MetaMask
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
    <div class="right">
      <button class="write-button" on:click={() => goto('/write')}>
        {@html icons.pen}
        Write a Story
      </button>
    </div>
  </header>

  <main>
    <section class="stories-section">
      <div class="section-header">
        <h2 class="section-title">Your Stories</h2>
        <div class="view-options">
          <button class="action-button">View All</button>
        </div>
      </div>
      {#if loadingNotes}
        <div class="loading">
          <div class="spinner"></div>
          <span>Loading your stories...</span>
        </div>
      {:else if recentNotes.length === 0}
        <div class="empty">
          <div class="empty-content">
            <h3>Start Your Story</h3>
            <p>Document your startup's journey and inspire others in the community.</p>
            <a href="/write" class="action-button">
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
                <div class="header-actions">
                  <a 
                    href={`/stories/${note.id}`} 
                    class="story-link" 
                    title="View story"
                  >
                    {@html icons.link}
                  </a>
                  <span class="status {note.status}">{note.status}</span>
                </div>
              </div>
              <p class="preview">{note.content.slice(0, 200)}...</p>
              <div class="meta">
                <span class="timestamp">{note.timestamp}</span>
                {#if note.wallet_address}
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
                    {formattedAddress(note.wallet_address)}
                  </span>
                {/if}
                <div class="engagement">
                  <span class="likes" title="Likes">
                    {@html icons.heart} {note.likes || 0}
                  </span>
                  <span class="comments" title="Comments">
                    {@html icons.comment} {note.comments || 0}
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
</div>

<div class="profile-section">
  <h3 class="section-title">Base Name Profile</h3>
  {#if baseNameLoading}
    <div class="loading">
      <div class="spinner"></div>
      Loading profile...
    </div>
  {:else if baseName}
    <div class="basename-profile">
      {#if baseName.avatar}
        <img src={baseName.avatar} alt="Profile" class="profile-avatar" />
      {/if}
      
      {#if baseName.description}
        <p class="profile-description">{baseName.description}</p>
      {/if}

      <div class="profile-links">
        {#if baseName.twitter}
          <a 
            href={`https://twitter.com/${baseName.twitter}`}
            target="_blank"
            rel="noopener noreferrer"
            class="social-link"
          >
            <svg viewBox="0 0 24 24" class="social-icon">
              <path fill="currentColor" d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0"></path>
            </svg>
            {baseName.twitter}
          </a>
        {/if}

        {#if baseName.github}
          <a 
            href={`https://github.com/${baseName.github}`}
            target="_blank"
            rel="noopener noreferrer"
            class="social-link"
          >
            <svg viewBox="0 0 24 24" class="social-icon">
              <path fill="currentColor" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.236 1.07 1.835 2.809 1.305 1.23 1.91 1.995 5.786 1.995 5.786 0 13.255-7.098 13.255-13.254 0"></path>
            </svg>
            {baseName.github}
          </a>
        {/if}

        {#if baseName.url}
          <a 
            href={baseName.url}
            target="_blank"
            rel="noopener noreferrer"
            class="social-link"
          >
            <svg viewBox="0 0 24 24" class="social-icon">
              <path fill="currentColor" d="M21.41 8.64v-.05a10 10 0 0 0-18.78 0v.05a9.86 9.86 0 0 0 0 6.72v.05a10 10 0 0 0 18.78 0v-.05a9.86 9.86 0 0 0 0-6.72Z"></path>
            </svg>
            {baseName.url.replace(/^https?:\/\//, '')}
          </a>
        {/if}
      </div>
    </div>
  {:else}
    <div class="no-basename">
      <p>No Base name profile found</p>
      <a 
        href="https://www.base.org/name"
        target="_blank"
        rel="noopener noreferrer"
        class="action-button"
      >
        Create Base Name
      </a>
    </div>
  {/if}
</div>

<div class="profile-section">
  <h3 class="section-title">Test Base Name Lookup</h3>
  <div class="test-buttons">
    <button 
      class="action-button"
      on:click={() => testBaseName(TEST_ADDRESSES.vitalik)}
    >
      Test vitalik.eth
    </button>
    <button 
      class="action-button"
      on:click={() => testBaseName(TEST_ADDRESSES.cb)}
    >
      Test coinbase.eth
    </button>
    <div class="test-input">
      <input 
        type="text" 
        placeholder="Enter wallet address"
        bind:value={testAddress}
      />
      <button 
        class="action-button"
        on:click={() => testBaseName(testAddress)}
      >
        Test Address
      </button>
    </div>
  </div>
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
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
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
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 24px;
    border-radius: 12px;
    transition: all 0.3s ease;
  }

  .story-card:hover {
    background: rgba(255, 255, 255, 0.05);
    transform: translateY(-2px);
  }

  .story-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
  }

  .story-header h3 {
    font-size: 20px;
    font-weight: 600;
    color: white;
    margin: 0;
  }

  .preview {
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
    line-height: 1.6;
    margin: 0 0 16px;
  }

  .meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: rgba(255, 255, 255, 0.5);
    font-size: 14px;
  }

  .engagement {
    display: flex;
    gap: 16px;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 16px;
  }

  .tag {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.7);
    padding: 4px 12px;
    border-radius: 16px;
    font-size: 12px;
    text-transform: capitalize;
  }

  .empty {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 48px;
    text-align: center;
  }

  .empty-content h3 {
    color: white;
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 8px;
  }

  .empty-content p {
    color: rgba(255, 255, 255, 0.7);
    font-size: 16px;
    line-height: 1.5;
    margin: 0 0 24px;
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
    width: 320px;
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

  .loading {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #A5A5A5;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid #A5A5A5;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error {
    color: #EF4444;
  }

  .no-wallet {
    text-align: center;
    padding: 12px;
  }

  .no-wallet p {
    color: #A5A5A5;
    margin: 0 0 12px;
    font-size: 14px;
  }

  .create-wallet-button {
    background: #10B981;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .create-wallet-button:hover {
    background: #059669;
    transform: translateY(-1px);
  }

  .retry-button {
    background: none;
    border: none;
    color: #10B981;
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
    margin-left: 8px;
    font-size: inherit;
  }

  .retry-button:hover {
    color: #059669;
  }

  .wallet-card {
    margin-top: 12px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 12px;
  }

  .wallet-card h3 {
    font-size: 14px;
    color: #A5A5A5;
    margin: 0 0 8px;
  }

  .wallet-card.metamask {
    border-color: #F6851B;
  }

  .connect-metamask {
    text-align: center;
    padding: 20px;
  }

  .connect-metamask p {
    color: #A5A5A5;
    margin: 0 0 16px;
    font-size: 14px;
  }

  .connect-metamask-button {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #F6851B;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    margin: 0 auto;
  }

  .metamask-icon {
    width: 20px;
    height: 20px;
  }

  .connect-metamask-button:hover {
    background: #E2761B;
    transform: translateY(-1px);
  }

  .disconnect-button {
    background: transparent;
    border: 1px solid #F6851B;
    color: #F6851B;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    margin-top: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .disconnect-button:hover {
    background: rgba(246, 133, 27, 0.1);
  }

  .no-metamask {
    text-align: center;
    padding: 20px;
  }

  .install-metamask-button {
    display: inline-block;
    background: #F6851B;
    color: white;
    text-decoration: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
  }

  .install-metamask-button:hover {
    background: #E2761B;
    transform: translateY(-1px);
  }

  .profile-section {
    margin: 24px 0;
    padding: 20px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
  }

  .section-title {
    margin: 0 0 16px;
    font-size: 18px;
    font-weight: 500;
    color: white;
  }

  .basename-profile {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .profile-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255, 255, 255, 0.1);
  }

  .profile-description {
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
    line-height: 1.5;
  }

  .profile-links {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .social-link {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 14px;
    color: white;
    text-decoration: none;
    transition: all 0.2s;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .social-icon {
    width: 16px;
    height: 16px;
  }

  .social-link:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
  }

  .action-button {
    background: rgba(255, 255, 255, 0.05);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .action-button:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
  }

  .test-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 16px;
  }

  .test-input {
    display: flex;
    gap: 8px;
    width: 100%;
  }

  .test-input input {
    flex: 1;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 14px;
  }

  .test-input input:focus {
    outline: none;
    border-color: white;
  }

  .no-basename {
    text-align: center;
    padding: 20px;
    color: rgba(255, 255, 255, 0.7);
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

  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .story-link {
    color: #A5A5A5;
    transition: all 0.2s;
    line-height: 0;
    padding: 4px;
    border-radius: 4px;
  }

  .story-link:hover {
    color: white;
    background: rgba(255, 255, 255, 0.05);
  }

  .right {
    padding-top: 8px;
  }

  .write-button {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #22C55E;
    border: none;
    color: white;
    font-size: 14px;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .write-button:hover {
    background: #16A34A;
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    header {
      flex-direction: column;
      gap: 24px;
    }

    .right {
      width: 100%;
      padding-top: 0;
    }

    .write-button {
      width: 100%;
      justify-content: center;
    }
  }

  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-top: 40px;
  }

  .pagination-button {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .pagination-button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.05);
    transform: translateY(-1px);
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
    min-width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .page-number:hover:not(.active) {
    background: rgba(255, 255, 255, 0.05);
    transform: translateY(-1px);
  }

  .page-number.active {
    background: rgba(139, 92, 246, 0.1);
    border-color: #8B5CF6;
    color: #8B5CF6;
    cursor: default;
  }

  .ellipsis {
    color: #A5A5A5;
    padding: 0 4px;
  }

  .pagination-info {
    text-align: center;
    color: #A5A5A5;
    font-size: 14px;
    margin-top: 16px;
  }

  @media (max-width: 768px) {
    .pagination {
      flex-direction: column;
      gap: 12px;
    }

    .page-numbers {
      order: -1;
    }

    .pagination-button {
      width: 100%;
    }
  }
</style> 
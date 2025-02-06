<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { createWallet, getWalletBalance, logout } from '$lib/privy';
  import { deployVerificationAgent, getAgentMetrics, updateAgentConfig } from '$lib/gaia';

  // SVG Icons
  const icons = {
    trophy: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>`,
    bolt: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>`,
    robot: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="16" r="2"></circle><path d="M12 7v4"></path><path d="M8 7h8"></path><path d="M12 3v4"></path></svg>`,
    coins: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"></circle><path d="M18.09 10.37A6 6 0 1 1 10.34 18"></path></svg>`,
    logout: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`
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

  let agentStatus = null;
  let agentMetrics = null;
  let isDeploying = false;
  let configuring = false;
  let configModal = false;
  let configSettings = {
    consensus_threshold: 75,
    min_verifications: 3,
    timeout_hours: 48,
    reward_points: 10
  };

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

      await fetchAgentStatus();
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

  async function handleLogout() {
    try {
      logout();
      wallet = null;
      balance = '0';
      goto('/');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  }

  async function handleDeployAgent() {
    isDeploying = true;
    try {
      const agent = await deployVerificationAgent();
      // Store agent ID in localStorage for future reference
      localStorage.setItem('gaia_agent_id', agent.id);
      await fetchAgentStatus();
    } catch (error) {
      console.error('Failed to deploy agent:', error);
    } finally {
      isDeploying = false;
    }
  }

  async function fetchAgentStatus() {
    const agentId = localStorage.getItem('gaia_agent_id');
    if (!agentId) return;

    try {
      const data = await getAgentMetrics(agentId);
      agentStatus = data.status;
      agentMetrics = data.metrics;
    } catch (error) {
      console.error('Failed to fetch agent status:', error);
    }
  }

  async function handleUpdateConfig() {
    configuring = true;
    const agentId = localStorage.getItem('gaia_agent_id');
    if (!agentId) return;

    try {
      await updateAgentConfig(agentId, {
        consensus_threshold: configSettings.consensus_threshold / 100,
        min_verifications: configSettings.min_verifications,
        timeout_hours: configSettings.timeout_hours,
        reward_points: configSettings.reward_points
      });
      configModal = false;
      await fetchAgentStatus();
    } catch (error) {
      console.error('Failed to update config:', error);
    } finally {
      configuring = false;
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
          <span class="reputation-score">
            {@html icons.trophy}
            <span>{stats.reputationScore} Rep</span>
          </span>
          <a href="/submit" class="submit-button">+ New Note</a>
          <button class="logout-button" on:click={handleLogout} title="Logout">
            {@html icons.logout}
          </button>
        {/if}
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

      <div class="agent-section">
        <h2>GAIA Agent Management</h2>
        
        {#if !agentStatus}
          <div class="deploy-card">
            <h3>Deploy Verification Agent</h3>
            <p>Deploy a GAIA agent to manage note verifications and consensus.</p>
            <button 
              class="deploy-button" 
              on:click={handleDeployAgent}
              disabled={isDeploying}
            >
              {isDeploying ? 'Deploying...' : 'Deploy Agent'}
            </button>
          </div>
        {:else}
          <div class="agent-grid">
            <div class="agent-card">
              <h3>Agent Status</h3>
              <div class="status-indicator" class:active={agentStatus.status === 'active'}>
                {agentStatus.status}
              </div>
              <button 
                class="config-button" 
                on:click={() => configModal = true}
                disabled={configuring}
              >
                Update Configuration
              </button>
            </div>

            {#if agentMetrics}
              <div class="metrics-card">
                <h3>Agent Metrics</h3>
                <div class="metrics-grid">
                  <div class="metric">
                    <span class="label">Verifications</span>
                    <span class="value">{agentMetrics.total_verifications}</span>
                  </div>
                  <div class="metric">
                    <span class="label">Consensus Rate</span>
                    <span class="value">{agentMetrics.consensus_rate}%</span>
                  </div>
                  <div class="metric">
                    <span class="label">Average Time</span>
                    <span class="value">{agentMetrics.avg_verification_time}h</span>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/if}
  </main>
</div>

{#if configModal}
  <div class="modal">
    <div class="modal-content">
      <h3>Update Agent Configuration</h3>
      
      <div class="config-item">
        <label>
          Required Consensus
          <span class="help-text">Percentage of verifiers that must agree</span>
        </label>
        <input 
          type="range" 
          bind:value={configSettings.consensus_threshold}
          min="50"
          max="100"
          step="5"
        />
        <span class="value">{configSettings.consensus_threshold}%</span>
      </div>

      <div class="config-item">
        <label>
          Minimum Verifiers
          <span class="help-text">Number of people needed to verify each note</span>
        </label>
        <input 
          type="number" 
          bind:value={configSettings.min_verifications}
          min="2"
          max="10"
        />
      </div>

      <div class="config-item">
        <label>
          Verification Timeout
          <span class="help-text">Maximum hours to wait for verification</span>
        </label>
        <input 
          type="number" 
          bind:value={configSettings.timeout_hours}
          min="1"
          max="72"
        />
      </div>

      <div class="config-item">
        <label>
          Reward Points
          <span class="help-text">Points awarded for successful verification</span>
        </label>
        <input 
          type="number" 
          bind:value={configSettings.reward_points}
          min="1"
          max="100"
        />
      </div>

      <div class="modal-actions">
        <button class="cancel" on:click={() => configModal = false}>Cancel</button>
        <button 
          class="save" 
          on:click={handleUpdateConfig}
          disabled={configuring}
        >
          {configuring ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  </div>
{/if}

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

  .logout-button {
    background: none;
    color: #A5A5A5;
    padding: 0.5rem;
    border-radius: 0.5rem;
    border: 1px solid #A5A5A5;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
  }

  .logout-button:hover {
    background: #A5A5A5;
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

  .agent-section {
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 1rem;
    padding: 1.5rem;
    margin-top: 2rem;
  }

  .deploy-card {
    text-align: center;
    padding: 2rem;
  }

  .deploy-button {
    background: white;
    color: black;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    border: none;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .deploy-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .agent-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .agent-card, .metrics-card {
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
    padding: 1.5rem;
  }

  .status-indicator {
    display: inline-block;
    padding: 0.5rem 1rem;
    border-radius: 1rem;
    background: rgba(255, 59, 48, 0.1);
    color: #ff3b30;
    margin: 1rem 0;
    text-transform: capitalize;
  }

  .status-indicator.active {
    background: rgba(52, 199, 89, 0.1);
    color: #34c759;
  }

  .config-button {
    width: 100%;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 0.75rem;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .config-button:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }

  .metric {
    text-align: center;
  }

  .metric .label {
    display: block;
    color: #A5A5A5;
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
  }

  .metric .value {
    font-size: 1.25rem;
    font-weight: 600;
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

  .modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: #000;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 1rem;
    padding: 2rem;
    width: 90%;
    max-width: 500px;
  }

  .config-item {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: white;
  }

  .help-text {
    display: block;
    font-size: 0.875rem;
    color: #A5A5A5;
    margin-top: 0.25rem;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 0.5rem;
    color: white;
  }

  .modal-actions {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
  }

  button {
    flex: 1;
    padding: 0.75rem;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
  }

  .cancel {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .save {
    background: white;
    color: black;
    border: none;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style> 
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let user: any = null;
  let loading = true;
  let stats = {
    totalVerifications: 0,
    accuracyRate: '0%',
    pendingItems: 0
  };

  onMount(async () => {
    const token = localStorage.getItem('privyToken');
    if (!token) {
      goto('/');
      return;
    }

    try {
      const response = await fetch('https://auth.privy.io/api/v1/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        user = await response.json();
        // Simulate fetching dashboard stats
        stats = {
          totalVerifications: 156,
          accuracyRate: '98.5%',
          pendingItems: 3
        };
      } else {
        goto('/');
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      goto('/');
    } finally {
      loading = false;
    }
  });
</script>

<div class="dashboard">
  <nav class="dashboard-nav">
    <div class="nav-content">
      <div class="left">
        <div class="logo">N</div>
        <span class="divider">/</span>
        <span class="page-title">Dashboard</span>
      </div>
      <div class="right">
        <span class="user-email">{user?.email || 'User'}</span>
        <a href="/" class="nav-link">Home</a>
      </div>
    </div>
  </nav>

  <main class="dashboard-content">
    {#if loading}
      <div class="loading">Loading...</div>
    {:else}
      <div class="welcome-section">
        <h1>Welcome back!</h1>
        <p class="subtitle">Here's an overview of your verification activities</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <h3>Total Verifications</h3>
          <p class="stat-value">{stats.totalVerifications}</p>
        </div>
        <div class="stat-card">
          <h3>Accuracy Rate</h3>
          <p class="stat-value">{stats.accuracyRate}</p>
        </div>
        <div class="stat-card">
          <h3>Pending Items</h3>
          <p class="stat-value">{stats.pendingItems}</p>
        </div>
      </div>

      <div class="recent-activity">
        <h2>Recent Activity</h2>
        <div class="activity-list">
          <div class="activity-card">
            <div class="activity-icon">✓</div>
            <div class="activity-details">
              <h4>AI Content Verification</h4>
              <p>Successfully verified article about machine learning</p>
              <span class="activity-time">2 hours ago</span>
            </div>
          </div>
          <div class="activity-card">
            <div class="activity-icon">⚡</div>
            <div class="activity-details">
              <h4>Web3 Transaction Check</h4>
              <p>Verified smart contract interaction</p>
              <span class="activity-time">5 hours ago</span>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </main>
</div>

<style>
  .dashboard {
    min-height: 100vh;
    background: #f8f9fa;
  }

  .dashboard-nav {
    background: white;
    border-bottom: 1px solid #eee;
    padding: 1rem 2rem;
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
    font-weight: 600;
    font-size: 1.25rem;
  }

  .divider {
    color: #666;
  }

  .page-title {
    font-size: 1rem;
    color: #666;
  }

  .right {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .user-email {
    color: #666;
    font-size: 0.9375rem;
  }

  .nav-link {
    color: #000;
    text-decoration: none;
    font-size: 0.9375rem;
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
    margin-bottom: 0.5rem;
  }

  .subtitle {
    color: #666;
    font-size: 1.125rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    background: white;
    padding: 1.5rem;
    border-radius: 1rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }

  .stat-card h3 {
    color: #666;
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 600;
    margin: 0;
  }

  .recent-activity {
    background: white;
    padding: 1.5rem;
    border-radius: 1rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }

  h2 {
    font-size: 1.25rem;
    margin-bottom: 1rem;
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
    border: 1px solid #eee;
    border-radius: 0.5rem;
  }

  .activity-icon {
    background: #e8fff5;
    color: #0d9488;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
  }

  .activity-details h4 {
    margin: 0 0 0.25rem;
    font-size: 1rem;
  }

  .activity-details p {
    margin: 0 0 0.25rem;
    color: #666;
    font-size: 0.9375rem;
  }

  .activity-time {
    color: #999;
    font-size: 0.875rem;
  }

  .loading {
    text-align: center;
    padding: 2rem;
    color: #666;
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
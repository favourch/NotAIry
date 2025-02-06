<script lang="ts">
  export let onDrawerToggle: () => void;
  import { privyClient } from '$lib/privy';

  let isAuthenticated = false;

  async function handleLogout() {
    try {
      await privyClient.auth.logout();
      isAuthenticated = false;
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }
</script>

<header>
  <div class="content">
    <div class="logo">NotAIry</div>
    <nav class="desktop-nav">
      <!-- Add your navigation items here -->
    </nav>
    <div class="auth">
      {#if isAuthenticated}
        <button on:click={handleLogout}>Log Out</button>
      {:else}
        <button on:click={() => window.location.href = '/login'}>Log In</button>
      {/if}
    </div>
    <button class="menu" on:click={onDrawerToggle}>
      <span>Menu</span>
    </button>
  </div>
</header>

<style>
  header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background: #161616;
    padding: 20px;
  }

  .content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .logo {
    color: white;
    font-weight: bold;
    font-size: 24px;
  }

  .desktop-nav {
    display: none;
  }

  .auth button {
    background: none;
    border: 1px solid white;
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    cursor: pointer;
  }

  .menu {
    display: block;
    background: none;
    border: none;
    color: white;
    cursor: pointer;
  }

  @media (min-width: 768px) {
    .desktop-nav {
      display: flex;
      gap: 32px;
    }

    .menu {
      display: none;
    }
  }
</style> 
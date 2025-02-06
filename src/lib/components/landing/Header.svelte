<script lang="ts">
  import { goto } from '$app/navigation';
  import { createWallet } from '$lib/privy';

  export let onDrawerToggle: () => void;

  let isLoading = false;
  let error = '';

  async function handleLogin() {
    if (isLoading) return;
    
    try {
      isLoading = true;
      error = '';
      const wallet = await createWallet();
      if (wallet?.id) {
        goto('/dashboard');
      }
    } catch (err) {
      console.error('Failed to login:', err);
      error = 'Failed to login. Please try again.';
    } finally {
      isLoading = false;
    }
  }
</script>

<header>
  <div class="content">
    <div class="logo">NotAIry</div>
    <nav class="desktop-nav">
      <a href="#features">Features</a>
      <a href="#about">About</a>
      <a href="#contact">Contact</a>
    </nav>
    <div class="auth">
      <button class="login-button" on:click={handleLogin} disabled={isLoading}>
        {#if isLoading}
          <span class="loader"></span>
        {:else}
          Login
        {/if}
      </button>
      {#if error}
        <span class="error">{error}</span>
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
    gap: 32px;
  }

  .desktop-nav a {
    color: white;
    text-decoration: none;
    font-size: 16px;
    transition: opacity 0.2s;
  }

  .desktop-nav a:hover {
    opacity: 0.8;
  }

  .auth {
    position: relative;
  }

  .auth button {
    background: none;
    border: 1px solid white;
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 80px;
  }

  .auth button:hover:not(:disabled) {
    background: white;
    color: #161616;
  }

  .auth button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .error {
    position: absolute;
    bottom: -24px;
    right: 0;
    color: #ef4444;
    font-size: 12px;
  }

  .loader {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid currentColor;
    border-radius: 50%;
    border-top-color: transparent;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
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
    }

    .menu {
      display: none;
    }
  }
</style> 
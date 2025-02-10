<script lang="ts">
  import { smartWallet } from '$lib/smartWallet';
  import { onMount } from 'svelte';

  let loading = false;
  let error: string | null = null;
  let walletAddress: string | null = null;
  let balance: string = '0';

  async function createNewWallet() {
    loading = true;
    error = null;
    try {
      const { address } = await smartWallet.createWallet();
      walletAddress = address;
      await updateBalance();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to create wallet';
    } finally {
      loading = false;
    }
  }

  async function updateBalance() {
    if (walletAddress) {
      const bal = await smartWallet.getBalance();
      balance = bal.toString();
    }
  }

  onMount(async () => {
    const existing = await smartWallet.connectExisting();
    if (existing) {
      walletAddress = existing.address;
      await updateBalance();
    }
  });
</script>

<div class="wallet-container">
  {#if error}
    <div class="error">{error}</div>
  {/if}

  {#if walletAddress}
    <div class="wallet-info">
      <h3>Smart Wallet</h3>
      <p class="address">{walletAddress}</p>
      <p class="balance">{balance} ETH</p>
    </div>
  {:else}
    <button 
      class="create-wallet" 
      on:click={createNewWallet}
      disabled={loading}
    >
      {loading ? 'Creating...' : 'Create Smart Wallet'}
    </button>
  {/if}
</div>

<style>
  .wallet-container {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 24px;
    border-radius: 12px;
    margin: 16px 0;
  }

  .error {
    color: #ef4444;
    margin-bottom: 16px;
    font-size: 14px;
  }

  .wallet-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .address {
    font-family: monospace;
    color: #A5A5A5;
  }

  .balance {
    font-size: 24px;
    font-weight: 600;
  }

  .create-wallet {
    background: #8B5CF6;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }

  .create-wallet:hover:not(:disabled) {
    transform: translateY(-1px);
    background: #7C3AED;
  }

  .create-wallet:disabled {
    opacity: 0.7;
    cursor: wait;
  }
</style> 
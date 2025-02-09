<script lang="ts">
  export let message: string | null = null;
  export let type: 'success' | 'error' | 'info' = 'info';
  
  const TIMEOUT = 3000;
  let visible = false;
  let timeoutId: NodeJS.Timeout;

  $: if (message) {
    visible = true;
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      visible = false;
    }, TIMEOUT);
  }
</script>

{#if visible && message}
  <div 
    class="toast {type}"
    role="alert"
    on:click={() => visible = false}
  >
    <p>{message}</p>
  </div>
{/if}

<style>
  .toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 24px;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    font-size: 14px;
    cursor: pointer;
    z-index: 1000;
    animation: slideUp 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .toast p {
    margin: 0;
  }

  .toast.success {
    border-left: 4px solid #10B981;
  }

  .toast.error {
    border-left: 4px solid #EF4444;
  }

  .toast.info {
    border-left: 4px solid #3B82F6;
  }

  @keyframes slideUp {
    from {
      transform: translate(-50%, 100%);
      opacity: 0;
    }
    to {
      transform: translate(-50%, 0);
      opacity: 1;
    }
  }
</style> 
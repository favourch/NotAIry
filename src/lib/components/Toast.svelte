<script lang="ts">
  import { onMount } from 'svelte';
  
  export let message: string;
  export let type: 'success' | 'error' | 'info' = 'info';
  export let duration = 3000;
  export let onClose: () => void;

  onMount(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  });
</script>

<div class="toast" class:success={type === 'success'} class:error={type === 'error'}>
  <span class="message">{message}</span>
  <button class="close-button" on:click={onClose}>×</button>
</div>

<style>
  .toast {
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    z-index: 1000;
    animation: slideUp 0.3s ease-out;
  }

  .success {
    border-color: rgba(52, 199, 89, 0.2);
  }

  .error {
    border-color: rgba(255, 59, 48, 0.2);
  }

  .message {
    font-family: 'Inter', sans-serif;
    font-size: 0.9375rem;
  }

  .close-button {
    background: none;
    border: none;
    color: #A5A5A5;
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0;
    line-height: 1;
  }

  .close-button:hover {
    color: white;
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
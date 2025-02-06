<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { privyClient } from '$lib/privy';

  let isAuthenticated = false;

  onMount(async () => {
    try {
      const user = await privyClient.user.get();
      isAuthenticated = !!user;
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  });

  function handleGetStarted() {
    if (isAuthenticated) {
      goto('/dashboard');
    } else {
      goto('/login');
    }
  }
</script>

<section class="top">
  <div class="content">
    <div class="text">
      <h1>
        Community Notes<br />
        for Web3 & AI
      </h1>
      <p class="description">
        Verify and annotate Web3 & AI content with community-driven insights.
        Join a network of experts and enthusiasts building a more transparent digital ecosystem.
      </p>
      <div class="cta">
        <button class="primary" on:click={handleGetStarted}>
          Get Started
        </button>
        <button class="secondary" on:click={() => goto('#features')}>
          Learn More
        </button>
      </div>
    </div>
    <div class="visual">
      <!-- Add your hero image or animation here -->
    </div>
  </div>
</section>

<style>
  .top {
    min-height: 100vh;
    padding: 120px 20px 60px;
    display: flex;
    align-items: center;
    background: linear-gradient(180deg, #161616 0%, #1E1E1E 100%);
  }

  .content {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
    align-items: center;
  }

  .text {
    color: white;
  }

  h1 {
    font-size: 64px;
    line-height: 1.1;
    font-weight: 700;
    margin: 0 0 24px;
    background: linear-gradient(90deg, #FFFFFF 0%, #A5A5A5 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .description {
    font-size: 20px;
    line-height: 1.5;
    color: #A5A5A5;
    margin: 0 0 40px;
    max-width: 480px;
  }

  .cta {
    display: flex;
    gap: 16px;
  }

  button {
    padding: 16px 32px;
    border-radius: 32px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .primary {
    background: white;
    color: black;
    border: none;
  }

  .primary:hover {
    background: #E5E5E5;
  }

  .secondary {
    background: transparent;
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .secondary:hover {
    border-color: white;
  }

  .visual {
    position: relative;
    height: 600px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 24px;
  }

  @media (max-width: 1024px) {
    .content {
      grid-template-columns: 1fr;
      text-align: center;
    }

    .description {
      margin-left: auto;
      margin-right: auto;
    }

    .cta {
      justify-content: center;
    }

    .visual {
      height: 400px;
    }
  }

  @media (max-width: 768px) {
    h1 {
      font-size: 48px;
    }

    .description {
      font-size: 18px;
    }

    button {
      padding: 14px 28px;
    }
  }
</style> 
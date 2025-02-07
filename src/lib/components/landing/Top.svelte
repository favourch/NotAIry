<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { signInWithEmail, getSession } from '$lib/supabase';
  import { createWallet } from '$lib/privy';

  const exampleNotes = [
    {
      title: 'Our Journey to Product Market Fit',
      content: 'After 6 months of iterations, we discovered our core value proposition wasn\'t in the tech, but in the community we built.',
      author: 'founder.eth',
      votes: 128,
      tags: ['pmf', 'startup', 'journey']
    },
    {
      title: 'First 1000 Users Story',
      content: 'How we leveraged Web3 communities and built in public to grow our initial user base organically.',
      author: 'growth.eth',
      votes: 89,
      tags: ['growth', 'community', 'web3']
    },
    {
      title: 'Fundraising in Web3',
      content: 'Key lessons from raising our seed round: focus on token economics and community incentives.',
      author: 'startupfounder.eth',
      votes: 245,
      tags: ['fundraising', 'tokenomics', 'dao']
    }
  ];

  let isLoading = false;
  let error = '';
  let email = '';
  let showVerification = false;

  onMount(async () => {
    const { session } = await getSession();
    if (session) {
      goto('/dashboard');
    }
  });

  async function handleGetStarted() {
    if (isLoading || !email) return;

    try {
      isLoading = true;
      error = '';

      const { error: signInError } = await signInWithEmail(email);
      
      if (signInError) {
        error = 'Failed to send verification email. Please try again.';
      } else {
        showVerification = true;
      }
    } catch (err) {
      console.error('Failed to start auth:', err);
      error = 'Authentication failed. Please try again.';
    } finally {
      isLoading = false;
    }
  }
</script>

<section class="top">
  <div class="content">
    <div class="text">
      <h1>
        Share Your Startup<br />
        Story On-Chain
      </h1>
      <p class="description">
        Immortalize your startup journey through decentralized storytelling.
        Join a community of founders, builders, and innovators documenting the future of technology.
      </p>
      <div class="auth-form">
        {#if !showVerification}
          <input
            type="email"
            bind:value={email}
            placeholder="Enter your email"
            class="email-input"
          />
          <button 
            class="primary" 
            on:click={handleGetStarted} 
            disabled={isLoading || !email}
          >
            {#if isLoading}
              <span class="loader"></span>
            {:else}
              Get Started
            {/if}
          </button>
        {:else}
          <div class="verification-message">
            <p>Check your email for the login link!</p>
            <button 
              class="secondary"
              on:click={() => showVerification = false}
            >
              Back
            </button>
          </div>
        {/if}
      </div>
      {#if error}
        <p class="error">{error}</p>
      {/if}
    </div>
    <div class="visual">
      <div class="card">
        <div class="card-header">
          <div class="header-content">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
        </div>
        <div class="notes-preview">
          {#each exampleNotes as note}
            <div class="note-card">
              <div class="note-header">
                <h4>{note.title}</h4>
                <div class="votes">
                  <span class="arrow">↑</span>
                  {note.votes}
                </div>
              </div>
              <p class="note-content">{note.content}</p>
              <div class="note-footer">
                <span class="author">{note.author}</span>
                <div class="tags">
                  {#each note.tags as tag}
                    <span class="tag">#{tag}</span>
                  {/each}
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
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
    cursor: pointer;
    transition: all 0.2s;
  }

  .primary:hover {
    background: #E5E5E5;
    transform: translateY(-2px);
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
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .card {
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 24px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
  }

  .card-header {
    background: rgba(255, 255, 255, 0.05);
    padding: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .header-content {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
  }

  .notes-preview {
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: calc(100% - 53px); /* Subtract header height */
    overflow-y: auto;
    padding: 24px;
  }

  .note-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .note-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }

  .note-header h4 {
    margin: 0;
    font-size: 18px;
    color: white;
    font-weight: 600;
  }

  .votes {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #A5A5A5;
    font-size: 14px;
  }

  .arrow {
    color: #10B981;
  }

  .note-content {
    color: #A5A5A5;
    font-size: 14px;
    line-height: 1.5;
    margin: 0 0 16px;
  }

  .note-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .author {
    color: #10B981;
    font-size: 14px;
  }

  .tags {
    display: flex;
    gap: 8px;
  }

  .tag {
    color: #A5A5A5;
    font-size: 12px;
  }

  /* Add scrollbar styling */
  .notes-preview::-webkit-scrollbar {
    width: 8px;
  }

  .notes-preview::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }

  .notes-preview::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }

  .notes-preview::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
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
      height: 500px;
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

  .loader {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 2px solid #161616;
    border-radius: 50%;
    border-top-color: transparent;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .error {
    color: #ef4444;
    font-size: 14px;
    margin-top: 16px;
    text-align: center;
  }

  button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  button:disabled:hover {
    transform: none;
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 400px;
    margin: 0 auto;
  }

  .email-input,
  .code-input {
    width: 100%;
    padding: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    color: white;
    font-size: 1rem;
  }

  .email-input::placeholder,
  .code-input::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  .email-input:focus,
  .code-input:focus {
    outline: none;
    border-color: #a5b4fc;
  }

  .error {
    color: #ef4444;
    font-size: 0.875rem;
    text-align: center;
    margin-top: 0.5rem;
  }

  .verification-message {
    text-align: center;
    color: #a5b4fc;
    padding: 1rem;
  }

  .secondary {
    background: transparent;
    border: 1px solid #a5b4fc;
    color: #a5b4fc;
  }

  .secondary:hover {
    background: rgba(165, 180, 252, 0.1);
  }
</style> 
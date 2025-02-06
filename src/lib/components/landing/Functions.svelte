<script lang="ts">
  import { VerifyIcon, NotesIcon, TrustIcon } from '$lib/icons';

  const functions = [
    {
      title: 'Verify Content',
      description: 'Validate Web3 transactions and AI-generated content with community insights.',
      icon: VerifyIcon
    },
    {
      title: 'Add Notes',
      description: 'Contribute your expertise by adding context and annotations to content.',
      icon: NotesIcon
    },
    {
      title: 'Build Trust',
      description: 'Help create a more transparent and trustworthy digital ecosystem.',
      icon: TrustIcon
    }
  ];
</script>

<section class="functions">
  <div class="content">
    <h2>Core Functions</h2>
    <div class="grid">
      {#each functions as item}
        <div class="card">
          <div class="icon">
            {@html item.icon}
          </div>
          <h3>{item.title}</h3>
          <p>{item.description}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .functions {
    padding: 120px 20px;
    background: #1A1A1A;
  }

  .content {
    max-width: 1200px;
    margin: 0 auto;
  }

  h2 {
    font-size: 48px;
    color: white;
    text-align: center;
    margin: 0 0 60px;
    background: linear-gradient(90deg, #FFFFFF 0%, #A5A5A5 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 32px;
  }

  .card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 24px;
    padding: 32px;
    color: white;
    transition: transform 0.2s;
  }

  .card:hover {
    transform: translateY(-4px);
  }

  .icon {
    width: 48px;
    height: 48px;
    margin-bottom: 24px;
    color: white;
  }

  .icon :global(svg) {
    width: 100%;
    height: 100%;
  }

  h3 {
    font-size: 24px;
    margin: 0 0 16px;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: #A5A5A5;
    line-height: 1.5;
  }

  @media (max-width: 1024px) {
    .grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 768px) {
    .functions {
      padding: 80px 20px;
    }

    h2 {
      font-size: 36px;
      margin-bottom: 40px;
    }

    .grid {
      grid-template-columns: 1fr;
    }
  }
</style> 
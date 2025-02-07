<script lang="ts">
  const functions = [
    {
      title: 'Decentralized Storytelling',
      description: 'Share your startup journey with permanent, tamper-proof records on the blockchain. Build your legacy in Web3.',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 19l7-7 3 3-7 7-3-3z"/>
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
        <path d="M2 2l7.586 7.586"/>
        <circle cx="11" cy="11" r="2"/>
      </svg>`
    },
    {
      title: 'Community Engagement',
      description: 'Connect with fellow founders, get feedback on your journey, and build relationships within the startup ecosystem.',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>`
    },
    {
      title: 'AI-Enhanced Insights',
      description: 'Get intelligent analysis of your startup story, track narrative patterns, and discover insights from successful founders.',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10H12V2z"/>
        <path d="M12 2a10 10 0 1 1-10 10h10V2z"/>
        <circle cx="12" cy="12" r="4"/>
      </svg>`
    },
    {
      title: 'Token-Gated Content',
      description: 'Create exclusive content for your community, token holders, and investors. Build deeper connections with stakeholders.',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>`
    },
    {
      title: 'Milestone Tracking',
      description: 'Document and verify key startup milestones on-chain. Build trust with transparent progress tracking.',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2v20"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>`
    },
    {
      title: 'Cross-Platform Sharing',
      description: 'Share your startup story across Web3 social platforms while maintaining ownership of your narrative.',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="18" cy="5" r="3"/>
        <circle cx="6" cy="12" r="3"/>
        <circle cx="18" cy="19" r="3"/>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
      </svg>`
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
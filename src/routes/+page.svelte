<main>
  <!-- Hero Section -->
  <section class="hero">
    <h1>NotAIry</h1>
    <p>Community-driven verification for Web3 & AI content</p>
    <div class="buttons">
      <button class="primary">Get Started</button>
      <button class="secondary">Learn More</button>
    </div>
  </section>

  <!-- Features Section -->
  <section class="features">
    <h2>Key Features</h2>
    <div class="feature-grid">
      <div class="feature">
        <h3>AI-Powered Verification</h3>
        <p>Automated fact-checking of Web3 claims and AI-generated content using advanced AI models.</p>
      </div>

      <div class="feature">
        <h3>Community Notes</h3>
        <p>Submit and vote on annotations with crypto-backed staking mechanisms.</p>
      </div>

      <div class="feature">
        <h3>Smart Contract Integration</h3>
        <p>Transparent onchain tracking of notes, votes, and reputation systems.</p>
      </div>

      <div class="feature">
        <h3>Web3 Identity</h3>
        <p>Simple authentication with email, social login, or Web3 wallets.</p>
      </div>
    </div>
  </section>
</main>

<style>
  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .hero {
    text-align: center;
    padding: 80px 0;
  }

  h1 {
    font-size: 48px;
    margin-bottom: 20px;
  }

  .hero p {
    font-size: 24px;
    margin-bottom: 40px;
  }

  .buttons {
    display: flex;
    gap: 20px;
    justify-content: center;
  }

  button {
    padding: 12px 24px;
    border-radius: 6px;
    font-size: 16px;
    cursor: pointer;
  }

  .primary {
    background: #3b82f6;
    color: white;
    border: none;
  }

  .secondary {
    background: transparent;
    border: 2px solid #3b82f6;
    color: #3b82f6;
  }

  .features {
    padding: 80px 0;
  }

  h2 {
    text-align: center;
    font-size: 36px;
    margin-bottom: 60px;
  }

  .feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 40px;
  }

  .feature {
    padding: 20px;
    border-radius: 8px;
    background: #f8f9fa;
  }

  .feature h3 {
    font-size: 24px;
    margin-bottom: 16px;
  }

  .feature p {
    color: #666;
    line-height: 1.6;
  }

  @media (max-width: 768px) {
    .hero {
      padding: 40px 0;
    }

    h1 {
      font-size: 36px;
    }

    .hero p {
      font-size: 20px;
    }

    .feature-grid {
      grid-template-columns: 1fr;
    }
  }
</style>

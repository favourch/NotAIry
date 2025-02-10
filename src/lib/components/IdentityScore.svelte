<script lang="ts">
  import { onMount } from 'svelte';
  import { IdentityScorer } from '../identityScorer';

  export let walletAddress: string | undefined;
  
  // Add reactive debugging
  $: console.log('IdentityScore component walletAddress:', walletAddress);

  let score: {
    trustScore: number;
    activityScore: number;
    defiScore: number;
    nftScore: number;
    socialScore: number;
    totalScore: number;
    details: {
      transactionCount: number;
      uniqueContracts: number;
      defiProtocols: string[];
      nftCollections: number;
      lastActive: string;
      riskLevel: 'low' | 'medium' | 'high';
    };
  } | null = null;

  let loading = false;  // Start as false until we have an address
  let error: string | null = null;

  // Update to use reactive statement instead of onMount
  $: {
    if (walletAddress) {
      loading = true;
      error = null;  // Reset error state
      IdentityScorer.getWalletScore(walletAddress)
        .then(result => {
          score = result;
        })
        .catch(err => {
          console.error('Failed to load identity score:', err);
          error = 'Failed to load identity score';
        })
        .finally(() => {
          loading = false;
        });
    } else {
      // Reset states when no address is provided
      score = null;
      loading = false;
      error = null;
    }
  }

  function getScoreColor(value: number): string {
    if (value >= 75) return '#22C55E';
    if (value >= 50) return '#EAB308';
    return '#EF4444';
  }
</script>

<div class="identity-score">
  {#if !walletAddress}
    <div class="no-address">
      <span>Waiting for wallet connection...</span>
    </div>
  {:else if loading}
    <div class="loading">
      <div class="spinner"></div>
      <span>Analyzing on-chain identity...</span>
    </div>
  {:else if error}
    <div class="error">
      {error}
    </div>
  {:else}
    <div class="score-header">
      <h3>Web3 Identity Score</h3>
      <div class="total-score" style="color: {getScoreColor(score.totalScore)}">
        {Math.round(score.totalScore)}
      </div>
    </div>

    <div class="score-grid">
      <div class="score-item">
        <span class="label">Trust Score</span>
        <div class="bar">
          <div 
            class="fill" 
            style="width: {score.trustScore}%; background: {getScoreColor(score.trustScore)}"
          ></div>
        </div>
        <span class="value">{Math.round(score.trustScore)}</span>
      </div>

      <div class="score-item">
        <span class="label">Activity Score</span>
        <div class="bar">
          <div 
            class="fill" 
            style="width: {score.activityScore}%; background: {getScoreColor(score.activityScore)}"
          ></div>
        </div>
        <span class="value">{Math.round(score.activityScore)}</span>
      </div>

      <div class="score-item">
        <span class="label">DeFi Score</span>
        <div class="bar">
          <div 
            class="fill" 
            style="width: {score.defiScore}%; background: {getScoreColor(score.defiScore)}"
          ></div>
        </div>
        <span class="value">{Math.round(score.defiScore)}</span>
      </div>

      <div class="score-item">
        <span class="label">NFT Score</span>
        <div class="bar">
          <div 
            class="fill" 
            style="width: {score.nftScore}%; background: {getScoreColor(score.nftScore)}"
          ></div>
        </div>
        <span class="value">{Math.round(score.nftScore)}</span>
      </div>

      <div class="score-item">
        <span class="label">Social Score</span>
        <div class="bar">
          <div 
            class="fill" 
            style="width: {score.socialScore}%; background: {getScoreColor(score.socialScore)}"
          ></div>
        </div>
        <span class="value">{Math.round(score.socialScore)}</span>
      </div>
    </div>

    <div class="details">
      <div class="detail-item">
        <span class="label">Risk Level</span>
        <span class="value" style="color: {
          score.details.riskLevel === 'low' ? '#22C55E' :
          score.details.riskLevel === 'medium' ? '#EAB308' : '#EF4444'
        }">
          {score.details.riskLevel}
        </span>
      </div>
      <div class="detail-item">
        <span class="label">Transactions</span>
        <span class="value">{score.details.transactionCount}</span>
      </div>
      <div class="detail-item">
        <span class="label">DeFi Protocols</span>
        <span class="value">{score.details.defiProtocols.length}</span>
      </div>
      <div class="detail-item">
        <span class="label">NFT Collections</span>
        <span class="value">{score.details.nftCollections}</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .identity-score {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 20px;
    margin-top: 16px;
  }

  .loading {
    display: flex;
    align-items: center;
    gap: 12px;
    color: #A5A5A5;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid #A5A5A5;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error {
    color: #EF4444;
    font-size: 14px;
  }

  .score-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: white;
    margin: 0;
  }

  .total-score {
    font-size: 24px;
    font-weight: 700;
  }

  .score-grid {
    display: grid;
    gap: 16px;
  }

  .score-item {
    display: grid;
    grid-template-columns: 100px 1fr 40px;
    align-items: center;
    gap: 12px;
  }

  .label {
    font-size: 14px;
    color: #A5A5A5;
  }

  .bar {
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    overflow: hidden;
  }

  .fill {
    height: 100%;
    transition: width 0.3s ease;
  }

  .value {
    font-size: 14px;
    color: white;
    text-align: right;
  }

  .details {
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 16px;
  }

  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .detail-item .label {
    font-size: 12px;
  }

  .detail-item .value {
    font-size: 16px;
    font-weight: 500;
  }

  .no-address {
    color: #A5A5A5;
    text-align: center;
    padding: 20px;
    font-size: 14px;
  }
</style> 
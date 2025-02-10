import { supabase } from './supabase';

interface OnChainScore {
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
}

interface Transaction {
  to_address: string;
  block_signed_at: string;
}

export class IdentityScorer {
  private static COVALENT_API_KEY = import.meta.env.VITE_COVALENT_API_KEY;
  private static COVALENT_BASE_URL = 'https://api.covalenthq.com/v1';

  static async getWalletScore(address: string | null | undefined): Promise<OnChainScore> {
    try {
      // Add debug logging
      console.log('getWalletScore called with address:', address);
      
      // Return default score if address is null or undefined
      if (!address) {
        console.warn('No wallet address provided, using default scores');
        return this.getDefaultScore();
      }

      // Normalize the address
      const normalizedAddress = address.toLowerCase();

      // First check cache with proper query formatting
      const { data: cached, error: cacheError } = await supabase
        .from('wallet_scores')
        .select('*')
        .eq('wallet_address', normalizedAddress)
        .maybeSingle(); // Use maybeSingle instead of single to avoid 406

      if (cacheError) {
        console.error('Cache lookup error:', cacheError);
      }

      if (cached && Date.now() - new Date(cached.updated_at).getTime() < 24 * 60 * 60 * 1000) {
        return JSON.parse(cached.score_data);
      }

      // If no API key, return default scores
      if (!this.COVALENT_API_KEY) {
        console.warn('No Covalent API key found, using default scores');
        return this.getDefaultScore();
      }

      // Fetch on-chain data with error handling
      const [transactions, defi, nfts] = await Promise.all([
        this.getTransactionHistory(normalizedAddress).catch(err => {
          console.error('Failed to fetch transactions:', err);
          return { items: [] };
        }),
        this.getDefiActivity(normalizedAddress).catch(err => {
          console.error('Failed to fetch DeFi activity:', err);
          return { protocols: [] };
        }),
        this.getNFTHoldings(normalizedAddress).catch(err => {
          console.error('Failed to fetch NFT holdings:', err);
          return { collections: [] };
        })
      ]);

      // Calculate scores
      const trustScore = this.calculateTrustScore(transactions.items || []);
      const activityScore = this.calculateActivityScore(transactions.items || []);
      const defiScore = this.calculateDefiScore(defi);
      const nftScore = this.calculateNFTScore(nfts);
      const socialScore = this.calculateSocialScore(transactions.items || []);

      const score: OnChainScore = {
        trustScore,
        activityScore,
        defiScore,
        nftScore,
        socialScore,
        totalScore: (trustScore + activityScore + defiScore + nftScore + socialScore) / 5,
        details: {
          transactionCount: (transactions.items || []).length,
          uniqueContracts: new Set((transactions.items || []).map((tx: Transaction) => tx.to_address)).size,
          defiProtocols: defi.protocols,
          nftCollections: (nfts.collections || []).length,
          lastActive: (transactions.items || [])[0]?.block_signed_at || 'Never',
          riskLevel: this.calculateRiskLevel(trustScore)
        }
      };

      // Cache the result with proper error handling
      try {
        const { error: upsertError } = await supabase
          .from('wallet_scores')
          .upsert({
            wallet_address: normalizedAddress,
            score_data: score, // Supabase will automatically stringify JSONB
            updated_at: new Date().toISOString()
          });

        if (upsertError) {
          console.error('Failed to cache wallet score:', upsertError);
        }
      } catch (err) {
        console.error('Failed to cache wallet score:', err);
      }

      return score;
    } catch (err) {
      console.error('Failed to calculate wallet score:', err);
      return this.getDefaultScore();
    }
  }

  private static async getTransactionHistory(address: string) {
    const response = await fetch(
      `${this.COVALENT_BASE_URL}/8453/address/${address}/transactions_v2/`,
      {
        headers: {
          'Authorization': `Bearer ${this.COVALENT_API_KEY}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data || { items: [] };
  }

  private static async getDefiActivity(address: string) {
    const response = await fetch(
      `${this.COVALENT_BASE_URL}/8453/address/${address}/portfolio_v2/`,
      {
        headers: {
          'Authorization': `Bearer ${this.COVALENT_API_KEY}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const protocols = new Set<string>();
    (data.data?.items || []).forEach((item: any) => {
      if (item.contract_name) {
        protocols.add(item.contract_name);
      }
    });
    
    return {
      protocols: Array.from(protocols)
    };
  }

  private static async getNFTHoldings(address: string) {
    const response = await fetch(
      `${this.COVALENT_BASE_URL}/8453/address/${address}/balances_nft/`,
      {
        headers: {
          'Authorization': `Bearer ${this.COVALENT_API_KEY}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      collections: data.data?.items || []
    };
  }

  private static getDefaultScore(): OnChainScore {
    return {
      trustScore: 50,
      activityScore: 50,
      defiScore: 50,
      nftScore: 50,
      socialScore: 50,
      totalScore: 50,
      details: {
        transactionCount: 0,
        uniqueContracts: 0,
        defiProtocols: [],
        nftCollections: 0,
        lastActive: 'Never',
        riskLevel: 'medium'
      }
    };
  }

  private static calculateTrustScore(transactions: any[]): number {
    // Implement trust scoring based on:
    // - Transaction success rate
    // - Age of wallet
    // - Interaction with verified contracts
    // - Regular activity patterns
    return Math.min(100, Math.floor(transactions.length * 0.5));
  }

  private static calculateActivityScore(transactions: any[]): number {
    // Score based on:
    // - Transaction frequency
    // - Transaction value
    // - Diversity of interactions
    return Math.min(100, Math.floor(transactions.length * 0.8));
  }

  private static calculateDefiScore(defi: { protocols: string[] }): number {
    // Score based on:
    // - Number of DeFi protocols used
    // - Total value locked
    // - Lending/borrowing history
    return Math.min(100, defi.protocols.length * 20);
  }

  private static calculateNFTScore(nfts: { collections: any[] }): number {
    // Score based on:
    // - Number of collections
    // - Blue chip holdings
    // - Trading history
    return Math.min(100, nfts.collections.length * 10);
  }

  private static calculateSocialScore(transactions: any[]): number {
    // Score based on:
    // - Interactions with other wallets
    // - Community participation
    // - Social token holdings
    return Math.min(100, Math.floor(transactions.length * 0.3));
  }

  private static calculateRiskLevel(trustScore: number): 'low' | 'medium' | 'high' {
    if (trustScore >= 75) return 'low';
    if (trustScore >= 40) return 'medium';
    return 'high';
  }
} 
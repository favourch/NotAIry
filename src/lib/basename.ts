import { base } from 'viem/chains';
import { http, createPublicClient } from 'viem';
import { normalize } from 'viem/ens';

const BASENAME_L2_RESOLVER_ADDRESS = '0xc6d566a56a1aff6508b41f6c90ff131615583bcd';

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

export interface BaseNameProfile {
  description?: string;
  keywords?: string;
  url?: string;
  github?: string;
  email?: string;
  phone?: string;
  twitter?: string;
  farcaster?: string;
  lens?: string;
  telegram?: string;
  discord?: string;
  avatar?: string;
}

export async function getBaseNameProfile(address: string): Promise<BaseNameProfile | null> {
  try {
    const name = await publicClient.getEnsName({ address });
    if (!name) return null;

    const normalizedName = normalize(name);
    
    const records = await Promise.all([
      publicClient.getEnsText({ 
        name: normalizedName, 
        key: 'description',
        universalResolverAddress: BASENAME_L2_RESOLVER_ADDRESS 
      }),
      publicClient.getEnsText({ 
        name: normalizedName, 
        key: 'url',
        universalResolverAddress: BASENAME_L2_RESOLVER_ADDRESS 
      }),
      publicClient.getEnsText({ 
        name: normalizedName, 
        key: 'com.github',
        universalResolverAddress: BASENAME_L2_RESOLVER_ADDRESS 
      }),
      publicClient.getEnsText({ 
        name: normalizedName, 
        key: 'com.twitter',
        universalResolverAddress: BASENAME_L2_RESOLVER_ADDRESS 
      }),
      publicClient.getEnsText({ 
        name: normalizedName, 
        key: 'avatar',
        universalResolverAddress: BASENAME_L2_RESOLVER_ADDRESS 
      })
    ]);

    return {
      description: records[0] || undefined,
      url: records[1] || undefined,
      github: records[2] || undefined,
      twitter: records[3] || undefined,
      avatar: records[4] || undefined
    };
  } catch (error) {
    console.error('Error fetching Base name profile:', error);
    return null;
  }
} 
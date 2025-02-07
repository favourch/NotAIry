import { supabase } from '$lib/supabase';

export const getGaiaHeaders = () => ({
  'Authorization': `Bearer ${import.meta.env.GAIA_API_KEY}`,
  'Content-Type': 'application/json'
});

export const CONSENSUS_API = 'https://consensus.gaia.domains/api';
export const CODER_API = 'https://coder.gaia.domains/api';

interface GaiaAgent {
  id: string;
  name: string;
  description: string;
  platforms: string[];
  capabilities: string[];
  status: 'active' | 'inactive' | 'error';
}

interface AgentMetrics {
  total_verifications: number;
  consensus_rate: number;
  avg_verification_time: number;
}

interface AgentConfig {
  consensus_threshold: number;    // Minimum % of verifiers that must agree (e.g., 75%)
  min_verifications: number;      // Minimum number of verifiers needed (e.g., 3)
  timeout_hours: number;          // How long to wait for verifications (e.g., 48 hours)
  reward_points: number;          // Points awarded for successful verification (e.g., 10)
}

// Mock data for testing (will be replaced with real API calls)
const mockAgent: GaiaAgent = {
  id: 'mock-agent-1',
  name: 'NotAIry Verification Agent',
  description: 'Manages note verification using Gaia Consensus & Coder',
  platforms: ['web', 'consensus', 'coder'],
  capabilities: [
    'consensus_verification',
    'code_analysis',
    'smart_contract_validation'
  ],
  status: 'active'
};

// Helper function to award points to users
async function awardPoints(walletId: string, points: number) {
  try {
    // First get current user stats
    const { data: stats } = await supabase
      .from('user_stats')
      .select('reputation_score')
      .eq('wallet_id', walletId)
      .single();

    const currentScore = stats?.reputation_score || 0;
    
    // Update user's reputation score
    await supabase
      .from('user_stats')
      .upsert({
        wallet_id: walletId,
        reputation_score: currentScore + points,
        updated_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to award points:', error);
  }
}

// Initialize agent with default configuration if not exists
export async function initializeAgent() {
  try {
    // Check if config exists
    const { data: existingConfig } = await supabase
      .from('agent_config')
      .select('*')
      .limit(1)
      .single();

    if (!existingConfig) {
      // Insert default configuration with auto-generated UUID
      const { error } = await supabase
        .from('agent_config')
        .insert({
          consensus_threshold: 75,
          min_verifications: 3,
          timeout_hours: 48,
          reward_points: 10,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    }

    return {
      success: true,
      message: 'Agent initialized successfully'
    };
  } catch (error) {
    console.error('Failed to initialize agent:', error);
    throw error;
  }
}

// Update deployVerificationAgent to ensure initialization
export async function deployVerificationAgent(): Promise<GaiaAgent> {
  try {
    await initializeAgent();
    
    // Verify the agent is properly initialized
    const { data: config } = await supabase
      .from('agent_config')
      .select('*')
      .single();

    if (!config) {
      throw new Error('Failed to initialize agent configuration');
    }

    return {
      id: 'verification-agent',
      name: 'NotAIry Verification Agent',
      description: 'Manages note verification using community consensus',
      platforms: ['web'],
      capabilities: ['consensus_verification'],
      status: 'active'
    };
  } catch (error) {
    console.error('Failed to deploy agent:', error);
    return {
      id: 'verification-agent',
      name: 'NotAIry Verification Agent',
      description: 'Failed to initialize agent configuration',
      platforms: ['web'],
      capabilities: ['consensus_verification'],
      status: 'error'
    };
  }
}

// Get agent metrics from Supabase
export async function getAgentMetrics() {
  try {
    // First check if agent config exists and is valid
    const { data: config, error: configError } = await supabase
      .from('agent_config')
      .select('*')
      .single();

    if (configError || !config) {
      throw new Error('Agent configuration not found');
    }

    // Get total verifications with headers
    const { count: totalVerifications } = await supabase
      .from('verifications')
      .select('*', { count: 'exact', head: true });

    // Get verified notes count
    const { count: verifiedNotes } = await supabase
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'verified');

    // Get total notes count
    const { count: totalNotes } = await supabase
      .from('notes')
      .select('*', { count: 'exact', head: true });

    // Get average verification time
    const { data: verifications } = await supabase
      .from('verifications')
      .select('created_at, note:notes(created_at)');

    // Calculate average time between note creation and verification
    let totalTime = 0;
    let count = 0;
    verifications?.forEach(v => {
      if (v.note?.created_at) {
        const verifyTime = new Date(v.created_at).getTime();
        const createTime = new Date(v.note.created_at).getTime();
        totalTime += (verifyTime - createTime) / (1000 * 60 * 60); // Convert to hours
        count++;
      }
    });

    const avgVerificationTime = count > 0 ? totalTime / count : 0;
    const consensusRate = totalNotes > 0 ? (verifiedNotes / totalNotes) * 100 : 0;

    // Calculate consensus for each note
    const { data: notes } = await supabase
      .from('notes')
      .select(`
        id,
        verifications (
          is_verified
        )
      `);

    // Process each note to calculate consensus
    for (const note of notes || []) {
      const verifications = note.verifications || [];
      const totalVerifications = verifications.length;
      const positiveVerifications = verifications.filter(v => v.is_verified).length;
      
      // Update note with calculated consensus
      if (totalVerifications > 0) {
        await supabase
          .from('notes')
          .update({
            consensus: Math.round((positiveVerifications / totalVerifications) * 100)
          })
          .eq('id', note.id);
      }
    }

    // Agent is active if we have valid config and can query the database
    return {
      status: {
        id: 'verification-agent',
        name: 'NotAIry Verification Agent',
        description: 'Manages note verification using community consensus',
        platforms: ['web'],
        capabilities: ['consensus_verification'],
        status: 'active' as const,
        config: {
          consensus_threshold: config.consensus_threshold,
          min_verifications: config.min_verifications,
          timeout_hours: config.timeout_hours,
          reward_points: config.reward_points
        }
      },
      metrics: {
        total_verifications: totalVerifications || 0,
        consensus_rate: Number(consensusRate.toFixed(1)),
        avg_verification_time: Number(avgVerificationTime.toFixed(1))
      }
    };
  } catch (error) {
    console.error('Failed to fetch agent metrics:', error);
    // Return error status if agent config is missing or there's a database error
    return {
      status: {
        id: 'verification-agent',
        name: 'NotAIry Verification Agent',
        description: 'Agent configuration required. Please set up the verification parameters.',
        platforms: ['web'],
        capabilities: ['consensus_verification'],
        status: 'inactive' as const,
        config: null
      },
      metrics: {
        total_verifications: 0,
        consensus_rate: 0,
        avg_verification_time: 0
      }
    };
  }
}

// Function to calculate consensus for a single note
async function calculateNoteConsensus(noteId: string): Promise<number> {
  const { data: verifications } = await supabase
    .from('verifications')
    .select('is_verified')
    .eq('note_id', noteId);

  if (!verifications || verifications.length === 0) {
    return 0;
  }

  const positiveVerifications = verifications.filter(v => v.is_verified).length;
  return Math.round((positiveVerifications / verifications.length) * 100);
}

// Helper function to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
}

// Update the notes endpoint to handle consensus calculation
export async function fetchNotes() {
  try {
    const { data: notes, error } = await supabase
      .from('notes')
      .select(`
        *,
        verifications (
          is_verified,
          wallet_id
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform the data to match the frontend expectations
    const transformedNotes = (notes || []).map((note) => {
      // Calculate consensus
      const verifications = note.verifications || [];
      const totalVerifications = verifications.length;
      const positiveVerifications = verifications.filter(v => v.is_verified).length;
      
      // Calculate consensus percentage
      const consensusValue = totalVerifications > 0
        ? Math.round((positiveVerifications / totalVerifications) * 100)
        : 0;

      return {
        id: note.id,
        type: note.type,
        title: note.title,
        content: note.content,
        status: note.status,
        source_url: note.source_url,
        created_at: note.created_at,
        wallet_id: note.wallet_id,
        consensus: `${consensusValue}%`,
        timestamp: formatRelativeTime(note.created_at),
        verifications: verifications
      };
    });

    return { notes: transformedNotes };
  } catch (error) {
    console.error('Failed to fetch notes:', error);
    throw error;
  }
}

// Submit note for verification using appropriate Gaia service
export async function submitNoteForVerification(noteId: string, content: string, type: string) {
  // TODO: Route to appropriate service based on note type
  const service = type === 'smart-contract' ? CODER_API : CONSENSUS_API;
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    task_id: `task-${Date.now()}`,
    status: 'pending',
    note_id: noteId,
    service
  };
}

// Get verification status from respective service
export async function getVerificationStatus(noteId: string, type: string) {
  // TODO: Get status from appropriate service
  await new Promise(resolve => setTimeout(resolve, 600));
  
  return {
    status: 'in_progress',
    verifications: 2,
    consensus: 0.85,
    service: type === 'smart-contract' ? 'coder' : 'consensus'
  };
}

// Update agent configuration
export async function updateAgentConfig(config: AgentConfig) {
  try {
    // Get existing config ID
    const { data: existingConfig } = await supabase
      .from('agent_config')
      .select('id')
      .limit(1)
      .single();

    if (!existingConfig) {
      throw new Error('No agent configuration found');
    }

    // Update existing configuration
    const { error } = await supabase
      .from('agent_config')
      .update({
        consensus_threshold: config.consensus_threshold,
        min_verifications: config.min_verifications,
        timeout_hours: config.timeout_hours,
        reward_points: config.reward_points,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingConfig.id);

    if (error) throw error;

    return {
      success: true,
      message: 'Agent configuration updated successfully'
    };
  } catch (error) {
    console.error('Failed to update agent config:', error);
    throw error;
  }
}

// Function that runs periodically to process notes
export async function processNotes() {
  const { data: config } = await supabase
    .from('agent_config')
    .select('*')
    .single();

  const { data: pendingNotes } = await supabase
    .from('notes')
    .select(`
      *,
      verifications (*)
    `)
    .eq('status', 'pending');

  for (const note of pendingNotes) {
    const verifications = note.verifications || [];
    const totalVerifications = verifications.length;
    
    // Check if minimum verifications met
    if (totalVerifications >= config.min_verifications) {
      const positiveVerifications = verifications.filter(v => v.is_verified).length;
      const consensusPercentage = (positiveVerifications / totalVerifications) * 100;

      // Check if consensus threshold met
      if (consensusPercentage >= config.consensus_threshold) {
        // Update note status to verified
        await supabase
          .from('notes')
          .update({ status: 'verified' })
          .eq('id', note.id);

        // Award points to verifiers who agreed with consensus
        for (const verification of verifications) {
          if (verification.is_verified) {
            await awardPoints(verification.wallet_id, config.reward_points);
          }
        }
      }
    }

    // Check for timeout
    const noteAge = Date.now() - new Date(note.created_at).getTime();
    const timeoutMs = config.timeout_hours * 60 * 60 * 1000;
    
    if (noteAge > timeoutMs) {
      // Auto-reject if not enough verifications or consensus not met
      await supabase
        .from('notes')
        .update({ status: 'rejected' })
        .eq('id', note.id);
    }
  }
}

// Update the note type definition
export type NoteType = 'character' | 'plot' | 'setting' | 'event';

export interface Note {
  id: string;
  type: NoteType;
  title: string;
  content: string;
  story_arc?: string;
  connected_to?: string;
  sequence_number?: number;
  status: 'pending' | 'verified' | 'rejected';
  wallet_id: string;
  created_at: string;
  updated_at: string;
}

// Update the icons mapping
export const noteTypeIcons = {
  character: `<svg>...</svg>`, // Person icon
  plot: `<svg>...</svg>`,      // Book icon
  setting: `<svg>...</svg>`,   // Map icon
  event: `<svg>...</svg>`      // Timeline icon
};

// Add story-specific functions
export async function connectStoryElements(sourceId: string, targetId: string) {
  const { error } = await supabase
    .from('notes')
    .update({ connected_to: targetId })
    .eq('id', sourceId);
    
  if (error) throw error;
}

export async function updateStorySequence(noteId: string, sequence: number) {
  const { error } = await supabase
    .from('notes')
    .update({ sequence_number: sequence })
    .eq('id', noteId);
    
  if (error) throw error;
}

// Story element types
export type StoryElementType = 'character' | 'plot' | 'setting' | 'event';

// Story element interface
export interface StoryElement {
  id: string;
  type: StoryElementType;
  title: string;
  content: string;
  story_arc?: string;
  connected_to?: string;
  sequence_number?: number;
  source_url?: string;
  status: 'pending' | 'verified' | 'rejected';
  wallet_id: string;
  created_at: string;
  updated_at: string;
  verifications?: Verification[];
}

// Verification interface
export interface Verification {
  id: string;
  note_id: string;
  wallet_id: string;
  is_verified: boolean;
  created_at: string;
}

// Story element icons
export const storyElementIcons = {
  character: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
  plot: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
  setting: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon></svg>`,
  event: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8v4l3 3"></path><circle cx="12" cy="12" r="10"></circle></svg>`
};

// Fetch story elements
export async function fetchStoryElements() {
  try {
    const { data: elements, error } = await supabase
      .from('notes')
      .select(`
        *,
        verifications (
          id,
          wallet_id,
          is_verified,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { elements: elements || [] };
  } catch (error) {
    console.error('Failed to fetch story elements:', error);
    throw error;
  }
}

// Connect story elements
export async function connectElements(sourceId: string, targetId: string) {
  const { error } = await supabase
    .from('notes')
    .update({ connected_to: targetId })
    .eq('id', sourceId);
    
  if (error) throw error;
}

// Update sequence number
export async function updateSequence(elementId: string, sequence: number) {
  const { error } = await supabase
    .from('notes')
    .update({ sequence_number: sequence })
    .eq('id', elementId);
    
  if (error) throw error;
}

// Calculate consensus for an element
export async function calculateConsensus(elementId: string): Promise<number> {
  const { data: verifications } = await supabase
    .from('verifications')
    .select('is_verified')
    .eq('note_id', elementId);

  if (!verifications || verifications.length === 0) {
    return 0;
  }

  const positiveVerifications = verifications.filter(v => v.is_verified).length;
  return Math.round((positiveVerifications / verifications.length) * 100);
} 
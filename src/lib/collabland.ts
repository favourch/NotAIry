import { supabase } from './supabase';

interface Requirement {
  type: 'verification' | 'reputation';
  threshold: number;
}

interface CollabRole {
  id: string;
  name: string;
  requirements: Requirement[];
}

// Initialize roles in Collab.Land
export async function initializeRoles() {
  const roles: CollabRole[] = [
    {
      id: 'verifier',
      name: 'Verifier',
      requirements: [
        {
          type: 'verification',
          threshold: 10 // Number of successful verifications
        }
      ]
    },
    {
      id: 'expert',
      name: 'Domain Expert',
      requirements: [
        {
          type: 'reputation',
          threshold: 1000 // Reputation score
        }
      ]
    }
  ];

  // Store roles in Supabase for reference
  await supabase.from('roles').upsert(
    roles.map(role => ({
      id: role.id,
      name: role.name,
      requirements: role.requirements
    }))
  );

  return roles;
}

// Check and update user roles
export async function updateUserRoles(userId: string) {
  try {
    // Get user stats
    const { data: stats } = await supabase
      .from('user_stats')
      .select('verifications_count, reputation_score')
      .eq('user_id', userId)
      .single();

    if (!stats) {
      throw new Error('User stats not found');
    }

    // Get roles and their requirements
    const { data: roles } = await supabase
      .from('roles')
      .select('*');

    if (!roles) {
      throw new Error('Roles not found');
    }

    // Check which roles the user qualifies for
    const qualifiedRoles = roles.filter(role =>
      role.requirements.every((req: Requirement) => {
        if (req.type === 'verification') {
          return stats.verifications_count >= req.threshold;
        }
        if (req.type === 'reputation') {
          return stats.reputation_score >= req.threshold;
        }
        return false;
      })
    );

    // Update user roles in Supabase
    await supabase
      .from('user_roles')
      .upsert(
        qualifiedRoles.map(role => ({
          user_id: userId,
          role_id: role.id
        }))
      );

    return qualifiedRoles;
  } catch (error) {
    console.error('Failed to update user roles:', error);
    throw error;
  }
}

// Get user's current roles
export async function getUserRoles(userId: string) {
  try {
    const { data: roles } = await supabase
      .from('user_roles')
      .select(`
        role_id,
        roles (
          name,
          requirements
        )
      `)
      .eq('user_id', userId);

    return roles;
  } catch (error) {
    console.error('Failed to get user roles:', error);
    throw error;
  }
} 
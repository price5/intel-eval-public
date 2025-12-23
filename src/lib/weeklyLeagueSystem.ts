export type LeagueTier = 'initiate' | 'thinker' | 'strategist' | 'analyst' | 'prodigy' | 'mastermind';

export interface TierConfig {
  name: string;
  color: string;
  icon: string;
  gradient: string;
}

export const TIER_CONFIG: Record<LeagueTier, TierConfig> = {
  initiate: { 
    name: 'Initiate', 
    color: '#9CA3AF',
    icon: '🌱',
    gradient: 'linear-gradient(135deg, #9CA3AF33, #9CA3AF11)'
  },
  thinker: { 
    name: 'Thinker', 
    color: '#60A5FA',
    icon: '💭',
    gradient: 'linear-gradient(135deg, #60A5FA33, #60A5FA11)'
  },
  strategist: { 
    name: 'Strategist', 
    color: '#A78BFA',
    icon: '♟️',
    gradient: 'linear-gradient(135deg, #A78BFA33, #A78BFA11)'
  },
  analyst: { 
    name: 'Analyst', 
    color: '#F59E0B',
    icon: '📊',
    gradient: 'linear-gradient(135deg, #F59E0B33, #F59E0B11)'
  },
  prodigy: { 
    name: 'Prodigy', 
    color: '#EC4899',
    icon: '⭐',
    gradient: 'linear-gradient(135deg, #EC489933, #EC489911)'
  },
  mastermind: { 
    name: 'Mastermind', 
    color: '#8B5CF6',
    icon: '👑',
    gradient: 'linear-gradient(135deg, #8B5CF633, #8B5CF611)'
  }
};

export const formatTierName = (tier: LeagueTier): string => {
  return TIER_CONFIG[tier].name;
};

export const getTierColor = (tier: LeagueTier): string => {
  return TIER_CONFIG[tier].color;
};

export const getTierIcon = (tier: LeagueTier): string => {
  return TIER_CONFIG[tier].icon;
};
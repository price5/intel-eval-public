import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TIER_CONFIG, LeagueTier } from '@/lib/weeklyLeagueSystem';

interface WeeklyLeagueBadgeProps {
  tier: LeagueTier;
  leagueNumber?: number;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const WeeklyLeagueBadge: React.FC<WeeklyLeagueBadgeProps> = ({ 
  tier, 
  leagueNumber,
  showIcon = true,
  size = 'md' 
}) => {
  const tierConfig = TIER_CONFIG[tier];
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  };

  return (
    <Badge
      className={`font-semibold border-2 ${sizeClasses[size]}`}
      style={{
        backgroundColor: tierConfig.color + '20',
        color: tierConfig.color,
        borderColor: tierConfig.color + '60',
        boxShadow: `0 0 10px ${tierConfig.color}40`
      }}
    >
      {showIcon && <span className="mr-1">{tierConfig.icon}</span>}
      {tierConfig.name}
      {leagueNumber && ` #${leagueNumber}`}
    </Badge>
  );
};
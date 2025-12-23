import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface AchievementCardProps {
  name: string;
  description: string;
  category: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  icon: string;
  earned: boolean;
  earnedAt?: string;
  progress?: number;
  progressMax?: number;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  name,
  description,
  category,
  tier,
  icon,
  earned,
  earnedAt,
  progress,
  progressMax
}) => {
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'from-amber-600 to-amber-800';
      case 'silver': return 'from-gray-400 to-gray-600';
      case 'gold': return 'from-yellow-400 to-yellow-600';
      case 'platinum': return 'from-cyan-400 to-blue-600';
      default: return 'from-gray-500 to-gray-700';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'consistency': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'quality': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'growth': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'community': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'special': return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: earned ? 1.03 : 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`relative overflow-hidden border ${
        earned 
          ? 'bg-card border-white/10' 
          : 'bg-card/50 border-white/5 opacity-60'
      }`}>
        {earned && (
          <div className={`absolute inset-0 bg-gradient-to-br ${getTierColor(tier)} opacity-5`} />
        )}
        
        <CardContent className="p-6 relative">
          <div className="flex items-start gap-4">
            <div className={`text-5xl ${earned ? '' : 'grayscale opacity-40'}`}>
              {earned ? icon : <Lock className="w-12 h-12 text-muted-foreground" />}
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-lg">{name}</h3>
                <Badge className={getCategoryColor(category)} variant="outline">
                  {category}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground">{description}</p>
              
              {earned && earnedAt && (
                <p className="text-xs text-muted-foreground">
                  Earned on {new Date(earnedAt).toLocaleDateString()}
                </p>
              )}
              
              {!earned && progress !== undefined && progressMax !== undefined && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{progress}/{progressMax}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${getTierColor(tier)} transition-all duration-500`}
                      style={{ width: `${(progress / progressMax) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              
              <Badge variant="outline" className={`bg-gradient-to-r ${getTierColor(tier)} text-white border-0 text-xs`}>
                {tier.toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

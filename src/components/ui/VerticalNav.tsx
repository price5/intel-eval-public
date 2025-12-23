import React from 'react';
import { MessageSquare, Mail, BookOpen, ClipboardList, History, Trophy } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type NavItem = 'chat' | 'dm' | 'practice' | 'assessment' | 'history' | 'leaderboard';

interface VerticalNavProps {
  activeItem: NavItem | null;
  onItemClick: (item: NavItem) => void;
  role: 'student' | 'instructor';
  chatUnreadCount?: number;
  dmUnreadCount?: number;
}

const studentNavItems = [
  { id: 'chat' as NavItem, icon: MessageSquare, label: 'Chat', disabled: false, onboardingId: 'onboarding-community' },
  { id: 'dm' as NavItem, icon: Mail, label: 'Direct Messages', disabled: false },
  { id: 'practice' as NavItem, icon: BookOpen, label: 'Practice Mode', disabled: false, onboardingId: 'onboarding-practice-tab' },
  { id: 'assessment' as NavItem, icon: ClipboardList, label: 'Assessment Mode', disabled: false, onboardingId: 'onboarding-assessments-tab' },
  { id: 'history' as NavItem, icon: History, label: 'Assessment History', disabled: false },
  { id: 'leaderboard' as NavItem, icon: Trophy, label: 'Leaderboard', disabled: false, onboardingId: 'onboarding-leaderboard-tab' },
];

const instructorNavItems = [
  { id: 'chat' as NavItem, icon: MessageSquare, label: 'Chat', disabled: false, onboardingId: 'onboarding-community' },
  { id: 'dm' as NavItem, icon: Mail, label: 'Direct Messages', disabled: false },
  { id: 'assessment' as NavItem, icon: ClipboardList, label: 'Assessment Management', disabled: false, onboardingId: 'onboarding-assessments-tab' },
  { id: 'history' as NavItem, icon: History, label: 'Assessment History', disabled: false, onboardingId: 'onboarding-history-tab' },
  { id: 'leaderboard' as NavItem, icon: Trophy, label: 'Class Performance', disabled: false, onboardingId: 'onboarding-leaderboard-tab' },
];

export const VerticalNav: React.FC<VerticalNavProps> = ({ activeItem, onItemClick, role, chatUnreadCount = 0, dmUnreadCount = 0 }) => {
  const navItems = role === 'student' ? studentNavItems : instructorNavItems;

  return (
    <nav className="fixed left-0 top-0 h-screen w-20 bg-card/95 backdrop-blur-md border-r border-border/50 flex flex-col items-center py-6 gap-4 z-40">
      {navItems.map((item) => (
        <Tooltip key={item.id} delayDuration={200}>
          <TooltipTrigger asChild>
            <div className="relative">
              <button
                id={(item as any).onboardingId}
                onClick={() => !item.disabled && onItemClick(item.id)}
                disabled={item.disabled}
                className={cn(
                  'w-14 h-14 rounded-lg flex items-center justify-center transition-all duration-300',
                  'hover:bg-primary/10 hover:scale-105 hover:shadow-md active:scale-95',
                  activeItem === item.id && activeItem !== null && 'bg-primary text-primary-foreground shadow-lg scale-105',
                  item.disabled && 'opacity-40 cursor-not-allowed hover:bg-transparent hover:shadow-none hover:scale-100'
                )}
              >
                <item.icon className="h-6 w-6" />
              </button>
              {item.id === 'chat' && chatUnreadCount > 0 && activeItem !== 'chat' && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center px-1.5 py-0 text-[10px] font-bold animate-scale-in shadow-lg rounded-full"
                >
                  {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                </Badge>
              )}
              {item.id === 'dm' && dmUnreadCount > 0 && activeItem !== 'dm' && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center px-1.5 py-0 text-[10px] font-bold animate-scale-in shadow-lg rounded-full"
                >
                  {dmUnreadCount > 99 ? '99+' : dmUnreadCount}
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium bg-popover/95 backdrop-blur-sm border-border/50">
            {item.label}
            {item.disabled && ' (Coming Soon)'}
            {item.id === 'chat' && chatUnreadCount > 0 && activeItem !== 'chat' && ` (${chatUnreadCount} unread)`}
            {item.id === 'dm' && dmUnreadCount > 0 && activeItem !== 'dm' && ` (${dmUnreadCount} unread)`}
          </TooltipContent>
        </Tooltip>
      ))}
    </nav>
  );
};

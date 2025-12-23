import React from 'react';
import { User, UserCircle, Trophy, TrendingUp, Settings, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SettingsSection } from '@/pages/AccountSettings';

interface SettingsNavProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}

const navItems = [
  { id: 'account' as SettingsSection, icon: User, label: 'My Account' },
  { id: 'profile' as SettingsSection, icon: UserCircle, label: 'Profile' },
  { id: 'preferences' as SettingsSection, icon: Settings, label: 'Preferences' },
  { id: 'achievements' as SettingsSection, icon: Trophy, label: 'Achievements' },
  { id: 'stats' as SettingsSection, icon: TrendingUp, label: 'Stats' },
  { id: 'feedback' as SettingsSection, icon: MessageSquare, label: 'Feedback' },
];

export const SettingsNav: React.FC<SettingsNavProps> = ({ activeSection, onSectionChange }) => {
  return (
    <nav className="w-full lg:w-64 flex-shrink-0">
      <div className="bg-card rounded-lg border border-border/50 p-2">
        <div className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200',
                activeSection === item.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

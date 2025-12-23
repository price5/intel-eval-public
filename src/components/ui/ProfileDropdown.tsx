import React, { useState } from 'react';
import { User, Settings, LogOut, ChevronDown, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useVersion } from '@/contexts/VersionContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProfilePopup } from '../profile/ProfilePopup';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAdminRole } from '@/hooks/useAdminRole';
import { motion, AnimatePresence } from 'framer-motion';

import { UserProfile } from '@/hooks/useProfile';

interface ProfileDropdownProps {
  profile: UserProfile;
  onSignOut: () => void;
  onSettingsClick: () => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ profile, onSignOut, onSettingsClick }) => {
  const navigate = useNavigate();
  const { isAdmin } = useAdminRole();
  const { updateAvailable, isUpdateDismissed } = useVersion();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  
  const showUpdateBadge = updateAvailable && isUpdateDismissed;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleProfileClick = () => {
    setDropdownOpen(false);
    setProfileDialogOpen(true);
  };

  const handleSettingsClick = () => {
    setDropdownOpen(false);
    onSettingsClick();
  };

  const handleAdminClick = () => {
    setDropdownOpen(false);
    navigate('/admin');
  };

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger className="flex items-center gap-2 hover:bg-accent/10 rounded-lg px-3 py-2 transition-all duration-200">
          <div className="relative">
            <Avatar className="h-8 w-8 ring-2 ring-primary/10">
              <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
            {showUpdateBadge && (
              <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-primary rounded-full border-2 border-card animate-pulse" />
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">{profile.username}</span>
            <motion.div
              animate={{ rotate: dropdownOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          </div>
        </DropdownMenuTrigger>
        
        <AnimatePresence>
          {dropdownOpen && (
            <DropdownMenuContent 
              align="end" 
              className="w-56 bg-popover/95 backdrop-blur-sm border-border/50"
              asChild
            >
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <DropdownMenuItem 
                  onClick={handleProfileClick}
                  className="cursor-pointer hover:bg-accent/10 focus:bg-accent/10"
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={handleSettingsClick}
                  className="cursor-pointer hover:bg-accent/10 focus:bg-accent/10"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Account Settings
                </DropdownMenuItem>
                
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator className="bg-border/50" />
                    <DropdownMenuItem 
                      onClick={handleAdminClick}
                      className="cursor-pointer hover:bg-accent/10 focus:bg-accent/10"
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Panel
                    </DropdownMenuItem>
                  </>
                )}
                
                <DropdownMenuSeparator className="bg-border/50" />
                
                <DropdownMenuItem 
                  onClick={onSignOut} 
                  className="text-destructive hover:text-destructive focus:text-destructive hover:bg-destructive/10 focus:bg-destructive/10 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log Out
                </DropdownMenuItem>
              </motion.div>
            </DropdownMenuContent>
          )}
        </AnimatePresence>
      </DropdownMenu>

      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-sm border-border/50">
          <ProfilePopup profile={profile} />
        </DialogContent>
      </Dialog>
    </>
  );
};
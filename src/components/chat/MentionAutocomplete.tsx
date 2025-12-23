import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface User {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
}

interface MentionAutocompleteProps {
  users: User[];
  query: string;
  onSelect: (user: User) => void;
  position: { bottom: number; left: number; width?: number };
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const MentionAutocomplete: React.FC<MentionAutocompleteProps> = ({
  users,
  query,
  onSelect,
  position,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredUsers = users
    .filter(u => 
      u.username.toLowerCase().includes(query.toLowerCase()) ||
      u.full_name.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 8);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (filteredUsers.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredUsers.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        onSelect(filteredUsers[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredUsers, selectedIndex, onSelect]);

  if (filteredUsers.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        style={{ 
          position: 'fixed',
          bottom: position.bottom,
          left: position.left,
          width: position.width ? `${position.width}px` : 'auto',
          zIndex: 10000,
        }}
        className={`rounded-lg border-2 border-border bg-popover/95 backdrop-blur-sm shadow-xl overflow-hidden ${!position.width && 'w-72'}`}
      >
        <div className="px-3 py-2 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Mention User
          </p>
        </div>
        <ScrollArea className="max-h-64">
          {filteredUsers.map((user, index) => (
            <button
              key={user.user_id}
              onClick={() => onSelect(user)}
              className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors ${
                index === selectedIndex 
                  ? 'bg-accent/20' 
                  : 'hover:bg-muted/50'
              }`}
            >
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={user.avatar_url} alt={user.username} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-foreground truncate">
                  {user.username}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {user.full_name}
                </div>
              </div>
            </button>
          ))}
        </ScrollArea>
      </motion.div>
    </AnimatePresence>
  );
};

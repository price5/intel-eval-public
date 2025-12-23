import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { useDirectMessage } from '@/contexts/DirectMessageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MessageItemDMProps {
  username: string;
  userId?: string;
  onContextMenu: (e: React.MouseEvent, userId: string) => void;
  children: React.ReactNode;
}

export const MessageItemDM: React.FC<MessageItemDMProps> = ({
  username,
  userId,
  onContextMenu,
  children,
}) => {
  const { setSelectedRecipient } = useDirectMessage();
  const [contextMenu, setContextMenu] = useState<{ userId: string; rect: DOMRect } | null>(null);

  const handleContextMenu = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (userId) {
      onContextMenu(e, userId);
      return;
    }

    // If no userId provided, look it up by username
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id')
        .ilike('username', username.replace('@', ''))
        .single();

      if (error) throw error;
      if (data) {
        onContextMenu(e, data.user_id);
      }
    } catch (error) {
      console.error('Error finding user:', error);
      toast.error('User not found');
    }
  };

  return (
    <span onContextMenu={handleContextMenu} className="inline">
      {children}
    </span>
  );
};
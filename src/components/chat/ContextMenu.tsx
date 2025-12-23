import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useClickOutside } from '@/hooks/useClickOutside';
import { Copy, Edit2, Reply, Trash2, Smile, Forward } from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  dangerous?: boolean;
}

interface ContextMenuProps {
  anchorRect: DOMRect | null;
  items: MenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ anchorRect, items, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, onClose);

  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!anchorRect) return;
    
    const spacing = 8;
    const menuWidth = 180;
    const menuHeightEstimate = items.length * 40 + 8;

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    // Try to position to the right of anchor first
    let left = anchorRect.right + spacing;
    
    // If it would go off the right edge, position to the left
    if (left + menuWidth > viewportW - spacing) {
      left = anchorRect.left - menuWidth - spacing;
    }
    
    // If still off left edge, clamp to viewport
    if (left < spacing) {
      left = spacing;
    }

    // Position vertically, trying to align with anchor top
    let top = anchorRect.top;
    
    // If it would go off the bottom, position above
    if (top + menuHeightEstimate > viewportH - spacing) {
      top = viewportH - menuHeightEstimate - spacing;
    }
    
    // Ensure not above viewport
    if (top < spacing) {
      top = spacing;
    }

    setPos({ top, left });
  }, [anchorRect, items.length]);

  if (!anchorRect || !pos) return null;

  const iconMap: Record<string, React.ReactNode> = {
    copy: <Copy className="h-3 w-3" />,
    edit: <Edit2 className="h-3 w-3" />,
    reply: <Reply className="h-3 w-3" />,
    delete: <Trash2 className="h-3 w-3" />,
    'add-reaction': <Smile className="h-3 w-3" />,
    forward: <Forward className="h-3 w-3" />,
    'send-dm': <Forward className="h-3 w-3" />,
  };

  return createPortal(
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -4 }}
      transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
      style={{ top: pos.top, left: pos.left, position: 'fixed', zIndex: 99999 }}
      className="min-w-[140px] w-[180px] rounded-lg border border-border/40 bg-card backdrop-blur-md shadow-2xl overflow-hidden"
    >
      <div className="p-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              item.onClick();
              onClose();
            }}
            className={`w-full text-left px-2.5 py-2 rounded-md flex items-center gap-2.5 transition-all duration-200 text-sm font-medium group/menuitem ${
              item.dangerous
                ? 'text-destructive/90 hover:bg-destructive/20 hover:text-destructive active:scale-[0.98]'
                : 'text-foreground/90 hover:bg-accent/90 hover:text-accent-foreground active:scale-[0.98]'
            }`}
          >
            <span className={`flex-shrink-0 transition-transform duration-200 ${!item.dangerous && 'group-hover/menuitem:scale-110'}`}>
              {item.icon || iconMap[item.id]}
            </span>
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </motion.div>,
    document.body
  );
};

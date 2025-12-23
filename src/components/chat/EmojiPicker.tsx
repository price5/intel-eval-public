import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  className?: string;
}

const EMOJI_CATEGORIES = {
  'Smileys & People': [
    '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘',
    '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒',
    '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
    '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐',
    '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢',
    '👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆',
    '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏'
  ],
  'Gestures & Body': [
    '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁', '👅',
    '👄', '💋', '🩸'
  ],
  'Hearts & Emotions': [
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓',
    '💗', '💖', '💘', '💝', '💟', '💌', '💢', '💥', '💫', '💦', '💨', '🕳', '💬', '👁️‍🗨️', '🗨',
    '🗯', '💭', '🤝'
  ],
  'Animals & Nature': [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
    '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌',
    '🌸', '💐', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🌱', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️',
    '🍀', '🍁', '🍂', '🍃', '🪴', '🌙', '⭐', '🌟', '✨', '⚡', '☄️', '💫', '🔥', '💧', '🌊'
  ],
  'Food & Drink': [
    '🍎', '🍏', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝',
    '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐',
    '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭',
    '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜',
    '☕', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊'
  ],
  'Activities & Objects': [
    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍',
    '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸', '🥌',
    '🎯', '🪀', '🎮', '🕹', '🎰', '🎲', '🧩', '🎭', '🎨', '🧵', '🪡', '🧶', '🪢', '🎸', '🎹', '🎺',
    '🎷', '🪗', '🥁', '🪘', '🎤', '🎧', '📻', '🎬', '🎞', '📽', '🎥', '📷', '📸', '💎', '🔮', '🪬'
  ],
  'Symbols': [
    '✅', '❌', '⭐', '🌟', '💫', '💯', '🔥', '⚡', '💡', '🚀', '🎯', '🎉', '🎊', '🎈', '🎀', '🎁',
    '🏆', '🥇', '🥈', '🥉', '🏅', '🎖', '⚠️', '🚸', '🔱', '📛', '🔰', '⭕', '✔️', '☑️', '❎', '➕',
    '➖', '➗', '✖️', '💲', '💱', '™️', '©️', '®️', '〰️', '➰', '➿', '🔚', '🔙', '🔛', '🔝', '🔜'
  ]
};

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, className }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Smileys & People');

  const filteredEmojis = useMemo(() => {
    if (!searchQuery.trim()) {
      return EMOJI_CATEGORIES[selectedCategory as keyof typeof EMOJI_CATEGORIES] || [];
    }

    // Search across all categories
    const allEmojis = Object.values(EMOJI_CATEGORIES).flat();
    // Simple search - just return all if there's a query (emojis don't have searchable text)
    return allEmojis;
  }, [searchQuery, selectedCategory]);

  return (
    <div className={cn(
      "bg-popover/98 backdrop-blur-md border border-border/40 rounded-lg shadow-2xl w-[360px] overflow-hidden",
      className
    )}>
      {/* Search */}
      <div className="p-3 border-b border-border/40">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search emojis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-muted/50 border-border/40 focus-visible:ring-primary/20"
          />
        </div>
      </div>

      {/* Categories */}
      {!searchQuery && (
        <ScrollArea className="h-10 border-b border-border/40">
          <div className="flex gap-1 px-2 py-2">
            {Object.keys(EMOJI_CATEGORIES).map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "h-7 px-3 text-xs font-medium whitespace-nowrap transition-all duration-200",
                  selectedCategory === category 
                    ? "bg-primary/90 text-primary-foreground shadow-sm" 
                    : "hover:bg-accent/80"
                )}
              >
                {category.split(' ')[0]}
              </Button>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Emoji Grid */}
      <ScrollArea className="h-[280px]">
        <div className="p-3 grid grid-cols-8 gap-1">
          {filteredEmojis.map((emoji, index) => (
            <Button
              key={`${emoji}-${index}`}
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 hover:bg-accent/80 hover:scale-110 text-2xl flex items-center justify-center transition-all duration-150 rounded-md"
              onClick={() => onEmojiSelect(emoji)}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

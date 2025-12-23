import React from 'react';

export const InlineTypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center gap-0.5 ml-1.5">
      <span className="w-1 h-1 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
      <span className="w-1 h-1 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
      <span className="w-1 h-1 bg-muted-foreground/50 rounded-full animate-bounce" />
    </div>
  );
};

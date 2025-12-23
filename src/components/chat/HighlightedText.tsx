import React from 'react';

interface HighlightedTextProps {
  text: string;
  highlight: string;
  className?: string;
}

export const HighlightedText: React.FC<HighlightedTextProps> = ({ text, highlight, className = '' }) => {
  if (!highlight.trim()) {
    return <span className={className}>{text}</span>;
  }

  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  
  return (
    <span className={className}>
      {parts.map((part, index) => {
        const isMatch = part.toLowerCase() === highlight.toLowerCase();
        return isMatch ? (
          <mark
            key={index}
            className="bg-yellow-500/30 dark:bg-yellow-400/30 text-foreground font-medium rounded px-0.5"
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        );
      })}
    </span>
  );
};

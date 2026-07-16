import React from 'react';

interface SuggestionButtonsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

const SuggestionButtons: React.FC<SuggestionButtonsProps> = ({ suggestions, onSelect }) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3 mb-2 px-1">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSelect(suggestion)}
          className="text-xs bg-white text-blue-600 border border-blue-600 rounded-full px-3 py-1.5 hover:bg-blue-50 transition-colors shadow-sm"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
};

export default SuggestionButtons;

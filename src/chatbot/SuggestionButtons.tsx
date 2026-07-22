import React from "react";
import { X } from "lucide-react";

interface SuggestionButtonsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  visible: boolean;
  onClose: () => void;
}

const SuggestionButtons: React.FC<SuggestionButtonsProps> = ({
  suggestions,
  onSelect,
  visible,
  onClose,
}) => {
  if (!visible || suggestions.length === 0) return null;

  return (
    <div className="mt-3 mb-2">
      <div className="flex justify-between items-center px-2 mb-2">
        <span className="text-xs font-semibold text-gray-500">
          Suggested Questions
        </span>

        <button
          onClick={onClose}
          className="text-gray-400 cursor-pointer hover:text-red-500 transition"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 px-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelect(suggestion)}
            className="text-xs bg-white text-blue-600 border border-blue-600 rounded-full px-3 py-1.5 hover:bg-blue-50 transition shadow-sm"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestionButtons;
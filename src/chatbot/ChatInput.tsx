import React, { useState } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  onInputFocus?: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onInputFocus,
}) => {
  const [inputValue, setInputValue] = useState("");

  const handleSend = () => {
    if (inputValue.trim()) {
      onSend(inputValue.trim());
      setInputValue("");
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="flex items-center p-3 border-t border-gray-200 bg-white rounded-b-2xl">
      <input
        type="text"
        placeholder="Type a message..."
        className="flex-1 border border-gray-300 cursor-text rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={onInputFocus}
      />

      <button
        onClick={handleSend}
        disabled={!inputValue.trim()}
        className={`ml-2 rounded-full p-2 flex items-center justify-center transition-colors ${
          inputValue.trim()
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5 ml-1"
        >
          <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
        </svg>
      </button>
    </div>
  );
};

export default ChatInput;
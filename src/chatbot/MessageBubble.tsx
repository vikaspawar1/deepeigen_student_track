import React from 'react';
import logo from '../assets/Logo/VectorBlue.svg';

interface MessageBubbleProps {
  sender: 'bot' | 'user';
  text: string;
  studentName?: string;
}

// Converts markdown-style [label](url) into clickable links, keeps everything else as plain text
const renderMessageText = (text: string) => {
  const parts: React.ReactNode[] = [];
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
    <a
      key={key++}
      href={match[2]}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 underline font-medium"
    >
      {match[1]}
    </a>
  );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ sender, text, studentName }) => {
  const isBot = sender === 'bot';

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className={`flex w-full mt-2 space-x-3 max-w-xs ${isBot ? 'mr-auto' : 'ml-auto justify-end'}`}>
      {isBot && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-white flex items-center justify-center p-1 shadow-sm border border-gray-100">
          <img src={logo} alt="DeepEigen Logo" className="w-full h-full object-contain" />
        </div>
      )}
      <div>
        <div className={`p-3 rounded-xl ${isBot ? 'bg-gray-100 text-gray-800 rounded-tl-none' : 'bg-blue-600 text-white rounded-tr-none'}`}>
          <p className="text-sm whitespace-pre-wrap">{renderMessageText(text)}</p>
        </div>
      </div>
      {!isBot && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
          <span className="text-gray-700 text-xs font-bold">{getInitials(studentName)}</span>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
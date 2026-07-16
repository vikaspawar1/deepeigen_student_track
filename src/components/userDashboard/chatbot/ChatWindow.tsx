import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import SuggestionButtons from './SuggestionButtons';
import TypingIndicator from './TypingIndicator';
import ChatInput from './ChatInput';
import logo from '../../../assets/Logo/VectorBlue.svg';

export interface MessageType {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  isSuggestion?: boolean;
}

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  messages: MessageType[];
  isTyping: boolean;
  suggestions: string[];
  onSendMessage: (message: string) => void;
  studentName?: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  isOpen,
  onClose,
  messages,
  isTyping,
  suggestions,
  onSendMessage,
  studentName
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-100 overflow-hidden transform transition-all duration-300 ease-in-out" style={{ height: '500px', maxHeight: '80vh' }}>
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center rounded-t-2xl shrink-0 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-1">
              <img src={logo} alt="DeepEigen Logo" className="w-full h-full object-contain" />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-blue-600 rounded-full"></div>
          </div>
          <div>
            <h3 className="font-bold text-sm">DeepEigen Assistant</h3>
            <p className="text-xs text-blue-100">Online • Ask me anything</p>
          </div>
        </div>
        <button onClick={onClose} className="text-white hover:text-gray-200 focus:outline-none transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages Body */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm my-auto">
            <p>Welcome{studentName ? `, ${studentName}` : ''} 👋</p>
            <p className="mt-1">How can I help you today?</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <MessageBubble key={msg.id} sender={msg.sender} text={msg.text} studentName={studentName} />
        ))}
        
        {isTyping && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions and Input area */}
      <div className="bg-white shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] relative z-10">
        {!isTyping && suggestions.length > 0 && (
          <SuggestionButtons suggestions={suggestions} onSelect={onSendMessage} />
        )}
        <ChatInput onSend={onSendMessage} />
      </div>
    </div>
  );
};

export default ChatWindow;

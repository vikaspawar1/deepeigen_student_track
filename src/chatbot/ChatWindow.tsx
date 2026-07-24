import React, { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import SuggestionButtons from './SuggestionButtons';
import TypingIndicator from './TypingIndicator';
import ChatInput from './ChatInput';
import logo from '../assets/Logo/VectorBlue.svg';

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

  const [showSuggestions, setShowSuggestions] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed bottom-24 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-100 overflow-hidden"
      style={{ height: "500px", maxHeight: "80vh" }}
    >
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
              <img
                src={logo}
                alt="logo"
                className="w-8 h-8 object-contain"
              />
            </div>

            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-blue-600"></div>
          </div>

          <div>
            <h3 className="font-semibold text-sm">
              DeepEigen Assistant
            </h3>
            <p className="text-xs text-blue-100">
              Ask me anything
            </p>
          </div>
        </div>

        <button onClick={onClose} className="text-white hover:text-gray-200 cursor-pointer transition">
          ✕
        </button>
      </div>

      {/* Messages */}

      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">

        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm my-auto">
            <p>
              Welcome{studentName ? `, ${studentName}` : ""} 👋
            </p>

            <p className="mt-1">
              How can I help you today?
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            sender={msg.sender}
            text={msg.text}
            studentName={studentName}
          />
        ))}

        {isTyping && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Footer */}

      <div className="bg-white">

        {!isTyping && (
          <SuggestionButtons
            suggestions={suggestions}
            visible={showSuggestions}
            onClose={() => setShowSuggestions(false)}
            onSelect={(text) => {
              setShowSuggestions(false);
              onSendMessage(text);
            }}
          />
        )}

        <ChatInput
          onSend={(text) => {
            setShowSuggestions(false);
            onSendMessage(text);
          }}
          onInputFocus={() => setShowSuggestions(true)}
        />

      </div>
    </div>
  );
};

export default ChatWindow;
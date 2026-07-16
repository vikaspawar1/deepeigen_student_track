import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatWindow, { type MessageType } from './ChatWindow';
import api from '../../../lib/api';

interface PopupReminder {
  message: string;
  link: string;
}

const ChatWidget: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [studentName, setStudentName] = useState<string>('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Popup queue state
  const [popupReminder, setPopupReminder] = useState<PopupReminder | null>(null);
  const [hovered, setHovered] = useState(false);
  const [remainingReminders, setRemainingReminders] = useState<PopupReminder[]>([]);

  useEffect(() => {
    const initializeChatbot = async () => {
      try {
        // Load history
        const historyRes = await api.get('/api/chatbot/history/');
        const loadedMessages: MessageType[] = historyRes.data.map((msg: any, idx: number) => ({
          id: `hist-${idx}`,
          sender: msg.sender,
          text: msg.text
        }));
       

        // Fetch home data (stats, reminders, suggestions)
        const homeRes = await api.get('/api/chatbot/home/');
        const { student_name, points, reminders, suggested_questions } = homeRes.data;
        
        setStudentName(student_name);
        setSuggestions(suggested_questions || []);

        const initialMessages = [...loadedMessages];

        // Create list of popups: Greeting first, then cycle reminders 2 times
        const popupsList: PopupReminder[] = [];
        
        // Greeting with points
        popupsList.push({
          message: `👋 Hey ${student_name}! Your current score is ${points || 0} / 1000 pts.`,
          link: ''
        });

        if (reminders && reminders.length > 0) {
          setUnreadCount(reminders.length);
          // Cycle reminders 2 times
          for (let c = 0; c < 2; c++) {
            reminders.forEach((r: any) => {
              popupsList.push({
                message: r.message,
                link: r.link || ''
              });
            });
          }
        }

        // Show the first popup after 2 seconds
        if (popupsList.length > 0) {
          setTimeout(() => {
            setPopupReminder(popupsList[0]);
            setRemainingReminders(popupsList.slice(1));
          }, 2000);
        }

        setMessages(initialMessages);
        setHasInitialized(true);
      } catch (error) {
        console.error("Failed to initialize chatbot data:", error);
      }
    };

    if (!hasInitialized) {
      initializeChatbot();
    }
  }, [hasInitialized]);

  // Queue state machine with hover to pause and fresh timeout on mouse leave
  useEffect(() => {
    if (!popupReminder || hovered) return;

    const timer = setTimeout(() => {
      setPopupReminder(null);
      if (remainingReminders.length > 0) {
        const nextTimer = setTimeout(() => {
          setPopupReminder(remainingReminders[0]);
          setRemainingReminders(prev => prev.slice(1));
        }, 3000); // 3 second gap between popups
        return () => clearTimeout(nextTimer);
      }
    }, 5000); // Show for 5 seconds

    return () => clearTimeout(timer);
  }, [popupReminder, hovered, remainingReminders]);

  const handleSendMessage = async (text: string) => {
    const userMsg: MessageType = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const response = await api.post('/api/chatbot/message/', { message: text });
      
      setTimeout(() => {
        setIsTyping(false);
        const botMsg: MessageType = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: response.data.reply
        };
        setMessages(prev => [...prev, botMsg]);
      }, 500);
      
    } catch (error) {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: `bot-err-${Date.now()}`,
        sender: 'bot',
        text: "I'm having trouble connecting to the server. Please try again later."
      }]);
    }
  };

  const toggleChat = () => {
    if (!isOpen && unreadCount > 0) {
      setUnreadCount(0);
    }
    setIsOpen(!isOpen);
  };

  const handlePopupClick = () => {
    if (popupReminder?.link) {
      setPopupReminder(null);
      navigate(popupReminder.link);
    } else {
      setPopupReminder(null);
      setIsOpen(true);
    }
  };

  return (
    <>
      <ChatWindow
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        messages={messages}
        isTyping={isTyping}
        suggestions={suggestions}
        onSendMessage={handleSendMessage}
        studentName={studentName}
      />
      
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-all transform hover:scale-105 z-50 focus:outline-none focus:ring-4 focus:ring-blue-300"
      >
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
            {unreadCount}
          </div>
        )}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {isOpen ? (
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          )}
        </svg>
      </button>

      {!isOpen && popupReminder && (
        <div
          className="fixed bottom-24 right-6 bg-white border border-gray-200 shadow-xl rounded-2xl p-4 w-80 z-50 cursor-pointer transition-none"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={handlePopupClick}
        >
          <div className="relative pr-6">
            <p className="text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">{popupReminder.message}</p>
            {popupReminder.link && (
              <p className="text-xs text-blue-600 font-semibold mt-2">Click to go there →</p>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setPopupReminder(null); }}
              className="absolute top-0 right-0 text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="absolute -bottom-6 right-6 w-4 h-4 bg-white border-b border-r border-gray-200 transform rotate-45"></div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;

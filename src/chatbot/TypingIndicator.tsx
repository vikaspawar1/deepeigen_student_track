import React from 'react';
import logo from '../assets/Logo/VectorBlue.svg';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex w-full mt-2 space-x-3 max-w-xs mr-auto items-end">
      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-white flex items-center justify-center p-1 shadow-sm border border-gray-100">
        <img src={logo} alt="DeepEigen Logo" className="w-full h-full object-contain" />
      </div>
      <div className="p-3 rounded-xl bg-gray-100 rounded-tl-none flex space-x-1 items-center">
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
      </div>
    </div>
  );
};

export default TypingIndicator;

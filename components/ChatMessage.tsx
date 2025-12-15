import React from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`
          relative max-w-[85%] sm:max-w-[75%] px-5 py-3.5 text-base leading-relaxed
          shadow-sm transition-all duration-200
          ${isUser 
            ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' 
            : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm'
          }
        `}
      >
        <div className="whitespace-pre-wrap break-words">
          {message.text}
          {message.isStreaming && (
             <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-slate-400 animate-pulse" />
          )}
        </div>
        
        <div className="flex items-center justify-between gap-4 mt-1.5">
           <div 
            className={`
              text-[10px] opacity-70 
              ${isUser ? 'text-blue-100 text-right ml-auto' : 'text-slate-400 text-left'}
            `}
          >
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
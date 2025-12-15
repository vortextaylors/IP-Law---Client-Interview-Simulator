import React, { useState, useRef, useEffect } from 'react';
import { LoadingState } from '../types';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
  loadingState: LoadingState;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled, loadingState }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input);
      setInput('');
      // Reset height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  // Determine Status Content
  const getStatusContent = () => {
    if (loadingState === LoadingState.ERROR) {
      return (
        <div className="flex items-center gap-2 text-red-600 animate-in fade-in slide-in-from-bottom-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
            <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
          </svg>
          <span className="text-xs font-medium">Connection Error. Please try again.</span>
        </div>
      );
    }
    
    if (loadingState === LoadingState.LOADING) {
      return (
        <div className="flex items-center gap-2 text-blue-600 animate-in fade-in slide-in-from-bottom-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <span className="text-xs font-medium">Character is thinking...</span>
        </div>
      );
    }

    return null; // IDLE
  };

  return (
    <div className="w-full bg-white/90 backdrop-blur-md border-t border-slate-200 px-4 pb-4 pt-2 md:px-6">
      
      {/* Status Bar */}
      <div className="flex justify-center h-5 mb-1">
         {getStatusContent()}
      </div>

      <div className={`
        max-w-3xl mx-auto relative flex items-end gap-2 p-2 
        bg-slate-50 border rounded-3xl transition-all shadow-sm
        border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500
      `}>
        
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Convai..."
          disabled={disabled}
          rows={1}
          spellCheck={true}
          lang="en"
          autoCorrect="on"
          autoCapitalize="sentences"
          autoComplete="on"
          className="flex-1 bg-transparent border-0 focus:ring-0 p-3 text-slate-800 placeholder-slate-400 resize-none max-h-[150px] overflow-y-auto outline-none disabled:opacity-50"
          style={{ minHeight: '44px' }}
        />
        
        {/* Send Button */}
        <button
          onClick={() => handleSubmit()}
          disabled={!input.trim() || disabled}
          className={`
            p-2.5 rounded-full flex-shrink-0 transition-all duration-200 mb-1
            ${!input.trim() || disabled 
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-md'
            }
          `}
          aria-label="Send message"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="currentColor" 
            className="w-5 h-5 translate-x-0.5 -translate-y-0.5"
          >
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </button>
      </div>
      <div className="text-center mt-2">
         <p className="text-xs text-slate-400">
           Convai AI may display inaccurate info, so double-check its responses.
         </p>
      </div>
    </div>
  );
};

export default ChatInput;
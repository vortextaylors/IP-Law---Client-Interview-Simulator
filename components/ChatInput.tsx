import React, { useState, useRef, useEffect } from 'react';
import { LoadingState } from '../types';
import { StudentPersona } from '../services/geminiService';

interface ChatInputProps {
  onSend: (text: string) => void;
  onToggleSimulate: (persona?: StudentPersona) => void;
  isSimulating: boolean;
  disabled: boolean;
  loadingState: LoadingState;
  activePersonaName?: string;
  personas: StudentPersona[];
  onPersonaChange: (persona: StudentPersona) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSend, 
  onToggleSimulate, 
  isSimulating, 
  disabled, 
  loadingState,
  activePersonaName,
  personas,
  onPersonaChange
}) => {
  const [input, setInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input);
      setInput('');
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

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePersonaSelect = (persona: StudentPersona) => {
    onPersonaChange(persona);
    setShowDropdown(false);
    if (!isSimulating) {
      onToggleSimulate(persona);
    }
  };

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
          <span className="text-xs font-medium">Dave is thinking...</span>
        </div>
      );
    }

    if (isSimulating && activePersonaName) {
      return (
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 animate-in fade-in slide-in-from-bottom-1">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
          <span className="text-[10px] font-bold uppercase tracking-wider">Autopilot: {activePersonaName}</span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 pb-4 pt-2 md:px-6 transition-colors duration-300">
      <div className="flex justify-center h-5 mb-1">
         {getStatusContent()}
      </div>

      <div className={`
        max-w-3xl mx-auto relative flex items-end gap-2 p-2 
        bg-slate-50 dark:bg-slate-800 border rounded-3xl transition-all shadow-sm
        border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500
      `}>
        
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isSimulating ? "Autopilot is active..." : "Message Convai..."}
          disabled={disabled || isSimulating}
          rows={1}
          className="flex-1 bg-transparent border-0 focus:ring-0 p-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-none max-h-[150px] outline-none disabled:opacity-50"
          style={{ minHeight: '44px' }}
        />
        
        <div className="flex items-center gap-1.5 px-1.5 pb-1">
          {/* Simulation Split Button */}
          <div className="relative flex items-stretch" ref={dropdownRef}>
            <button
              onClick={() => onToggleSimulate()}
              disabled={loadingState === LoadingState.LOADING}
              className={`
                px-4 py-2.5 rounded-l-full flex items-center gap-2 flex-shrink-0 transition-all duration-300 relative text-sm font-medium border-r border-indigo-200 dark:border-indigo-800
                ${isSimulating 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                  : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50'
                }
                ${loadingState === LoadingState.LOADING ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
              `}
              title={isSimulating ? "Stop Simulation" : "Simulate chat"}
            >
              {isSimulating && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-white border-2 border-indigo-600 rounded-full animate-ping"></span>
              )}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M16.5 6a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v7.5a3 3 0 0 0 3 3v-7.5a1.5 1.5 0 0 1 1.5-1.5h7.5A3 3 0 0 0 16.5 6Z" />
                <path d="M18 7.5a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3h-7.5a3 3 0 0 1-3-3v-7.5a3 3 0 0 1 3-3H18Z" />
              </svg>
              {isSimulating ? 'Stop Simulation' : 'Simulate chat'}
            </button>
            
            {!isSimulating && (
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                disabled={loadingState === LoadingState.LOADING}
                className={`
                  px-2 py-2.5 rounded-r-full flex items-center justify-center transition-all duration-300
                  bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50
                  ${loadingState === LoadingState.LOADING ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
                `}
                title="Select Persona"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`}>
                  <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
              </button>
            )}

            {/* Dropdown Menu */}
            {showDropdown && !isSimulating && (
              <div className="absolute bottom-full right-0 mb-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2">
                <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2">Select Persona</span>
                </div>
                <div className="max-h-60 overflow-y-auto p-1">
                  {personas.map((persona, idx) => (
                    <button
                      key={idx}
                      onClick={() => handlePersonaSelect(persona)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex flex-col gap-0.5"
                    >
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{persona.name}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{persona.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Send Button */}
          <button
            onClick={() => handleSubmit()}
            disabled={!input.trim() || disabled || isSimulating}
            className={`
              p-2.5 rounded-full flex-shrink-0 transition-all duration-200
              ${!input.trim() || disabled || isSimulating
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-md'
              }
            `}
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
      </div>
    </div>
  );
};

export default ChatInput;
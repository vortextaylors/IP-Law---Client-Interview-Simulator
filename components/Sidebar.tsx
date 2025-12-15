import React, { useMemo, useState } from 'react';
import { EmotionState } from '../types';

interface SidebarProps {
  sessionId: string;
  characterName: string;
  characterId: string;
  emotionState?: EmotionState | null;
  topicName: string; // Changed from currentTopic key to display name
  onReturnToMenu: () => void; // New prop to go back
  onRestart: () => void;
  onFinish: () => void;
  onLoadSession: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  sessionId, 
  characterName, 
  characterId, 
  emotionState,
  topicName,
  onReturnToMenu,
  onRestart, 
  onFinish,
  onLoadSession,
  isOpen,
  onClose
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [manualSessionId, setManualSessionId] = useState('');

  // Process emotions for display
  const { dominant, others } = useMemo(() => {
    if (!emotionState) return { dominant: null, others: [] };
    
    // Sort emotions by value descending
    const sorted = Object.entries(emotionState)
      .map(([name, value]) => ({ name, value: Number(value) })) // Ensure value is a number
      .sort((a, b) => b.value - a.value);
    
    // Filter out very low probability emotions (noise)
    const significant = sorted.filter(e => e.value > 0.01);

    if (significant.length === 0) return { dominant: null, others: [] };

    return {
      dominant: significant[0],
      others: significant.slice(1, 4) // Next 3 emotions
    };
  }, [emotionState]);

  // Helper to determine color based on emotion name
  const getEmotionColor = (emotionName: string) => {
    const name = emotionName.toLowerCase();
    if (['angry', 'anger', 'annoyed'].some(k => name.includes(k))) return 'text-rose-600 bg-rose-50 border-rose-100';
    if (['happy', 'joy', 'excited'].some(k => name.includes(k))) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (['sad', 'grief', 'disappointed'].some(k => name.includes(k))) return 'text-blue-600 bg-blue-50 border-blue-100';
    if (['fear', 'scared', 'nervous'].some(k => name.includes(k))) return 'text-purple-600 bg-purple-50 border-purple-100';
    if (['confused', 'puzzled', 'uncertain'].some(k => name.includes(k))) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-slate-700 bg-slate-50 border-slate-100';
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const handleLoadSubmit = () => {
    if (manualSessionId.trim()) {
      onLoadSession(manualSessionId.trim());
      setManualSessionId('');
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`
          fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar Content */}
      <aside 
        className={`
          w-80 bg-white border-l border-slate-200 flex flex-col h-full shrink-0
          fixed inset-y-0 right-0 z-50 shadow-2xl md:shadow-none
          transform transition-transform duration-300 ease-in-out
          md:static md:transform-none md:z-auto
          ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}
      >
        {/* Mobile Header with Close Button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 md:hidden bg-white">
          <h2 className="font-semibold text-slate-800">Session Menu</h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Close menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto">
          
          {/* Header - Desktop */}
          <div className="hidden md:block">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Session Details</h2>
          </div>
          
          <div className="space-y-4">
            {/* Topic Info */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
               <div className="flex items-center justify-between mb-2">
                 <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Current Topic</p>
                 <button 
                   onClick={onReturnToMenu}
                   className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline uppercase tracking-wide"
                 >
                   Change
                 </button>
               </div>
               <p className="text-sm font-semibold text-slate-900">{topicName}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Character Name</p>
              <p className="text-sm font-semibold text-slate-800">{characterName}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Character ID</p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-mono text-slate-600 break-all line-clamp-2">{characterId}</p>
                <button 
                  onClick={() => handleCopy(characterId, 'charId')}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors shrink-0"
                  title="Copy Character ID"
                >
                  {copiedField === 'charId' ? (
                    <span className="text-[10px] font-bold text-emerald-600 block animate-pulse">Copied</span>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12A1.5 1.5 0 0 1 17 6.622V12.5a1.5 1.5 0 0 1-1.5 1.5h-1v-3.379a3 3 0 0 0-.879-2.121L10.5 5.379A3 3 0 0 0 8.379 4.5H7v-1Z" />
                      <path d="M4.5 6A1.5 1.5 0 0 0 3 7.5v9A1.5 1.5 0 0 0 4.5 18h7a1.5 1.5 0 0 0 1.5-1.5v-5.879a1.5 1.5 0 0 0-.44-1.06L9.44 6.439A1.5 1.5 0 0 0 8.378 6H4.5Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center justify-between mb-1">
                 <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Session ID</p>
                 <span className="text-[10px] text-blue-600 font-medium cursor-help" title="Save this ID to resume later">Save this ID</span>
              </div>
              
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-mono text-slate-600 break-all">
                  {sessionId === '-1' ? 'Not Started' : sessionId}
                </p>
                {sessionId !== '-1' && (
                  <button 
                    onClick={() => handleCopy(sessionId, 'sessionId')}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors shrink-0"
                    title="Copy Session ID"
                  >
                    {copiedField === 'sessionId' ? (
                      <span className="text-[10px] font-bold text-emerald-600 block animate-pulse">Copied</span>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12A1.5 1.5 0 0 1 17 6.622V12.5a1.5 1.5 0 0 1-1.5 1.5h-1v-3.379a3 3 0 0 0-.879-2.121L10.5 5.379A3 3 0 0 0 8.379 4.5H7v-1Z" />
                        <path d="M4.5 6A1.5 1.5 0 0 0 3 7.5v9A1.5 1.5 0 0 0 4.5 18h7a1.5 1.5 0 0 0 1.5-1.5v-5.879a1.5 1.5 0 0 0-.44-1.06L9.44 6.439A1.5 1.5 0 0 0 8.378 6H4.5Z" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>
            
            {/* Load Session */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
               <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Resume Session</p>
               <div className="flex gap-2">
                 <input 
                   type="text" 
                   value={manualSessionId}
                   onChange={(e) => setManualSessionId(e.target.value)}
                   placeholder="Enter Session ID"
                   className="w-full min-w-0 bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-md text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                 />
                 <button 
                   onClick={handleLoadSubmit}
                   disabled={!manualSessionId.trim()}
                   className="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 text-xs font-medium rounded-md hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   Load
                 </button>
               </div>
            </div>

            {/* State of Mind - Text Version */}
            {dominant && (
              <div className={`p-4 rounded-xl border ${getEmotionColor(dominant.name)}`}>
                <div className="flex items-center justify-between mb-2">
                   <p className="text-xs font-bold uppercase tracking-wider opacity-70">State of Mind</p>
                </div>
                
                <div className="text-2xl font-bold capitalize mb-1">
                  {dominant.name}
                </div>
                
                {others.length > 0 && (
                   <div className="mt-3 pt-3 border-t border-black/5">
                      <p className="text-[10px] opacity-60 uppercase tracking-wider mb-1">Undertones</p>
                      <div className="flex flex-wrap gap-1.5">
                        {others.map((e) => (
                          <span key={e.name} className="px-2 py-1 bg-white/50 rounded-md text-xs font-medium capitalize">
                            {e.name}
                          </span>
                        ))}
                      </div>
                   </div>
                )}
              </div>
            )}
          </div>

          {/* Restart Button */}
          <div className="mt-2">
            <button
              onClick={onRestart}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Restart Session
            </button>
          </div>
        </div>

        {/* Footer / Finish Button */}
        <div className="p-6 border-t border-slate-100 mt-auto bg-slate-50/50">
          <button
            onClick={onFinish}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 active:transform active:scale-[0.98] transition-all shadow-md hover:shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            Finish Conversation
          </button>
          <p className="text-[10px] text-center text-slate-400 mt-3">
            Ends the session and prepares analysis.
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
import React, { useMemo, useState } from 'react';
import { EmotionState } from '../types';

interface SidebarProps {
  sessionId: string;
  characterName: string;
  characterId: string;
  emotionState?: EmotionState | null;
  topicName: string; 
  onReturnToMenu: () => void; 
  onRestart: () => void;
  onFinish: () => void;
  onLoadSession: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  disabled?: boolean;
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
  onClose,
  disabled = false
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [manualSessionId, setManualSessionId] = useState('');

  const { dominant, others } = useMemo(() => {
    if (!emotionState) return { dominant: null, others: [] };
    const sorted = Object.entries(emotionState)
      .map(([name, value]) => ({ name, value: Number(value) })) 
      .sort((a, b) => b.value - a.value);
    const significant = sorted.filter(e => e.value > 0.01);
    if (significant.length === 0) return { dominant: null, others: [] };
    return {
      dominant: significant[0],
      others: significant.slice(1, 4) 
    };
  }, [emotionState]);

  const getEmotionColor = (emotionName: string) => {
    const name = emotionName.toLowerCase();
    if (['angry', 'anger', 'annoyed'].some(k => name.includes(k))) return 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900';
    if (['happy', 'joy', 'excited'].some(k => name.includes(k))) return 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900';
    if (['sad', 'grief', 'disappointed'].some(k => name.includes(k))) return 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900';
    if (['fear', 'scared', 'nervous'].some(k => name.includes(k))) return 'text-purple-600 bg-purple-50 border-purple-100 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900';
    if (['confused', 'puzzled', 'uncertain'].some(k => name.includes(k))) return 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900';
    return 'text-slate-700 bg-slate-50 border-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
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
      <div 
        className={`
          fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside 
        className={`
          w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full shrink-0
          fixed inset-y-0 right-0 z-50 shadow-2xl md:shadow-none
          transform transition-transform duration-300 ease-in-out
          md:static md:transform-none md:z-auto
          ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 md:hidden bg-white dark:bg-slate-900">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Session Menu</h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto">
          <div className="hidden md:block">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Session Details</h2>
          </div>
          
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
               <div className="flex items-center justify-between mb-2">
                 <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Current Topic</p>
               </div>
               <div className="flex items-center justify-between gap-3">
                 <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">{topicName}</p>
                 {!disabled && (
                    <button 
                      onClick={onReturnToMenu}
                      className="shrink-0 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-sm text-[10px] font-bold text-slate-600 dark:text-slate-200 rounded-md hover:bg-blue-50 dark:hover:bg-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all uppercase tracking-wide flex items-center gap-1"
                    >
                      <span>Change</span>
                    </button>
                 )}
               </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Client Name</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{characterName}</p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-1">
                 <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Session ID</p>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-mono text-slate-600 dark:text-slate-300 break-all">
                  {sessionId === '-1' ? 'Not Started' : sessionId}
                </p>
                {sessionId !== '-1' && (
                  <button 
                    onClick={() => handleCopy(sessionId, 'sessionId')}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-md transition-colors shrink-0"
                  >
                    {copiedField === 'sessionId' ? (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block animate-pulse">Copied</span>
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
            
            {!disabled && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Resume Session</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={manualSessionId}
                    onChange={(e) => setManualSessionId(e.target.value)}
                    placeholder="Enter ID"
                    className="w-full min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-md text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  />
                  <button 
                    onClick={handleLoadSubmit}
                    disabled={!manualSessionId.trim()}
                    className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-200 text-xs font-medium rounded-md hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-50"
                  >
                    Load
                  </button>
                </div>
              </div>
            )}

            {dominant && (
              <div className={`p-4 rounded-xl border ${getEmotionColor(dominant.name)}`}>
                <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2">State of Mind</p>
                <div className="text-2xl font-bold capitalize mb-1">{dominant.name}</div>
                {others.length > 0 && (
                   <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/10">
                      <div className="flex flex-wrap gap-1.5">
                        {others.map((e) => (
                          <span key={e.name} className="px-2 py-1 bg-white/50 dark:bg-black/20 rounded-md text-xs font-medium capitalize">
                            {e.name}
                          </span>
                        ))}
                      </div>
                   </div>
                )}
              </div>
            )}
          </div>

          {!disabled && (
            <div className="mt-2">
              <button
                onClick={onRestart}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Restart Session
              </button>
            </div>
          )}
        </div>

        {!disabled && (
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 mt-auto bg-slate-50/50 dark:bg-slate-900/50">
            <button
              onClick={onFinish}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 dark:bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 dark:hover:bg-blue-700 transition-all shadow-md"
            >
              Finish Conversation
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
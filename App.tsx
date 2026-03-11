import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  analyzeConversation, 
  getConvaiResponse, 
  generateSimulatedUserTurn,
  CONVAI_API_KEY,
  STUDENT_PERSONAS,
  StudentPersona
} from './services/geminiService';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import Sidebar from './components/Sidebar';
import AnalysisResult from './components/AnalysisResult';
import { Message, LoadingState, AnalysisMetrics, EmotionState } from './types';

const SCENARIOS = {
  COPYRIGHT: {
    id: 'copyright',
    topicName: 'Copyright Law',
    characterName: 'Dave',
    characterId: 'c196f8cc-1b74-11f1-86c6-42010a7be02c',
    introText: "---\n⚖️ Practice Scenario: Copyright Infringement\n\nClient Name: Dave\nMatter: Unauthorized Use of Personal Photography and Copyright Claim\nObjective: Gather facts, analyze copyright subsistence, and advise Dave on potential remedies.\n\n---\n\nDave is now ready for your consultation.\n\nStart the role-play by welcoming Dave, introducing yourself, confirming confidentiality, and initiating the fact-gathering process."
  },
  PATENT: {
    id: 'patent',
    topicName: 'Patent Law',
    characterName: 'Luke',
    characterId: '8099b06c-d592-11f0-9ecc-42010a7be027',
    introText: "---\n⚖️ Practice Scenario: Patent Application & Ownership\n\nClient Name: Luke\nMatter: 'Plasafe' Invention - Biodegradable Plastic Solvent\nObjective: Assess patentability, address prior disclosure risks, and determine ownership rights.\n\n---\n\nLuke is waiting for you.\n\nStart the consultation by introducing yourself and asking Luke to elaborate on his invention."
  }
};

const SCENARIO_METADATA = {
  COPYRIGHT: {
    title: "Copyright Infringement",
    description: "Conduct an initial client interview regarding the unauthorized use of a personal photograph.",
    difficulty: "Intermediate",
    focus: ["Fact Gathering", "Applicable Legal Framework", "Infringement Analysis"],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    )
  },
  PATENT: {
    title: "Patent Application & Ownership",
    description: "Advise an engineer on patentability, prior disclosure risks, and employer ownership rights.",
    difficulty: "Advanced",
    focus: ["Applicable Legal Framework", "Employment Law", "Trade Secrets"],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
      </svg>
    )
  }
};

type ScenarioKey = keyof typeof SCENARIOS;

const ThemeToggle = ({ isDark, toggle }: { isDark: boolean, toggle: () => void }) => (
  <button
    onClick={toggle}
    className="p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 rounded-lg transition-colors"
    title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
  >
    {isDark ? (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
      </svg>
    )}
  </button>
);

function App() {
  const [activeScenario, setActiveScenario] = useState<ScenarioKey>('COPYRIGHT');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [sessionId, setSessionId] = useState<string>('-1');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisMetrics, setAnalysisMetrics] = useState<AnalysisMetrics | null>(null);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionState | null>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  
  // Simulation State
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);
  const [activePersona, setActivePersona] = useState<StudentPersona>(STUDENT_PERSONAS[0]);

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!analysisMetrics || isReviewMode) {
        scrollToBottom();
    }
  }, [messages, analysisMetrics, isReviewMode]);

  const startScenario = (key: ScenarioKey) => {
    setActiveScenario(key);
    const randomPersona = STUDENT_PERSONAS[Math.floor(Math.random() * STUDENT_PERSONAS.length)];
    setActivePersona(randomPersona);
    resetConversation(key);
    setIsSessionActive(true);
    setIsAutoSimulating(false);
  };

  const resetConversation = (scenarioKey: ScenarioKey = activeScenario) => {
    const scenario = SCENARIOS[scenarioKey];
    setMessages([
      {
        id: 'init-1',
        role: 'model',
        text: scenario.introText,
        timestamp: new Date(),
      }
    ]);
    setSessionId('-1');
    setLoadingState(LoadingState.IDLE);
    setAnalysisMetrics(null);
    setCurrentEmotion(null);
    setIsAnalyzing(false);
    setIsReviewMode(false);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleRestart = () => {
    if (window.confirm("Restart the session? This will clear the current conversation.")) {
      resetConversation(activeScenario);
    }
  };

  const handleReturnToMenu = () => {
    if (messages.length > 1 && !analysisMetrics && !window.confirm("Return to main menu? Progress will be lost.")) {
      return;
    }
    setIsSessionActive(false);
    setMessages([]);
    setAnalysisMetrics(null);
    setSessionId('-1');
    setLoadingState(LoadingState.IDLE);
    setIsAutoSimulating(false);
    setIsReviewMode(false);
  };

  const handleDownloadAnalysis = () => {
    if (!analysisMetrics) return;
    const scenario = SCENARIOS[activeScenario];
    
    // Create a readable date string for the filename
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-').slice(0, 5);
    const filename = `Analysis_${scenario.topicName.replace(/\s+/g, '_')}_${dateStr}_${timeStr}.txt`;

    const content = `
CONVAI CHAT ANALYSIS REPORT
===========================
Date: ${now.toLocaleString()}
Topic: ${scenario.topicName}
Session ID: ${sessionId}
Character: ${scenario.characterName}

ASSESSMENT
----------
Score: ${analysisMetrics.score} / 40
Level: ${analysisMetrics.performanceLevel}

Summary:
${analysisMetrics.summary?.replace(/•/g, '-')}

Performance Overview:
${analysisMetrics.performanceOverview?.replace(/•/g, '-')}

Score Rationale:
${analysisMetrics.scoreRationale?.replace(/•/g, '-')}

Tone Analysis:
${analysisMetrics.toneAnalysis?.replace(/•/g, '-')}

Issue Addressing:
${analysisMetrics.issueAddressing?.replace(/•/g, '-')}

What to Improve:
${analysisMetrics.improvementSuggestions?.replace(/•/g, '-')}

TRANSCRIPT
----------
${messages.map(m => `[${m.role.toUpperCase()} - ${m.timestamp.toLocaleTimeString()}]: ${m.text}`).join('\n\n')}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEmailAnalysis = () => {
    if (!analysisMetrics) return;
    const scenario = SCENARIOS[activeScenario];
    const subject = encodeURIComponent(`Analysis Report: ${scenario.topicName}`);
    const body = encodeURIComponent(`
Report for ${scenario.topicName}
Session ID: ${sessionId}

Score: ${analysisMetrics.score}/40
Level: ${analysisMetrics.performanceLevel}

Summary:
${analysisMetrics.summary}
    `.trim());
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleSendMessage = useCallback(async (text: string) => {
    const scenario = SCENARIOS[activeScenario];
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoadingState(LoadingState.LOADING);

    try {
      const convaiData = await getConvaiResponse(text, scenario.characterId, CONVAI_API_KEY, sessionId, true);
      if (convaiData) {
        if (convaiData.sessionID) setSessionId(convaiData.sessionID);
        if (convaiData.emotion_scores) setCurrentEmotion(convaiData.emotion_scores);
        
        const characterMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: convaiData.text || "(No response text)",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, characterMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setLoadingState(LoadingState.ERROR);
      setTimeout(() => setLoadingState(LoadingState.IDLE), 3000);
    } finally {
      setLoadingState(prev => prev === LoadingState.ERROR ? prev : LoadingState.IDLE);
    }
  }, [activeScenario, sessionId]);

  const handleSimulateTurn = useCallback(async (persona: StudentPersona = activePersona) => {
    const scenario = SCENARIOS[activeScenario];
    setLoadingState(LoadingState.LOADING);
    try {
      const simResult = await generateSimulatedUserTurn(messages, scenario.introText, persona);
      await handleSendMessage(simResult.text);
      if (simResult.isFinished) {
        setIsAutoSimulating(false);
      }
    } catch (error) {
      console.error("Simulation error:", error);
      setLoadingState(LoadingState.IDLE);
      setIsAutoSimulating(false);
    }
  }, [activeScenario, messages, activePersona, handleSendMessage]);

  const toggleAutoSimulate = (persona?: StudentPersona) => {
    const nextState = !isAutoSimulating;
    setIsAutoSimulating(nextState);
    if (nextState) {
      // If Dave has just spoken OR it's a completely fresh start, trigger the student
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && (lastMsg.role === 'model' || messages.length === 1)) {
        handleSimulateTurn(persona || activePersona);
      }
    }
  };

  // Effect to handle Auto-Simulation Loop
  useEffect(() => {
    if (isAutoSimulating && loadingState === LoadingState.IDLE && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'model') {
        const timer = setTimeout(() => {
          handleSimulateTurn();
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [isAutoSimulating, loadingState, messages, handleSimulateTurn]);

  const handleFinish = async () => {
    setIsAnalyzing(true);
    try {
      const userMsgs = messages.filter(m => m.role === 'user');
      const countWords = (text: string) => text.trim().split(/\s+/).filter(w => w.length > 0).length;
      const totalWords = messages.reduce((acc, m) => acc + countWords(m.text), 0);
      const userWords = userMsgs.reduce((acc, m) => acc + countWords(m.text), 0);
      const aiResults = await analyzeConversation(messages);

      setAnalysisMetrics({
        totalMessages: messages.length,
        userMessages: userMsgs.length,
        characterMessages: messages.length - userMsgs.length,
        totalWords: totalWords,
        userWords: userWords,
        score: aiResults.score || 0,
        performanceLevel: aiResults.performanceLevel || 'N/A',
        summary: aiResults.summary || '',
        performanceOverview: aiResults.performanceOverview || '',
        scoreRationale: aiResults.scoreRationale || '',
        toneAnalysis: aiResults.toneAnalysis || '',
        issueAddressing: aiResults.issueAddressing || '',
        improvementSuggestions: aiResults.improvementSuggestions || '',
        sentiments: aiResults.sentiments || {},
      } as AnalysisMetrics);
    } catch (e) {
      console.error("Analysis failed", e);
      alert("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isSessionActive) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-50 transition-colors duration-300">
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z" />
               </svg>
            </div>
            <h1 className="text-lg font-bold tracking-tight">Legal Client Interview Simulator</h1>
          </div>
          <ThemeToggle isDark={darkMode} toggle={toggleDarkMode} />
        </header>

        <main className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-12 flex flex-col justify-center">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3">Select a Practice Scenario</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Choose a legal matter to begin your interview simulation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {(Object.keys(SCENARIOS) as ScenarioKey[]).map((key) => {
              const meta = SCENARIO_METADATA[key];
              return (
                <div key={key} onClick={() => startScenario(key)} className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 cursor-pointer overflow-hidden relative">
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        {meta.icon}
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800 px-2 py-1 rounded bg-slate-50 dark:bg-slate-800">
                        {meta.difficulty}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{meta.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">{meta.description}</p>
                    <button className="w-full py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all">Start Interview</button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative font-sans transition-colors duration-300">
      {isAnalyzing && (
        <div className="absolute inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-lg shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-slate-700">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Adjudicating Performance...</h3>
          </div>
        </div>
      )}

      <header className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-4 flex items-center justify-between shadow-sm z-30 relative text-slate-800 dark:text-slate-100 transition-colors">
        <div className="flex items-center gap-3">
          <button onClick={handleReturnToMenu} className="w-9 h-9 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm hover:bg-blue-700 transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75" /></svg>
          </button>
          <div className="flex flex-col">
            <h1 className="text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-white">{SCENARIOS[activeScenario].topicName}</h1>
            <span className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-medium">
              {isReviewMode ? 'Review Mode (Read Only)' : 'Client Interview Simulation'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <ThemeToggle isDark={darkMode} toggle={toggleDarkMode} />
            {(!analysisMetrics || isReviewMode) && (
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -mr-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
              </button>
            )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {analysisMetrics && !isReviewMode ? (
          <AnalysisResult 
            metrics={analysisMetrics} 
            characterName={SCENARIOS[activeScenario].characterName} 
            topicName={SCENARIOS[activeScenario].topicName} 
            sessionId={sessionId} 
            onDownload={handleDownloadAnalysis} 
            onEmail={handleEmailAnalysis} 
            onRestart={handleReturnToMenu} 
            onReview={() => setIsReviewMode(true)}
          />
        ) : (
          <>
            <div className="flex-1 flex flex-col min-w-0 relative">
              <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-8 bg-slate-50 dark:bg-slate-950 transition-colors">
                <div className="max-w-3xl mx-auto flex flex-col">
                  {messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}
                  {loadingState === LoadingState.LOADING && (
                      <div className="flex w-full mb-6 justify-start">
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl rounded-tl-sm px-5 py-3.5 shadow-sm">
                              <span className="inline-block w-1.5 h-4 align-middle bg-slate-400 animate-pulse"></span>
                          </div>
                      </div>
                  )}
                  <div ref={messagesEndRef} className="h-4" />
                </div>
              </main>
              
              <footer className="flex-none z-20">
                {isReviewMode ? (
                  <div className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 flex items-center justify-center">
                    <button 
                      onClick={() => setIsReviewMode(false)}
                      className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-md transition-all active:scale-95"
                    >
                      Return to Analysis
                    </button>
                  </div>
                ) : (
                  <ChatInput 
                    onSend={handleSendMessage} 
                    onToggleSimulate={toggleAutoSimulate}
                    isSimulating={isAutoSimulating}
                    disabled={loadingState === LoadingState.LOADING}
                    loadingState={loadingState}
                    activePersonaName={activePersona.name}
                    personas={STUDENT_PERSONAS}
                    onPersonaChange={setActivePersona}
                  />
                )}
              </footer>
            </div>
            
            <Sidebar 
              sessionId={sessionId} characterName={SCENARIOS[activeScenario].characterName} characterId={SCENARIOS[activeScenario].characterId} 
              emotionState={currentEmotion} topicName={SCENARIOS[activeScenario].topicName} 
              onReturnToMenu={handleReturnToMenu} onRestart={handleRestart} onFinish={handleFinish} 
              onLoadSession={() => {}} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} 
              disabled={isReviewMode}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
import React, { useState, useEffect, useRef } from 'react';
import { 
  analyzeConversation, 
  getConvaiResponse, 
  CONVAI_API_KEY
} from './services/geminiService';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import Sidebar from './components/Sidebar';
import AnalysisResult from './components/AnalysisResult';
import { Message, LoadingState, AnalysisMetrics, EmotionState } from './types';

// Scenario Configuration
const SCENARIOS = {
  COPYRIGHT: {
    id: 'copyright',
    topicName: 'Copyright Law',
    characterName: 'Dave',
    characterId: '40d1e4d6-afc2-11f0-9b3c-42010a7be025',
    introText: "---\n⚖️ Practice Scenario: Copyright Infringement\n\nClient Name: Dave\nMatter: Unauthorized Use of Personal Photography and Copyright Claim\nObjective: As the legal consultant, your primary goal is to conduct an effective initial interview. You must establish the attorney-client relationship, gather all necessary facts regarding the creation, sharing, and unauthorized use of the photograph, and assess the potential viability of a copyright infringement claim against Greg.\n\nAssessment Focus: Effective fact-gathering, professionalism, and issue-spotting.\n\n---\n\nDave is now ready for your consultation.\n\nStart the role-play by welcoming Dave, introducing yourself, confirming confidentiality, and initiating the fact-gathering process."
  },
  PATENT: {
    id: 'patent',
    topicName: 'Patent Law',
    characterName: 'Luke',
    characterId: '8099b06c-d592-11f0-9ecc-42010a7be027',
    introText: "---\n⚖️ Practice Scenario: Patent Application & Ownership\n\nClient Name: Luke\nMatter: 'Plasafe' Invention - Biodegradable Plastic Solvent\nObjective: As the legal consultant, you are interviewing Luke, a chemical engineer at Fojip Sdn Bhd who has developed 'Plasafe', a liquid that dissolves plastic. Your objectives are to:\n1. Assess patentability (novelty, inventive step, industrial application).\n2. Address the risks of his prior disclosure to friends and his plan to \"test the market\" before filing.\n3. Determine if his employer, Fojip Sdn Bhd, has a claim to the invention given his use of company resources for failed experiments versus personal resources for the successful one.\n\nAssessment Focus: Fact-gathering on public disclosure and employment terms, and advising on patent strategy vs. trade secrets.\n\n---\n\nLuke is waiting for you.\n\nStart the consultation by introducing yourself and asking Luke to elaborate on his invention and the circumstances of its development."
  }
};

// Metadata for the Selection Screen
const SCENARIO_METADATA = {
  COPYRIGHT: {
    title: "Copyright Infringement",
    description: "Conduct an initial client interview regarding the unauthorized use of a personal photograph.",
    difficulty: "Intermediate",
    focus: ["Fact Gathering", "Copyright Act 1987", "Infringement Analysis"],
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
    focus: ["Patent Act 1983", "Employment Law", "Trade Secrets"],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
      </svg>
    )
  }
};

type ScenarioKey = keyof typeof SCENARIOS;

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

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-save to Local Storage
  useEffect(() => {
    if (isSessionActive && sessionId !== '-1' && messages.length > 0) {
      const storageKey = `convai_chat_${sessionId}`;
      const payload = {
        scenarioId: activeScenario,
        messages: messages,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
    }
  }, [messages, sessionId, activeScenario, isSessionActive]);

  // Auto-scroll to bottom whenever messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!analysisMetrics && isSessionActive) {
        scrollToBottom();
    }
  }, [messages, analysisMetrics, isSessionActive]);

  // Start a specific scenario
  const startScenario = (key: ScenarioKey) => {
    setActiveScenario(key);
    resetConversation(key);
    setIsSessionActive(true);
  };

  // Reset conversation helper
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
    
    // Close sidebar on restart if on mobile
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleRestart = () => {
    if (window.confirm("Are you sure you want to restart the session? This will clear the current conversation.")) {
      resetConversation(activeScenario);
    }
  };

  const handleReturnToMenu = () => {
    if (messages.length > 1 && !window.confirm("Return to main menu? Current progress will be lost unless you saved the session ID.")) {
      return;
    }
    setIsSessionActive(false);
    setMessages([]);
    setAnalysisMetrics(null);
    setSessionId('-1');
    setLoadingState(LoadingState.IDLE);
    setCurrentEmotion(null);
  };

  const handleExitAnalysis = () => {
    // Return to menu without confirmation since analysis is done
    setIsSessionActive(false);
    setMessages([]);
    setAnalysisMetrics(null);
    setSessionId('-1');
    setLoadingState(LoadingState.IDLE);
    setCurrentEmotion(null);
  };

  const handleLoadSession = async (newSessionId: string) => {
    const cleanId = newSessionId.trim();
    if (!cleanId) return;
    
    // 1. Try Local Storage first (Exact visual fidelity)
    const storageKey = `convai_chat_${cleanId}`;
    const savedData = localStorage.getItem(storageKey);
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (parsedData.messages && Array.isArray(parsedData.messages)) {
           
           if (parsedData.scenarioId && SCENARIOS[parsedData.scenarioId as ScenarioKey]) {
             setActiveScenario(parsedData.scenarioId as ScenarioKey);
           }
           
           const restoredMessages = parsedData.messages.map((m: any) => ({
             ...m,
             timestamp: new Date(m.timestamp)
           }));

           setSessionId(cleanId);
           setMessages(restoredMessages);
           setLoadingState(LoadingState.IDLE);
           setAnalysisMetrics(null);
           setIsSessionActive(true); // Activate session view
           if (window.innerWidth < 768) {
             setIsSidebarOpen(false);
           }
           return;
        }
      } catch (e) {
        console.error("Failed to parse local history", e);
      }
    }

    // 2. Fallback: Semantic Recovery from Convai
    const proceed = window.confirm(
        `Full conversation history for Session "${cleanId}" was not found on this device.\n\nAttempt to resume session context from server? (Previous messages will not be visible)`
    );

    if (!proceed) return;

    // Use activeScenario if set, or default to Copyright if loading from menu
    const currentKey = isSessionActive ? activeScenario : 'COPYRIGHT';
    const scenario = SCENARIOS[currentKey];
    
    setSessionId(cleanId);
    setLoadingState(LoadingState.LOADING);
    setIsSessionActive(true); // Activate session view
    
    // Reset view to intro first
    setActiveScenario(currentKey); // Ensure scenario state is set
    setMessages([
      {
        id: 'init-load',
        role: 'model',
        text: scenario.introText,
        timestamp: new Date(),
      },
      {
        id: 'sys-sync',
        role: 'model',
        text: "Verifying Session ID with Convai...",
        timestamp: new Date(),
        isStreaming: true
      }
    ]);
    
    if (window.innerWidth < 768) setIsSidebarOpen(false);

    try {
      // Send a silent system prompt to fetch context
      const contextResponse = await getConvaiResponse(
        "[SYSTEM COMMAND: Resume session. Provide a 1 sentence summary of the previous conversation context.]",
        scenario.characterId,
        CONVAI_API_KEY,
        cleanId,
        false
      );

      if (contextResponse && contextResponse.text) {
        setMessages(prev => {
          // Remove the "Syncing" message
          const filtered = prev.filter(m => m.id !== 'sys-sync');
          return [
            ...filtered,
            {
              id: 'sys-context',
              role: 'model',
              text: `[SESSION RESUMED]: ${contextResponse.text}`,
              timestamp: new Date(),
            }
          ];
        });
        setLoadingState(LoadingState.IDLE);
      } else {
         throw new Error("Invalid response from API");
      }
    } catch (error) {
      console.error("Context retrieval failed", error);
      // Reset logic on failure
      setIsSessionActive(false);
      setMessages([]);
      setSessionId('-1');
      setLoadingState(LoadingState.IDLE);
      
      alert(`Unable to load Session "${cleanId}".\n\nError: The Session ID may be incorrect, expired, or the Convai server is unreachable.`);
    }
  };

  const handleFinish = async () => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
    
    setIsAnalyzing(true);

    try {
      // Basic Stats Calculation
      const userMsgs = messages.filter(m => m.role === 'user');
      const modelMsgs = messages.filter(m => m.role === 'model');
      
      const countWords = (text: string) => text.trim().split(/\s+/).filter(w => w.length > 0).length;
      
      const totalWords = messages.reduce((acc, m) => acc + countWords(m.text), 0);
      const userWords = userMsgs.reduce((acc, m) => acc + countWords(m.text), 0);

      // AI Analysis
      const aiResults = await analyzeConversation(messages);

      const metrics: AnalysisMetrics = {
        totalMessages: messages.length,
        userMessages: userMsgs.length,
        characterMessages: modelMsgs.length,
        totalWords: totalWords,
        userWords: userWords,
        score: aiResults.score || 0,
        performanceLevel: aiResults.performanceLevel || 'N/A',
        summary: aiResults.summary || 'Analysis unavailable.',
        performanceOverview: aiResults.performanceOverview || '',
        scoreRationale: aiResults.scoreRationale || '',
        toneAnalysis: aiResults.toneAnalysis || '',
        issueAddressing: aiResults.issueAddressing || '',
        improvementSuggestions: aiResults.improvementSuggestions || '',
        feedback: aiResults.feedback || '' 
      };

      setAnalysisMetrics(metrics);
    } catch (e) {
      console.error("Failed to analyze", e);
      alert("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadAnalysis = () => {
    if (!analysisMetrics) return;

    const scenario = SCENARIOS[activeScenario];

    const content = `
CONVAI CHAT ANALYSIS REPORT
===========================
Date: ${new Date().toLocaleString()}
Topic: ${scenario.topicName}
Session ID: ${sessionId}
Character: ${scenario.characterName} (${scenario.characterId})

ASSESSMENT
----------
Score: ${analysisMetrics.score} / 40
Level: ${analysisMetrics.performanceLevel}

Summary:
${analysisMetrics.summary}

Performance Overview:
${analysisMetrics.performanceOverview}

Score Rationale:
${analysisMetrics.scoreRationale}

Tone Analysis:
${analysisMetrics.toneAnalysis}

Issue Addressing:
${analysisMetrics.issueAddressing}

What to Improve:
${analysisMetrics.improvementSuggestions}

STATISTICS
----------
Total Messages: ${analysisMetrics.totalMessages}
User Messages: ${analysisMetrics.userMessages}
Character Messages: ${analysisMetrics.characterMessages}
Total Words: ${analysisMetrics.totalWords}
User Words: ${analysisMetrics.userWords}

TRANSCRIPT
----------
${messages.map(m => `[${m.role.toUpperCase()} - ${m.timestamp.toLocaleTimeString()}]: ${m.text}`).join('\n\n')}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-${scenario.topicName.replace(' ', '_')}-${sessionId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEmailAnalysis = () => {
    if (!analysisMetrics) return;
    const scenario = SCENARIOS[activeScenario];

    const subject = encodeURIComponent(`Conversation Analysis - ${scenario.topicName}`);
    const body = encodeURIComponent(`
Here is the analysis of my conversation with ${scenario.characterName} regarding ${scenario.topicName}.

Session ID: ${sessionId}

-- Assessment --
Score: ${analysisMetrics.score}/40
Level: ${analysisMetrics.performanceLevel}

Summary: ${analysisMetrics.summary}

Performance Overview:
${analysisMetrics.performanceOverview}
    `.trim());

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleSendMessage = async (text: string) => {
    const scenario = SCENARIOS[activeScenario];
    
    // 1. Add User Message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoadingState(LoadingState.LOADING);

    try {
      // 2. Call Convai API
      // Note: Passing true for voiceResponse for normal messages
      const convaiData = await getConvaiResponse(text, scenario.characterId, CONVAI_API_KEY, sessionId, true);

      if (convaiData) {
        // Update Session
        if (convaiData.sessionID) {
          setSessionId(convaiData.sessionID);
        }

        // Update Emotions
        if (convaiData.emotion_scores) {
          setCurrentEmotion(convaiData.emotion_scores);
        } else if (convaiData.emotion) {
           setCurrentEmotion(convaiData.emotion);
        } else if (convaiData.emotions) {
           setCurrentEmotion(convaiData.emotions);
        }

        // 3. Add Character Response
        const characterMessage: Message = {
          id: Date.now().toString(),
          role: 'model',
          text: convaiData.text || "(No response text)",
          timestamp: new Date(),
          // Audio removed as per request
        };

        setMessages((prev) => [...prev, characterMessage]);
      } else {
        // Error handling if null returned
        console.error("No data received from Convai");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setLoadingState(LoadingState.ERROR);
      // Wait a bit then clear error state to allow retry
      setTimeout(() => setLoadingState(LoadingState.IDLE), 3000);
    } finally {
      // Only set to idle if not error
      setLoadingState(prev => prev === LoadingState.ERROR ? prev : LoadingState.IDLE);
    }
  };

  const currentScenario = SCENARIOS[activeScenario];

  // --- VIEW: TOPIC SELECTION SCREEN ---
  if (!isSessionActive) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
        
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
             <span>§</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight">Legal Client Interview Simulator</h1>
        </header>

        {/* Main Selection Area */}
        <main className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-12 flex flex-col justify-center">
          
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Select a Practice Scenario</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Choose a legal matter to begin your interview simulation. You will be evaluated on fact-gathering, professionalism, and legal analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {(Object.keys(SCENARIOS) as ScenarioKey[]).map((key) => {
              const meta = SCENARIO_METADATA[key];
              const data = SCENARIOS[key];
              
              return (
                <div 
                  key={key} 
                  onClick={() => startScenario(key)}
                  className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-400 transition-all duration-300 cursor-pointer overflow-hidden relative"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        {meta.icon}
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 border border-slate-100 px-2 py-1 rounded bg-slate-50">
                        {meta.difficulty}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">
                      {meta.title}
                    </h3>
                    <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                      {meta.description}
                    </p>

                    <div className="space-y-3 mb-8">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        <span className="font-medium text-slate-500">Client:</span> 
                        <span className="font-semibold">{data.characterName}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-slate-700">
                         <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 flex-shrink-0"></span>
                         <div>
                           <span className="font-medium text-slate-500 block mb-1">Learning Focus:</span>
                           <div className="flex flex-wrap gap-1.5">
                             {meta.focus.map(tag => (
                               <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded border border-slate-200">
                                 {tag}
                               </span>
                             ))}
                           </div>
                         </div>
                      </div>
                    </div>

                    <button className="w-full py-2.5 bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-lg group-hover:bg-blue-600 group-hover:text-white group-hover:border-transparent transition-all">
                      Start Interview
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center border-t border-slate-200 pt-8">
             <p className="text-sm font-medium text-slate-500 mb-4">Have a previous session ID?</p>
             <div className="flex justify-center gap-2">
                <input 
                  type="text" 
                  placeholder="Paste Session ID" 
                  className="bg-white border border-slate-300 text-slate-800 rounded-lg px-4 py-2 text-sm w-64 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLoadSession((e.target as HTMLInputElement).value);
                  }}
                  id="landing-session-input"
                />
                <button 
                  onClick={() => {
                    const el = document.getElementById('landing-session-input') as HTMLInputElement;
                    handleLoadSession(el.value);
                  }}
                  className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors"
                >
                  Resume
                </button>
             </div>
          </div>

        </main>
      </div>
    );
  }

  // --- VIEW: MAIN APP (CHAT) ---
  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 overflow-hidden relative font-sans">
      
      {/* Loading Overlay */}
      {isAnalyzing && (
        <div className="absolute inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-200 border border-slate-200">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <h3 className="text-xl font-bold text-slate-900">Adjudicating Performance...</h3>
            <p className="text-slate-500 mt-2 text-sm uppercase tracking-wide">Evaluating against rubric</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex-none bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex items-center justify-between shadow-sm z-30 relative text-slate-800">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleReturnToMenu}
            className="w-9 h-9 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm hover:bg-blue-700 transition-colors"
            title="Return to Menu"
          >
             <span>§</span>
          </button>
          <div className="flex flex-col">
            <h1 className="text-base md:text-lg font-bold tracking-tight text-slate-900">{currentScenario.topicName}</h1>
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">Client Interview Simulation</span>
          </div>
        </div>

        {/* Mobile Hamburger Button */}
        {!analysisMetrics && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-2 -mr-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        )}
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {analysisMetrics ? (
          // Analysis Result View
          <AnalysisResult 
            metrics={analysisMetrics}
            characterName={currentScenario.characterName}
            topicName={currentScenario.topicName}
            sessionId={sessionId}
            onDownload={handleDownloadAnalysis}
            onEmail={handleEmailAnalysis}
            onRestart={handleExitAnalysis}
          />
        ) : (
          // Chat View
          <>
            <div className="flex-1 flex flex-col min-w-0 relative">
              <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-8 bg-slate-50">
                <div className="max-w-3xl mx-auto flex flex-col">
                  {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                  ))}
                  {/* Loading indicator */}
                  {loadingState === LoadingState.LOADING && (
                      <div className="flex w-full mb-6 justify-start">
                          <div className="bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm px-5 py-3.5 shadow-sm">
                              <span className="inline-block w-1.5 h-4 align-middle bg-slate-400 animate-pulse"></span>
                          </div>
                      </div>
                  )}
                  <div ref={messagesEndRef} className="h-4" />
                </div>
              </main>

              <footer className="flex-none z-20">
                <ChatInput 
                  onSend={handleSendMessage} 
                  disabled={loadingState === LoadingState.LOADING}
                  loadingState={loadingState}
                />
              </footer>
            </div>

            <Sidebar 
              sessionId={sessionId}
              characterName={currentScenario.characterName}
              characterId={currentScenario.characterId}
              emotionState={currentEmotion}
              topicName={currentScenario.topicName}
              onReturnToMenu={handleReturnToMenu}
              onRestart={handleRestart}
              onFinish={handleFinish}
              onLoadSession={handleLoadSession}
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
import React from 'react';
import { AnalysisMetrics } from '../types';

interface AnalysisResultProps {
  metrics: AnalysisMetrics;
  characterName: string;
  topicName: string;
  sessionId: string;
  onDownload: () => void;
  onEmail: () => void;
  onRestart: () => void;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({
  metrics,
  characterName,
  topicName,
  sessionId,
  onDownload,
  onEmail,
  onRestart,
}) => {
  // Determine color based on score or level if available
  const getLevelColor = (level?: string) => {
    const l = level?.toUpperCase() || '';
    if (l.includes('OUTSTANDING')) return 'text-emerald-700 bg-emerald-50 border-emerald-100';
    if (l.includes('MASTERING')) return 'text-blue-700 bg-blue-50 border-blue-100';
    if (l.includes('DEVELOPING')) return 'text-amber-700 bg-amber-50 border-amber-100';
    if (l.includes('BEGINNING')) return 'text-rose-700 bg-rose-50 border-rose-100';
    return 'text-slate-700 bg-slate-50 border-slate-100';
  };

  const levelColorClass = getLevelColor(metrics.performanceLevel);

  // Helper function to render text as a list if it contains bullet points, or paragraphs
  const renderFormattedContent = (text?: string) => {
    if (!text) return <p className="text-slate-500 italic">No feedback provided.</p>;

    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const looksLikeList = lines.some(line => line.trim().startsWith('•') || line.trim().startsWith('-'));

    if (looksLikeList) {
      return (
        <ul className="space-y-2 mt-2">
          {lines.map((line, index) => {
            const cleanLine = line.replace(/^[•-]\s*/, '').trim();
            if (!cleanLine) return null;
            return (
              <li key={index} className="flex items-start gap-3 text-slate-700 leading-relaxed text-sm md:text-base">
                <span className="mt-2 w-1.5 h-1.5 bg-slate-300 rounded-full flex-shrink-0"></span>
                <span>{cleanLine}</span>
              </li>
            );
          })}
        </ul>
      );
    }
    
    return (
      <div className="text-slate-700 leading-relaxed text-sm md:text-base whitespace-pre-wrap font-sans">
        {text}
      </div>
    );
  };

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-slate-50">
      <div className="min-h-full flex items-center justify-center p-4 md:p-8">
        <div className="max-w-5xl w-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 my-auto">
        
        {/* Header - Clean Style */}
        <div className="bg-white border-b border-slate-100 px-6 py-8 md:px-10 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-slate-900">Performance Evaluation</h2>
          <div className="flex items-center justify-center gap-3 text-slate-500 text-sm">
             <span className="font-medium text-blue-600">{topicName}</span>
             <span className="text-slate-300">•</span>
             <span>Client: {characterName}</span>
          </div>
        </div>

        <div className="p-6 md:p-10 space-y-8 bg-slate-50/50">
            
            {/* 1. Score & Level Section */}
            {(metrics.score !== undefined && metrics.performanceLevel) && (
              <div className="flex flex-col md:flex-row gap-6 items-stretch justify-center">
                
                <div className="flex-1 max-w-sm flex flex-col items-center justify-center p-6 bg-white rounded-lg border border-slate-200 shadow-sm text-center">
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Score</span>
                   <div className="flex items-baseline justify-center">
                       <span className="text-5xl font-bold text-slate-900">{metrics.score}</span>
                       <span className="text-xl text-slate-400 font-medium ml-1">/40</span>
                   </div>
                </div>
                
                <div className={`flex-1 max-w-sm flex flex-col items-center justify-center p-6 rounded-lg border shadow-sm text-center ${levelColorClass}`}>
                    <span className="text-xs font-bold opacity-70 uppercase tracking-wider mb-2">Proficiency Level</span>
                    <span className="text-2xl md:text-3xl font-bold tracking-tight">
                      {metrics.performanceLevel}
                    </span>
                </div>

              </div>
            )}

            {/* 2. Summary & Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Summary Card */}
                {metrics.summary && (
                    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                             <span className="text-blue-600">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                  <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                                </svg>
                             </span>
                            Executive Summary
                        </h3>
                        {renderFormattedContent(metrics.summary)}
                    </div>
                )}
                
                {/* Performance Overview */}
                 {(metrics.performanceOverview || metrics.feedback) && (
                    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <span className="text-blue-600">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path fillRule="evenodd" d="M2.25 13.5a8.25 8.25 0 0 1 8.25-8.25.75.75 0 0 1 .75.75v6.75H18a.75.75 0 0 1 .75.75 8.25 8.25 0 0 1-16.5 0Z" clipRule="evenodd" />
                                    <path fillRule="evenodd" d="M12.75 3a.75.75 0 0 1 .75-.75 8.25 8.25 0 0 1 8.25 8.25.75.75 0 0 1-.75.75h-7.5a.75.75 0 0 1-.75-.75V3Z" clipRule="evenodd" />
                                </svg>
                            </span>
                            Performance Overview
                        </h3>
                         {renderFormattedContent(metrics.performanceOverview || metrics.feedback)}
                    </div>
                )}
            </div>

            {/* 3. Detailed Sections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Score Rationale */}
                 {metrics.scoreRationale && (
                    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                        <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                            <div className="w-1.5 h-4 bg-purple-500 rounded-sm"></div>
                            Rationale
                        </h3>
                        {renderFormattedContent(metrics.scoreRationale)}
                    </div>
                )}

                {/* Tone Analysis */}
                 {metrics.toneAnalysis && (
                    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                        <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                            <div className="w-1.5 h-4 bg-rose-500 rounded-sm"></div>
                            Tone Analysis
                        </h3>
                        {renderFormattedContent(metrics.toneAnalysis)}
                    </div>
                )}
                
                 {/* Issue Addressing */}
                 {metrics.issueAddressing && (
                    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                        <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                            <div className="w-1.5 h-4 bg-emerald-500 rounded-sm"></div>
                            Issue Addressing
                        </h3>
                        {renderFormattedContent(metrics.issueAddressing)}
                    </div>
                )}
            </div>

            {/* 4. Improvement Suggestions */}
            {metrics.improvementSuggestions && (
                <div className="bg-amber-50 p-6 md:p-8 rounded-lg border border-amber-100">
                    <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-amber-600">
                          <path d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z" />
                        </svg>
                        Areas for Improvement
                    </h3>
                    <div className="text-amber-900/80">
                      {renderFormattedContent(metrics.improvementSuggestions)}
                    </div>
                </div>
            )}


            {/* 5. Basic Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white rounded-lg p-4 border border-slate-200">
                <div className="text-center">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Exchanges</span>
                    <span className="block text-xl font-bold text-slate-800">{metrics.totalMessages}</span>
                </div>
                 <div className="text-center border-l border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Student Inputs</span>
                    <span className="block text-xl font-bold text-slate-800">{metrics.userMessages}</span>
                </div>
                 <div className="text-center border-l border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Words</span>
                    <span className="block text-xl font-bold text-slate-800">{metrics.totalWords}</span>
                </div>
                 <div className="text-center border-l border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Student Words</span>
                    <span className="block text-xl font-bold text-slate-800">{metrics.userWords}</span>
                </div>
            </div>

            {/* Actions Footer */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-4">
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button
                    onClick={onDownload}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-all shadow-sm w-full sm:w-auto"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Download
                    </button>
                    <button
                    onClick={onEmail}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-all shadow-sm w-full sm:w-auto"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                    Email
                    </button>
                </div>
                
                <button
                    onClick={onRestart}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all shadow-sm"
                >
                    New Session
                </button>
            </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResult;
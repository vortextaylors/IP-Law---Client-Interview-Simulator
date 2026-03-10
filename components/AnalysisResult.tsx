import React, { useState } from 'react';
import { AnalysisMetrics } from '../types';

interface AnalysisResultProps {
  metrics: AnalysisMetrics;
  characterName: string;
  topicName: string;
  sessionId: string;
  onDownload: () => void;
  onEmail: () => void;
  onRestart: () => void;
  onReview: () => void;
}

interface ExpandableCardProps {
  title: string;
  content?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'amber';
  accentColor?: string;
  isSmall?: boolean;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

const ExpandableCard: React.FC<ExpandableCardProps> = ({ 
  title, 
  content, 
  icon, 
  variant = 'default',
  accentColor,
  isSmall = false,
  sentiment = 'neutral'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!content) return null;

  const getSentimentIcon = () => {
    switch (sentiment) {
      case 'positive':
        return (
          <div className="flex items-center gap-1 px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 animate-in fade-in zoom-in duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 md:w-4 md:h-4">
              <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm3.5 6.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM6.5 8a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm3.5 6.5c-2.33 0-4.31-1.46-5.11-3.5a.75.75 0 0 1 1.41-.51c.56 1.42 1.93 2.51 3.7 2.51s3.14-1.09 3.7-2.51a.75.75 0 0 1 1.41.51c-.8 2.04-2.78 3.5-5.11 3.5Z" />
            </svg>
            <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-wider">Positive</span>
          </div>
        );
      case 'negative':
        return (
          <div className="flex items-center gap-1 px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800 animate-in fade-in zoom-in duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 md:w-4 md:h-4">
              <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm.75 11h-1.5v-1.5h1.5V13Zm0-3h-1.5V6h1.5v4Z" />
            </svg>
            <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-wider">Warning</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 md:w-4 md:h-4">
              <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16ZM6.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm7 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3ZM10 14.5c-1.5 0-2.5-1-2.5-1h5s-1 1-2.5 1Z" />
            </svg>
            <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-wider">Neutral</span>
          </div>
        );
    }
  };

  const renderFormattedContent = (text: string) => {
    const lines = text.split(/(?:\n|(?=[•\*-]\s))/).map(l => l.trim()).filter(line => line.length > 0);
    
    return (
      <ul className="space-y-2.5 md:space-y-3 mt-3 md:mt-4 text-left list-none">
        {lines.map((line, index) => {
          const cleanLine = line.replace(/^[•\*-]\s*/, '').trim();
          if (!cleanLine) return null;
          return (
            <li key={index} className="flex items-start gap-2.5 md:gap-3 text-slate-700 dark:text-slate-300 leading-relaxed text-xs md:text-sm animate-in fade-in slide-in-from-top-1 duration-200" style={{ animationDelay: `${index * 40}ms` }}>
              <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${sentiment === 'positive' ? 'bg-emerald-400' : sentiment === 'negative' ? 'bg-rose-400' : 'bg-slate-300 dark:bg-slate-600'}`}></span>
              <span className="flex-1 text-left">{cleanLine}</span>
            </li>
          );
        })}
      </ul>
    );
  };

  const cardClasses = variant === 'amber' 
    ? 'bg-amber-50 dark:bg-[#2F2513] border-amber-100 dark:border-[#503D1E] hover:bg-amber-100/50 dark:hover:bg-[#3A2E18]'
    : 'bg-white dark:bg-[#1E2532] border-slate-200 dark:border-transparent hover:border-blue-300 dark:hover:border-[#2A3441]';

  const titleSize = isSmall ? 'text-xs md:text-sm' : 'text-sm md:text-base';

  return (
    <div 
      onClick={() => setIsExpanded(!isExpanded)}
      className={`
        ${cardClasses} ${isExpanded ? 'p-3 md:p-5' : 'p-2.5 md:p-4'} rounded-xl md:rounded-2xl border shadow-sm transition-all duration-300 cursor-pointer group select-none text-left
        ${isExpanded ? 'ring-2 ring-blue-500/20' : ''}
      `}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 md:gap-3">
            <h3 className={`${titleSize} font-bold ${variant === 'amber' ? 'text-amber-900 dark:text-amber-500' : 'text-slate-900 dark:text-white'} flex items-center gap-1.5 md:gap-2`}>
              {accentColor && <div className={`w-1 h-3 md:w-1.5 md:h-4 ${accentColor} rounded-sm`}></div>}
              {icon && <span className={`w-4 h-4 md:w-5 md:h-5 ${variant === 'amber' ? 'text-amber-600 dark:text-amber-500' : 'text-blue-600 dark:text-blue-400'}`}>{icon}</span>}
              {title}
            </h3>
            {getSentimentIcon()}
          </div>
        </div>

        <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 md:w-5 md:h-5 text-slate-400">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {isExpanded && renderFormattedContent(content)}
    </div>
  );
};

const AnalysisResult: React.FC<AnalysisResultProps> = ({
  metrics,
  characterName,
  topicName,
  sessionId,
  onDownload,
  onEmail,
  onRestart,
  onReview
}) => {
  const getLevelColor = (level?: string) => {
    const l = level?.toUpperCase() || '';
    if (l.includes('OUTSTANDING')) return 'text-emerald-700 bg-emerald-50 border-emerald-100 dark:bg-[#132F20] dark:text-emerald-400 dark:border-[#1E5030]';
    if (l.includes('MASTERING')) return 'text-blue-700 bg-blue-50 border-blue-100 dark:bg-[#131B2F] dark:text-[#3B82F6] dark:border-[#1E2D50]';
    if (l.includes('DEVELOPING')) return 'text-amber-700 bg-amber-50 border-amber-100 dark:bg-[#2F2513] dark:text-amber-400 dark:border-[#503D1E]';
    if (l.includes('BEGINNING')) return 'text-rose-700 bg-rose-50 border-rose-100 dark:bg-[#2F1313] dark:text-rose-400 dark:border-[#501E1E]';
    return 'text-slate-700 bg-slate-50 border-slate-100 dark:bg-[#1E2532] dark:text-slate-300 dark:border-[#2A3441]';
  };

  const levelColorClass = getLevelColor(metrics.performanceLevel);
  const sentiments = metrics.sentiments || {};

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-slate-50 dark:bg-[#0B0F19] transition-colors">
      <div className="min-h-full flex items-center justify-center p-4 md:p-8">
        <div className="max-w-4xl w-full bg-white dark:bg-[#0B0F19] rounded-2xl shadow-lg border border-slate-200 dark:border-transparent overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 my-auto">
        
        <div className="bg-white dark:bg-[#0B0F19] border-b border-slate-100 dark:border-[#1E2532] px-4 py-4 md:px-10 md:py-8 text-center">
          <h2 className="text-xl md:text-3xl font-bold mb-1.5 md:mb-2 text-slate-900 dark:text-white">Performance Evaluation</h2>
          <div className="flex items-center justify-center gap-2 md:gap-3 text-slate-500 dark:text-slate-400 text-xs md:text-sm">
             <span className="font-medium text-blue-600 dark:text-blue-400">{topicName}</span>
             <span className="text-slate-300 dark:text-slate-600">•</span>
             <span>Client: {characterName}</span>
          </div>
        </div>

        <div className="p-4 md:p-10 space-y-4 md:space-y-6 bg-slate-50/50 dark:bg-[#0B0F19]">
            
            {(metrics.score !== undefined && metrics.performanceLevel) && (
              <div className="flex flex-row gap-3 md:gap-6 items-stretch justify-center">
                <div className="w-1/3 md:flex-1 max-w-sm flex flex-col items-center justify-center p-3 md:p-6 bg-white dark:bg-[#1E2532] rounded-xl md:rounded-2xl border border-slate-200 dark:border-[#2A3441] shadow-sm text-center">
                   <span className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1 md:mb-2">Score</span>
                   <div className="flex items-baseline justify-center">
                       <span className="text-2xl md:text-5xl font-bold text-slate-900 dark:text-white">{metrics.score}</span>
                       <span className="text-xs md:text-xl text-slate-400 dark:text-slate-500 font-medium ml-0.5 md:ml-1">/40</span>
                   </div>
                </div>
                
                <div className={`w-2/3 md:flex-1 max-w-sm flex flex-col items-center justify-center p-3 md:p-6 rounded-xl md:rounded-2xl border shadow-sm text-center ${levelColorClass}`}>
                    <span className="text-[10px] md:text-xs font-bold opacity-70 uppercase tracking-wider mb-1 md:mb-2">Proficiency Level</span>
                    <span className="text-sm sm:text-lg md:text-3xl font-bold tracking-tight">
                      {metrics.performanceLevel}
                    </span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <ExpandableCard 
                title="Executive Summary"
                content={metrics.summary}
                sentiment={sentiments.summary}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                  </svg>
                }
              />
              
              <ExpandableCard 
                title="Performance Overview"
                content={metrics.performanceOverview || metrics.feedback}
                sentiment={sentiments.performanceOverview}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M2.25 13.5a8.25 8.25 0 0 1 8.25-8.25.75.75 0 0 1 .75.75v6.75H18a.75.75 0 0 1 .75.75 8.25 8.25 0 0 1-16.5 0Z" clipRule="evenodd" />
                      <path fillRule="evenodd" d="M12.75 3a.75.75 0 0 1 .75-.75 8.25 8.25 0 0 1 8.25 8.25.75.75 0 0 1-.75.75h-7.5a.75.75 0 0 1-.75-.75V3Z" clipRule="evenodd" />
                  </svg>
                }
              />

              <ExpandableCard 
                title="Rationale"
                content={metrics.scoreRationale}
                sentiment={sentiments.scoreRationale}
                accentColor="bg-purple-500"
              />
              <ExpandableCard 
                title="Tone Analysis"
                content={metrics.toneAnalysis}
                sentiment={sentiments.toneAnalysis}
                accentColor="bg-rose-500"
              />
              <ExpandableCard 
                title="Issue Addressing"
                content={metrics.issueAddressing}
                sentiment={sentiments.issueAddressing}
                accentColor="bg-emerald-500"
              />

              <ExpandableCard 
                variant="amber"
                title="Areas for Improvement"
                content={metrics.improvementSuggestions}
                sentiment={sentiments.improvementSuggestions}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z" />
                  </svg>
                }
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-4 bg-white dark:bg-[#1E2532] rounded-2xl p-3 md:p-4 border border-slate-200 dark:border-transparent">
                <div className="text-center">
                    <span className="block text-[8px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Total Exchanges</span>
                    <span className="block text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100">{metrics.totalMessages}</span>
                </div>
                 <div className="text-center border-l border-slate-100 dark:border-[#2A3441]">
                    <span className="block text-[8px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Student Inputs</span>
                    <span className="block text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100">{metrics.userMessages}</span>
                </div>
                 <div className="text-center border-l border-slate-100 dark:border-[#2A3441]">
                    <span className="block text-[8px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Total Words</span>
                    <span className="block text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100">{metrics.totalWords}</span>
                </div>
                 <div className="text-center border-l border-slate-100 dark:border-[#2A3441]">
                    <span className="block text-[8px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Student Words</span>
                    <span className="block text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100">{metrics.userWords}</span>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-between items-center pt-2 md:pt-4">
                <div className="flex flex-col sm:flex-row gap-2 md:gap-3 w-full sm:w-auto">
                    <button
                      onClick={onDownload}
                      className="flex items-center justify-center gap-2 px-4 py-2 md:px-6 md:py-2.5 bg-white dark:bg-[#1E2532] border border-slate-300 dark:border-transparent text-slate-700 dark:text-slate-200 text-xs md:text-sm font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-[#2A3441] transition-all shadow-sm w-full sm:w-auto"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Download
                    </button>
                    <button
                      onClick={onEmail}
                      className="flex items-center justify-center gap-2 px-4 py-2 md:px-6 md:py-2.5 bg-white dark:bg-[#1E2532] border border-slate-300 dark:border-transparent text-slate-700 dark:text-slate-200 text-xs md:text-sm font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-[#2A3441] transition-all shadow-sm w-full sm:w-auto"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                    Email
                    </button>
                    <button
                      onClick={onReview}
                      className="flex items-center justify-center gap-2 px-4 py-2 md:px-6 md:py-2.5 bg-slate-100 dark:bg-[#1E2532] border border-slate-300 dark:border-transparent text-slate-700 dark:text-slate-200 text-xs md:text-sm font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-[#2A3441] transition-all shadow-sm w-full sm:w-auto"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Review Chat
                    </button>
                </div>
                
                <button
                    onClick={onRestart}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 md:px-6 md:py-2.5 bg-blue-600 text-white text-xs md:text-sm font-medium rounded-xl hover:bg-blue-700 transition-all shadow-sm"
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
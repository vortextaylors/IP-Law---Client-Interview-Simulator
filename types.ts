export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
  audioUrl?: string;
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  ERROR = 'ERROR',
}

export type EmotionState = Record<string, number>;

export interface AnalysisMetrics {
  totalMessages: number;
  userMessages: number;
  characterMessages: number;
  totalWords: number;
  userWords: number;
  score?: number;
  performanceLevel?: string;
  summary?: string;
  performanceOverview?: string;
  scoreRationale?: string;
  toneAnalysis?: string;
  issueAddressing?: string;
  improvementSuggestions?: string;
  sentiments?: Record<string, 'positive' | 'neutral' | 'negative'>;
  feedback?: string; 
}
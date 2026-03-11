import { GoogleGenAI, Type } from "@google/genai";
import { Message, AnalysisMetrics } from '../types';

export const CONVAI_API_KEY = '7786d57374209997fbe431eea8181a46';
export const CHARACTER_ID = 'c196f8cc-1b74-11f1-86c6-42010a7be02c';

// Initialize Gemini for Analysis and Simulation
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ConvaiResponse {
  character_id: string;
  sessionID: string;
  text: string;
  audio?: string;
  emotion_scores?: Record<string, number>;
  emotion?: Record<string, number>;
  emotions?: Record<string, number>;
}

export type StudentPersona = {
  name: string;
  description: string;
  traits: string;
  greetingStyle: string;
};

export const STUDENT_PERSONAS: StudentPersona[] = [
  {
    name: "Alex (Professional Associate)",
    description: "Highly structured, polished, and knowledgeable.",
    traits: "Uses precise legal terminology, cites relevant Malaysian laws correctly (e.g., Copyright Act 1987, Patents Act 1983), maintains professional distance, focuses on legal procedure, and speaks with a calm and confident cadence.",
    greetingStyle: "Good morning. I'm Alex. Thank you for coming in today. Could you please start by explaining your case to me?"
  },
  {
    name: "Jordan (Humble Junior)",
    description: "A junior legal advocate who consistently gets the law wrong but is very humble and convincing.",
    traits: "Cites the correct and relevant real-world laws, but consistently mistakes the year of the act or the specific section numbers. Never invents new or fictional laws. They stubbornly stick to these incorrect details throughout the entire conversation without ever correcting themselves. They are extremely humble, polite, and present their arguments in a highly convincing and articulate manner despite these factual errors.",
    greetingStyle: "Hello, I'm Jordan. Thank you so much for taking the time to meet with me. Could you please start by explaining your case to me?"
  },
  {
    name: "Casey (Inexperienced Advocate)",
    description: "Unprofessional, very inexperienced, but overly eager to take the case.",
    traits: "Uses informal language, lacks legal structure, doesn't know the relevant laws, asks irrelevant questions, but is extremely eager to get hired and take on the case regardless of their lack of knowledge.",
    greetingStyle: "Hey, I'm Casey. I totally want to take this case on. Could you start by explaining your case to me?"
  }
];

export async function getConvaiResponse(
  userInput: string, 
  characterId: string, 
  apiKey: string, 
  sessionId: string,
  voiceResponse: boolean = true
): Promise<ConvaiResponse | null> {
  const url = 'https://api.convai.com/character/getResponse';

  const formData = new FormData();
  formData.append('userText', userInput);
  formData.append('charID', characterId);
  formData.append('sessionID', sessionId);
  formData.append('voiceResponse', voiceResponse.toString());

  const options = {
    method: 'POST',
    headers: {
      'CONVAI-API-KEY': apiKey,
    },
    body: formData,
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching from Convai API:', error);
    return null;
  }
}

/**
 * Generates a simulated student turn to test the conversation flow.
 * Returns both the text and a flag indicating if the student wants to finish.
 */
export async function generateSimulatedUserTurn(
  messages: Message[], 
  scenarioContext: string,
  persona: StudentPersona
): Promise<{ text: string; isFinished: boolean }> {
  // Filter out the initial system instructions/intro from the history seen by the AI
  const chatHistory = messages.filter(m => m.id !== 'init-1');
  
  const transcript = chatHistory
    .map(m => `${m.role === 'user' ? 'Student' : 'Client'}: ${m.text}`)
    .join('\n\n');

  const prompt = `
    You are a REALISTIC Law Student performing a first-time legal interview with a client.
    Current Scenario: ${scenarioContext}
    
    Student Name: ${persona.name}
    Communication Style: ${persona.traits}
    Greeting/Intro Style: ${persona.greetingStyle}
    
    History of Conversation:
    ${transcript || "[This is the very first time you are meeting the client]"}
    
    GUIDELINES FOR REALISM:
    1. BE HUMAN: Do not sound like a computer reading a list. Use conversational transitions (e.g., "I see," "That makes sense," "Before we go further...").
    2. FIRST MEETING: If the history is empty or short, focus on introducing yourself and making the client comfortable before grilling them for facts.
    3. STAY IN CHARACTER: If you are the "Fresh Graduate," be slightly eager/nervous. If you are "Empathetic," show genuine care.
    4. DON'T RUSH: Ask one or two related questions at a time. Listen to the client.
    
    COMPLETION CHECKLIST (Only finish if ALL are true):
    - You've gathered all relevant facts (dates, documents, proof).
    - You've explained the legal path forward.
    - You've proposed a specific action (e.g., Cease & Desist, Patent Filing).
    - The client has explicitly agreed to the plan.
    
    Return a JSON object:
    {
      "text": "Your realistic conversational response",
      "isFinished": boolean
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            isFinished: { type: Type.BOOLEAN }
          },
          required: ['text', 'isFinished']
        }
      }
    });
    
    const result = JSON.parse(response.text || '{"text": "I see. Let\'s continue.", "isFinished": false}');
    return result;
  } catch (error) {
    console.error("Simulation error:", error);
    return { text: "I understand. Can you tell me more about that?", isFinished: false };
  }
}

// -- Analysis Service (Gemini) --

export async function analyzeConversation(messages: Message[]): Promise<Partial<AnalysisMetrics>> {
  const transcript = messages
    .map(m => `${m.role === 'user' ? 'Student (User)' : 'Client (Dave)'}: ${m.text}`)
    .join('\n\n');

  const prompt = `
    You are an expert legal instructor evaluating a law student's interview performance.
    
    CRITICAL FORMATTING INSTRUCTIONS:
    - ALWAYS use bullet points (•) for EVERY sentence in the text fields.
    - Keep bullet points concise.
    - Classify the sentiment of each section as "positive", "neutral", or "negative".
    - IMPORTANT: When providing feedback, explicitly QUOTE the student's exact words from the transcript to provide concrete examples of what they did well or poorly. Use quotation marks for these references (e.g., "You said: '...'").
    
    CRITICAL LEGAL CONTEXT & ASSESSMENT CRITERIA:
    - The evaluation of legal concepts, issue addressing, and legal application MUST be strictly based on the laws of MALAYSIA.
    - DO NOT refer to or evaluate based on laws from other countries (e.g., US, UK, Australia) unless explicitly relevant to a comparative analysis requested by the client (which is rare).
    - STRICT CITATION CHECK: You MUST verify if the student explicitly cited the relevant Malaysian statutes by name (e.g., "Copyright Act 1987", "Patents Act 1983").
    - Do NOT assume the student knows or mentioned the law if they only gave general legal advice.
    - If the student did not explicitly name the statute or explain the law in detail, you MUST point this out as a major area for improvement and deduct points.
    - Only credit the student for legal application if they actually mention the law in detail and apply it correctly.
    
    Return a JSON object:
    - score: 0-40.
    - performanceLevel: "OUTSTANDING", "MASTERING", "DEVELOPING", or "BEGINNING".
    - summary: Executive summary in bullet points.
    - performanceOverview: What went well in bullet points.
    - scoreRationale: Logic behind score in bullet points.
    - toneAnalysis: Empathy/tone analysis in bullet points.
    - issueAddressing: Legal application analysis in bullet points (Strictly Malaysian Law).
    - improvementSuggestions: Critical feedback in bullet points.
    - sentiments: { ... }

    Transcript:
    ${transcript}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            performanceLevel: { type: Type.STRING },
            summary: { type: Type.STRING },
            performanceOverview: { type: Type.STRING },
            scoreRationale: { type: Type.STRING },
            toneAnalysis: { type: Type.STRING },
            issueAddressing: { type: Type.STRING },
            improvementSuggestions: { type: Type.STRING },
            sentiments: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                performanceOverview: { type: Type.STRING },
                scoreRationale: { type: Type.STRING },
                toneAnalysis: { type: Type.STRING },
                issueAddressing: { type: Type.STRING },
                improvementSuggestions: { type: Type.STRING },
              }
            }
          },
          required: ["score", "performanceLevel", "summary", "performanceOverview", "scoreRationale", "toneAnalysis", "issueAddressing", "improvementSuggestions", "sentiments"]
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    return JSON.parse(text);
  } catch (error) {
    console.error("Analysis error:", error);
    return {
      score: 0,
      performanceLevel: "Not Available",
      summary: "• Could not generate AI analysis at this time.",
      sentiments: { summary: 'neutral' }
    };
  }
}
import { GoogleGenAI, Type } from "@google/genai";
import { Message, AnalysisMetrics, EmotionState } from '../types';

export const CONVAI_API_KEY = '7786d57374209997fbe431eea8181a46';
export const CHARACTER_ID = '40d1e4d6-afc2-11f0-9b3c-42010a7be025';

// Initialize Gemini for Analysis
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ConvaiResponse {
  character_id: string;
  sessionID: string;
  text: string;
  audio?: string; // Base64 audio
  emotion_scores?: Record<string, number>;
  emotion?: Record<string, number>; // Alternate field name
  emotions?: Record<string, number>; // Alternate field name
}

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

// -- Analysis Service (Gemini) --

export async function analyzeConversation(messages: Message[]): Promise<Partial<AnalysisMetrics>> {
  const transcript = messages
    .map(m => `${m.role === 'user' ? 'Student (User)' : 'Client (Dave)'}: ${m.text}`)
    .join('\n\n');

  const prompt = `
    You are an expert legal instructor evaluating a law student's interview performance.
    The student played the role of a legal consultant interviewing a client named Dave regarding a copyright infringement matter.
    
    Rubric for Assessment:
    
    OUTSTANDING (32 - 40 points):
    Presentation done with the display of the enhanced ability of nonverbal skills (creativity, tone, empathy), vocal skills (enthusiasm, elocution - evaluate via text tone), structure (logical progression of points and coherence), relevant application and illustration of the Intellectual Property law content (subject coverage, depth of understanding, evaluation analysis and research) and professionalism. This shows enhanced ability to emotional literacy, consistent ability to perform under pressure situations, consistent grit or resilience, consistent adaptability with behavioural flexibilities.

    MASTERING (25 - 31 points):
    Presentation done with the demonstration of sufficient non-verbal/written skills, structure (logical progression of points and coherence), relevant application and illustration of the Intellectual Property law content and professionalism. This shows sufficient ability to emotional literacy, sufficient ability to perform under pressure situations, sufficient grit or resilience, sufficient adaptability.

    DEVELOPING (16 - 24 points):
    Presentation done with limited non-verbal/written skills, structure, relevant application and illustration of the Intellectual Property law content. This shows developing ability to emotional literacy, some ability to perform under pressure situations, shows some grit or resilience, some adaptability with behavioural inflexibility.
    
    BEGINNING (0 - 15 points):
    Presentation lacks sufficient structure, content knowledge, or professional tone. The student struggled to maintain the attorney-client relationship, failed to gather basic facts, or did not progress the interview.

    Task:
    Analyze the following conversation transcript based on the rubric above.
    
    CRITICAL FORMATTING INSTRUCTIONS:
    - Keep all text sections CONCISE.
    - Use bullet points (•) for clarity.
    - Ensure EVERY bullet point is on a NEW LINE.
    - Do NOT write long paragraphs.
    
    Return a JSON object containing specific fields:
    - score: A number between 0 and 40.
    - performanceLevel: One of "OUTSTANDING", "MASTERING", "DEVELOPING", or "BEGINNING".
    - summary: A concise executive summary (Separate points with newlines).
    - performanceOverview: Bullet points discussing what was performed well (Separate points with newlines).
    - scoreRationale: Explain the score using bullet points. IMPORTANT: If the user failed to address the core issue or made no meaningful progress in helping the client, state this EXPLICITLY as the first bullet point.
    - toneAnalysis: Bullet points on professionalism, empathy, and emotional literacy.
    - issueAddressing: Bullet points. YOU MUST EXPLICITLY STATE whether the user cited specific laws (e.g., Copyright Act sections) and whether they applied them correctly.
    - improvementSuggestions: Short, actionable bullet points on what to improve.

    Transcript:
    ${transcript}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
          },
          required: [
            "score", 
            "performanceLevel", 
            "summary", 
            "performanceOverview", 
            "scoreRationale", 
            "toneAnalysis", 
            "issueAddressing", 
            "improvementSuggestions"
          ]
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
      summary: "Could not generate AI analysis at this time.",
      performanceOverview: "N/A",
      scoreRationale: "N/A",
      toneAnalysis: "N/A",
      issueAddressing: "N/A",
      improvementSuggestions: "Please try again later."
    };
  }
}
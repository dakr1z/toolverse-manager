import { GoogleGenAI, Type } from "@google/genai";

// Note: In a real production app, never expose API keys on the client side like this unless strictly scoped.
// The prompt instructions specify utilizing process.env.API_KEY.
// For Vite, use import.meta.env.VITE_GEMINI_API_KEY
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

export const generateToolDetails = async (toolName: string) => {
  if (!apiKey) {
    console.warn("No API Key available for Gemini.");
    return null;
  }

  const prompt = `Analysiere das Software-Tool "${toolName}".
  Erstelle eine kurze Beschreibung (max 2 Sätze) auf Deutsch.
  Schlage eine passende Kategorie vor (z.B. AI, Design, Dev, Productivity).
  Nenne die offizielle Webseite (URL) falls bekannt.
  Nenne 3-5 relevante Tags.
  Schätze, ob es normalerweise ein Abo-Modell hat (true/false).
  Nenne 2 Vorteile (Pros) und 2 Nachteile (Cons).`;

  try {
    console.log("Generating tool details for:", toolName);
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            category: { type: Type.STRING },
            websiteUrl: { type: Type.STRING, description: "The official homepage URL including https://" },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            hasSubscription: { type: Type.BOOLEAN },
            pros: { type: Type.STRING },
            cons: { type: Type.STRING },
          }
        }
      }
    });
    
    // Clean up the response text (remove markdown code blocks if present)
    let text = response.text || '';
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};

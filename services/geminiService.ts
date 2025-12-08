import { GoogleGenAI, Type } from "@google/genai";

// Note: In a real production app, never expose API keys on the client side like this unless strictly scoped.
// The prompt instructions specify utilizing process.env.API_KEY.
// For Vite, use import.meta.env.VITE_GEMINI_API_KEY
const defaultApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

export const generateToolDetails = async (toolName: string, userApiKey?: string) => {
  const finalApiKey = userApiKey || defaultApiKey;
  
  if (!finalApiKey) {
    console.warn("No API Key available for Gemini.");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey: finalApiKey });

  const prompt = `Analysiere das Software-Tool "${toolName}".
  Erstelle eine kurze Beschreibung (max 2 Sätze) auf Deutsch.
  Schlage eine passende Kategorie vor (z.B. AI, Design, Dev, Productivity).
  Nenne die offizielle Webseite (URL) falls bekannt.
  Nenne 3-5 relevante Tags.
  Schätze, ob es normalerweise ein Abo-Modell hat (true/false).
  Nenne 2 Vorteile (Pros) und 2 Nachteile (Cons).`;

  const generate = async (modelName: string) => {
    console.log(`Generating tool details for: ${toolName} with model: ${modelName}`);
    return await ai.models.generateContent({
      model: modelName,
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
  };

  try {
    // Try primary model (Flash - fast & cheap)
    const response = await generate('gemini-1.5-flash');
    let text = response.text || '';
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return text ? JSON.parse(text) : null;
  } catch (error: any) {
    console.warn("Primary model failed, trying fallback...", error.message);
    
    try {
      // Fallback to Pro (older but stable)
      const response = await generate('gemini-pro');
      let text = response.text || '';
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return text ? JSON.parse(text) : null;
    } catch (fallbackError: any) {
      console.error("All models failed:", fallbackError);
      throw new Error(fallbackError.message || "KI-Anfrage fehlgeschlagen (Modell nicht verfügbar)");
    }
  }
};

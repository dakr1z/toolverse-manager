import { GoogleGenAI, Type } from "@google/genai";

export const STORAGE_KEY_GEMINI = 'toolverse_gemini_api_key';

export const generateToolDetails = async (toolName: string) => {
  // 1. Versuche Key aus LocalStorage zu laden (vom User in Einstellungen eingegeben)
  // 2. Fallback auf Vite Environment Variable (falls beim Build als Secret hinterlegt)
  const apiKey = localStorage.getItem(STORAGE_KEY_GEMINI) || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';

  if (!apiKey) {
    alert("Kein Gemini API Key gefunden!\n\nBitte gehe in die Einstellungen -> AI Konfiguration und hinterlege deinen Google Gemini API Key.");
    return null;
  }

  // Instanz dynamisch mit dem gefundenen Key erstellen
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Analysiere das Software-Tool "${toolName}".
  Erstelle eine kurze Beschreibung (max 2 Sätze) auf Deutsch.
  Schlage eine passende Kategorie vor (z.B. AI, Design, Dev, Productivity).
  Nenne die offizielle Webseite (URL) falls bekannt.
  Nenne 3-5 relevante Tags.
  Schätze, ob es normalerweise ein Abo-Modell hat (true/false).
  Nenne 2 Vorteile (Pros) und 2 Nachteile (Cons).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
    alert("Fehler bei der AI-Anfrage. Bitte prüfe, ob dein API Key korrekt ist.\n" + error);
    return null;
  }
};

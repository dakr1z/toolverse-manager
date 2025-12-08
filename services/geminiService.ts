import { GoogleGenerativeAI } from "@google/generative-ai";

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

  const genAI = new GoogleGenerativeAI(finalApiKey);

  const prompt = `Analysiere das Software-Tool "${toolName}".
  Antworte NUR mit einem validen JSON-Objekt. Keine Markdown-Formatierung (kein \`\`\`json).
  
  Das JSON muss diese Struktur haben:
  {
    "description": "Kurze Beschreibung (max 2 Sätze) auf Deutsch",
    "category": "Kategorie (z.B. AI, Design, Dev)",
    "websiteUrl": "Offizielle URL inkl. https://",
    "tags": ["Tag1", "Tag2", "Tag3"],
    "hasSubscription": true/false (Schätzung),
    "pros": "2 Vorteile",
    "cons": "2 Nachteile"
  }`;

  const generate = async (modelName: string) => {
    console.log(`Generating tool details for: ${toolName} with model: ${modelName}`);
    const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
            responseMimeType: "application/json"
        }
    });
    
    const result = await model.generateContent(prompt);
    return result.response.text();
  };

  try {
    // Try primary model (Flash - fast & cheap)
    let text = await generate('gemini-1.5-flash');
    
    // Clean up if model adds markdown despite prompt
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);

  } catch (error: any) {
    console.warn("Primary model failed, trying fallback...", error.message);
    
    try {
      // Fallback to Pro (older but stable)
      let text = await generate('gemini-pro');
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(text);
    } catch (fallbackError: any) {
      console.error("All models failed:", fallbackError);
      throw new Error(fallbackError.message || "KI-Anfrage fehlgeschlagen (Modell nicht verfügbar)");
    }
  }
};

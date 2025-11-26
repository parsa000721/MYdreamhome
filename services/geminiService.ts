import { GoogleGenAI } from "@google/genai";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateDesignAdvice = async (
  prompt: string, 
  currentContext: string
): Promise<string> => {
  try {
    const ai = getAI();
    // Using flash for quick text responses
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert architectural consultant. 
      Context of current design: ${currentContext}
      User Question: ${prompt}
      Provide concise, professional, and actionable design advice.`,
    });
    return response.text || "No advice generated.";
  } catch (error) {
    console.error("Gemini Advice Error:", error);
    return "Error connecting to AI Assistant.";
  }
};

export const generateRender = async (
  imageBase64: string,
  style: string,
  prompt: string
): Promise<string | null> => {
  try {
    const ai = getAI();
    // Remove header if present to get pure base64
    const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
    
    // Using gemini-3-pro-image-preview for high quality image generation/editing
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            text: `Render this architectural floor plan as a ${style} 3D visualization. 
            Details: ${prompt}. 
            Keep the layout exactly as shown in the input image, but make it look like a finished photo or high-quality render.`
          },
          {
            inlineData: {
              mimeType: 'image/png',
              data: base64Data
            }
          }
        ]
      },
      config: {
        imageConfig: {
            aspectRatio: "16:9",
            imageSize: "1K"
        }
      }
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Gemini Render Error:", error);
    throw error;
  }
};

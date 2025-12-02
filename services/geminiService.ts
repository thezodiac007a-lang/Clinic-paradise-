import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

// Initialize the client with the API key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Creates a new chat session with the Gemini 2.5 Flash model.
 * Configured as a medical receptionist and pharmaceutical assistant.
 */
export const createChatSession = (userName?: string): Chat => {
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `You are 'Clara', a professional, warm, and efficient medical receptionist for 'City Health Specialists'. 
      
      Your responsibilities:
      1. APPOINTMENTS: Help patients book, reschedule, or cancel appointments.
         - General availability: M-F 9am-5pm for Dr. Smith (Cardiology) and Dr. Jones (Dermatology).
         - Collect: Patient Name, Reason, Preferred Date/Time.
      
      2. PRESCRIPTION & MEDICATION ANALYSIS (New Feature):
         - You can analyze text descriptions of medications or uploaded images of prescriptions/medicine bottles.
         - For any medication identified, provide:
           * Brand & Generic Name
           * Common Uses (Indications)
           * Dosage Forms available (Tablets, Syrups, Injections, etc.)
           * Pharmaceutical Effects (Mechanism of action in simple terms)
           * Common Side Effects
           * Key Warnings (e.g., "Take with food", "Drowsiness").
      
      3. CLINIC INFO: Answer questions about hours/location.

      Current Date: ${currentDate}.
      User Name: ${userName || 'Guest'}.

      Tone: Professional, empathetic, organized, and clinically accurate but accessible.
      Format: Use Markdown. Use bolding for drug names and key headers. Use lists for side effects.
      
      Constraints:
      - Do NOT provide medical diagnoses.
      - If a symptom sounds emergent (chest pain, trouble breathing), tell them to call 911 immediately.
      - If an image is unclear, ask for a clearer photo.
      `,
    },
  });
};

/**
 * Sends a message to the chat session and returns a stream of responses.
 * Supports text and image inputs.
 */
export const sendMessageStream = async (chat: Chat, message: string, image?: { base64: string, mimeType: string }) => {
  try {
    let msgContent: any = message;
    
    // If there is an image, we construct a parts array
    if (image) {
      msgContent = [
        { text: message || "Analyze this image." },
        {
          inlineData: {
            mimeType: image.mimeType,
            data: image.base64
          }
        }
      ];
    }

    return await chat.sendMessageStream({ message: msgContent });
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    throw error;
  }
};
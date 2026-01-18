import { GoogleGenAI } from "@google/genai";
import { Ticket, ChatThread } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Ticket Analysis ---
export const analyzeTicketWithAI = async (ticket: Ticket): Promise<{ summary: string; suggestion: string }> => {
  try {
    const prompt = `
      Context: Property Management Support System.
      Task: Analyze this ticket.
      Subject: ${ticket.subject}
      Description: ${ticket.description}
      Messages: ${JSON.stringify(ticket.messages)}
      
      Return JSON:
      { "summary": "1 sentence issue summary", "suggestion": "Concise, professional reply draft" }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    return JSON.parse(text);

  } catch (error) {
    console.error("AI Error", error);
    return { summary: "Analysis unavailable", suggestion: "Please review manually." };
  }
};

// --- Chat Smart Replies ---
export const generateSmartReplies = async (thread: ChatThread): Promise<string[]> => {
  try {
    const recentContext = thread.messages.slice(-5).map(m => `${m.senderId === 'me' ? 'Support' : 'User'}: ${m.text}`).join('\n');
    const prompt = `
      Context: Property Management Chat.
      Conversation History:
      ${recentContext}
      
      Task: Generate 3 short, professional, distinct Smart Replies for the Support Agent.
      Return JSON: { "replies": ["Reply 1", "Reply 2", "Reply 3"] }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    const data = JSON.parse(response.text || "{}");
    return data.replies || [];
  } catch (error) {
    return [];
  }
};

// --- Email Drafter ---
export const generateEmailDraft = async (subject: string, recipientRole: string): Promise<string> => {
  try {
    const prompt = `
      Context: Property Management Email.
      Role: Property Manager writing to a ${recipientRole}.
      Subject: ${subject}
      
      Task: Write a professional, polite, and clear email body (HTML format, use <p> and <br>).
      Keep it under 150 words. No placeholders if possible, infer context from subject.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    return "<p>Error generating draft. Please type manually.</p>";
  }
};

// --- Document Generator ---
export const generateDocumentTemplate = async (title: string, type: string): Promise<string> => {
  try {
    const prompt = `
      Context: Property Management Documentation.
      Document Type: ${type}
      Title: ${title}
      
      Task: Generate a professional, detailed document template in HTML format (use <h1>, <h2>, <p>, <ul>, <li>).
      Include placeholders like [Date] or [Name] where necessary.
      Make it look like a formal document.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    return "<h1>Error</h1><p>Could not generate template.</p>";
  }
};
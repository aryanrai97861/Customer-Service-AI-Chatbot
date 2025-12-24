import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const model = genAI ? genAI.getGenerativeModel({ model: "gemini-2.5-flash" }) : null;

const SYSTEM_INSTRUCTION = `You are a helpful support agent for a small e-commerce store called 'Spur Store'.
Your goal is to answer customer questions clearly and concisely.
If you don't know the answer, politely say so.

Store Policies:
- Shipping: We ship worldwide. standard shipping is $5, free for orders over $50. USA delivery takes 3-5 business days. International takes 7-14 days.
- Returns: 30-day return policy for unused items in original packaging. Customer pays return shipping unless item is defective.
- Support Hours: Mon-Fri 9am - 5pm EST.
`;

export async function generateReply(history: { role: 'user' | 'model', parts: string }[], userMessage: string): Promise<string> {
  if (!model) {
    throw new Error("Gemini API Key not configured.");
  }

  try {
    const chat = model.startChat({
        history: [
            {
                role: "user",
                parts: [{ text: SYSTEM_INSTRUCTION }]
            },
            {
                role: "model",
                parts: [{ text: "Understood. I am ready to assist customers of Spur Store with shipping, returns, and general inquiries." }]
            },
            ...history.map(h => ({
                role: h.role,
                parts: [{ text: h.parts }]
            }))
        ],
        generationConfig: {
            maxOutputTokens: 500,
        },
    });

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("LLM Generation Error:", error);
    return "I'm having trouble connecting to my brain right now. Please try again later.";
  }
}

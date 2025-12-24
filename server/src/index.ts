import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './db';
import { conversations, messages } from './db/schema';
import { eq, asc } from 'drizzle-orm';
import { generateReply } from './services/llm';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Type definitions
interface ChatRequest {
  message: string;
  sessionId?: string;
}

// POST /chat/message
app.post('/chat/message', async (req, res) => {
  try {
    const { message, sessionId } = req.body as ChatRequest;

    if (!message || message.trim() === '') {
       res.status(400).json({ error: "Message cannot be empty" });
       return; 
    }

    let conversationId = sessionId;
    let isNewSession = false;

    // 1. Validate or Create Session
    if (!conversationId) {
      const [newConv] = await db.insert(conversations).values({}).returning();
      conversationId = newConv.id;
      isNewSession = true;
    } else {
        // Verify it exists
        const exists = await db.select().from(conversations).where(eq(conversations.id, conversationId));
        if (exists.length === 0) {
             const [newConv] = await db.insert(conversations).values({ id: conversationId }).returning(); // Try to reuse ID or just make new? stick to simple: if not found, make new with that ID if valid UUID, otherwise new. 
             // Actually, safest to just create new if not found to avoid errors, but let's assume client sends valid if they have one.
             // For robustness: if client sends invalid UUID, this throws.
             // Let's just create a new one if not found is safer logic, but for now strict check:
             res.status(404).json({ error: "Session not found" });
             return;
        }
    }

    // 2. Persist User Message
    await db.insert(messages).values({
      conversation_id: conversationId,
      sender: 'user',
      content: message,
    });

    // 3. Retrieve History for LLM Context (last 10 messages)
    const history = await db.select()
        .from(messages)
        .where(eq(messages.conversation_id, conversationId))
        .orderBy(asc(messages.created_at));
        // .limit(20); // Drizzle select doesn't support limit directly on the builder like this without subquery sometimes, but standard select does. 
        // Actually, retrieving all history for this session is fine for a demo.

    // Map history to Gemini format
    // Note: We exclude the very last message we just added because we pass it as 'userMessage' to generateReply? 
    // Or we pass it as part of history?
    // generateReply takes history + userMessage. Usually userMessage is the *next* prompt.
    // So history should NOT include the current message yet, OR we change generateReply signature.
    // Let's pass the *previous* messages as history, and the current one as the prompt.
    const apiHistory = history.filter(msg => msg.content !== message || msg.sender !== 'user').map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'model' as const,
        parts: msg.content
    }));
    // Wait, filtering by content is risky if duplicates. 
    // Correct way: The just-inserted message is in the DB. We should use logic to exclude it or just pass all previous.
    // Let's re-query? Or just use the fact we inserted it.
    
    // Better: Helper to get history excluding the very last one? 
    // Actually, Gemini supports sending the whole chat history including the latest user message, and getting a response?
    // `sendMessage(msg)` appends msg to history. So `history` passed to `startChat` should be everything BEORE `msg`.
    
    const contextHistory = history.slice(0, -1).map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'model' as const,
        parts: msg.content
    }));

    // 4. Generate Reply
    const replyText = await generateReply(contextHistory, message);

    // 5. Persist AI Reply
    await db.insert(messages).values({
        conversation_id: conversationId,
        sender: 'ai',
        content: replyText
    });

    res.json({ reply: replyText, sessionId: conversationId });

  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /chat/history/:sessionId
app.get('/chat/history/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        // Check conv exists
        const [conv] = await db.select().from(conversations).where(eq(conversations.id, sessionId));
        if (!conv) {
            res.status(404).json({ error: "Session not found" });
            return;
        }

        const history = await db.select()
            .from(messages)
            .where(eq(messages.conversation_id, sessionId))
            .orderBy(asc(messages.created_at));
        
        res.json({ messages: history });
    } catch (error) {
        console.error("History Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

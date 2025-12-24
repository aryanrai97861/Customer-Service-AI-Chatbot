# Spur AI Chat Agent - Customer Support Chatbot

A full-stack AI-powered customer support chat widget built for the Spur Founding Engineer assignment. Features real-time AI responses using Google Gemini, persistent conversation history, and a clean, responsive UI.

**Live Demo**: 
- Frontend: [Your Vercel URL]
- Backend: https://customer-service-ai-chatbot-1.onrender.com

---

## 📋 Table of Contents
- [Tech Stack](#tech-stack)
- [How to Run Locally](#how-to-run-locally)
- [Database Setup](#database-setup)
- [Environment Variables](#environment-variables)
- [Architecture Overview](#architecture-overview)
- [LLM Integration](#llm-integration)
- [Design Decisions](#design-decisions)
- [Trade-offs & Future Work](#trade-offs--future-work)
- [Deployment](#deployment)

---

## 🛠 Tech Stack

**Backend**
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (Neon Serverless)
- **ORM**: Drizzle ORM
- **AI**: Google Gemini Pro (`gemini-2.5-flash`)

**Frontend**
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Vanilla CSS (custom design, no UI libraries)
- **State**: React Hooks + localStorage for session persistence

---

## 🚀 How to Run Locally

### Prerequisites
- **Node.js** v18 or higher ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **PostgreSQL Database** - Get a free one at [Neon.tech](https://neon.tech)
- **Google Gemini API Key** - Get it from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Step-by-Step Local Setup

#### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd SPUR-Founding-full-stack
```

#### 2. Set Up Backend

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

**Edit `server/.env`** with your credentials:
```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=3000
```

**Get your DATABASE_URL:**
1. Go to [console.neon.tech](https://console.neon.tech)
2. Create a new project (free tier)
3. Copy the connection string from "Connection Details"
4. Make sure it includes `?sslmode=require` at the end

**Get your GEMINI_API_KEY:**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key

```bash
# Push database schema to Neon
npm run db:push

# Start development server
npm run dev
```

Backend should now be running on **http://localhost:3000** ✅

#### 3. Set Up Frontend

Open a **new terminal** window:

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Create .env file (optional for local dev)
cp .env.example .env
```

**Edit `client/.env`** (optional, defaults to localhost:3000):
```env
VITE_API_URL=http://localhost:3000
```

```bash
# Start development server
npm run dev
```

Frontend should now be running on **http://localhost:5173** ✅

#### 4. Test the Application

1. Open your browser to **http://localhost:5173**
2. You should see the chat widget
3. Type a message like: "What's your shipping policy?"
4. The AI should respond with store information

---

## 🗄️ Database Setup

### Schema Overview

The application uses two tables:

**`conversations`** - Tracks chat sessions
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**`messages`** - Stores all chat messages
```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  sender ENUM('user', 'ai') NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Running Migrations

The project uses **Drizzle ORM** for type-safe database operations.

```bash
# Push schema to database (creates/updates tables)
cd server
npm run db:push

# This command:
# 1. Reads schema from src/db/schema.ts
# 2. Generates SQL migrations
# 3. Applies them to your Neon database
```

**Drizzle Configuration** is in `server/drizzle.config.ts`:
```typescript
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! }
});
```

### Seed Data (Optional)

Currently, no seed data is required. The application creates:
- New conversations when users first chat
- Messages as users interact with the AI

---

## 🔐 Environment Variables

### Backend (`server/.env`)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db?sslmode=require` | ✅ Yes |
| `GEMINI_API_KEY` | Google Gemini API key | `AIzaSy...` | ✅ Yes |
| `PORT` | Server port (auto-set by hosting) | `3000` | No |
| `NODE_ENV` | Environment mode | `development` or `production` | No |

### Frontend (`client/.env`)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3000` (local)<br>`https://your-backend.onrender.com` (prod) | No* |

*Defaults to `http://localhost:3000` if not set

### Security Notes
- ⚠️ **Never commit `.env` files to Git**
- ✅ Use `.env.example` as templates
- ✅ All secrets are in `.gitignore`
- ✅ Environment variables are injected at build/runtime

---

## 🏗️ Architecture Overview

### Backend Structure (Layered Architecture)

```
server/
├── src/
│   ├── index.ts           # Express app, routes, middleware
│   ├── db/
│   │   ├── index.ts       # Database connection (Drizzle client)
│   │   └── schema.ts      # Database schema definitions
│   └── services/
│       └── llm.ts         # LLM integration (Gemini API)
├── drizzle.config.ts      # Drizzle ORM configuration
├── package.json
└── tsconfig.json
```

**Layer Separation:**
1. **Routes Layer** (`index.ts`) - HTTP endpoints, request validation
2. **Service Layer** (`services/llm.ts`) - Business logic, LLM calls
3. **Data Layer** (`db/`) - Database schemas and connections

### Frontend Structure (Component-Based)

```
client/
├── src/
│   ├── main.tsx           # React app entry point
│   ├── App.tsx            # Root component
│   ├── components/
│   │   ├── ChatWidget.tsx # Main chat UI component
│   │   └── ChatWidget.css # Component styles
│   └── assets/
├── public/
└── vite.config.ts
```

### Data Flow

```
User Input (Frontend)
    ↓
ChatWidget.tsx (validates, optimistic update)
    ↓
POST /chat/message (Backend API)
    ↓
Express Route Handler (validates, checks session)
    ↓
Database (persist user message)
    ↓
LLM Service (generateReply with history)
    ↓
Google Gemini API (generates response)
    ↓
Database (persist AI response)
    ↓
Response to Frontend (reply + sessionId)
    ↓
ChatWidget updates UI
```

### Key Architectural Decisions

**1. Monorepo Structure**
- Client and server in one repo for easier development
- Separate `package.json` for independent deployments
- Clear separation of concerns

**2. Session Management**
- `sessionId` (UUID) stored in `localStorage`
- Persists across page refreshes
- No authentication required (anonymous chat)

**3. Database Choice: Drizzle ORM**
- **Why not Prisma?** Lighter weight, faster builds
- **Why not raw SQL?** Type safety, migrations
- Perfect balance of developer experience and performance

**4. Error Handling Strategy**
- Backend: Graceful LLM failures, never crash
- Frontend: Optimistic updates, clear error messages
- User never sees stack traces

---

## 🤖 LLM Integration

### Provider: Google Gemini

**Model**: `gemini-2.5-flash`

**Why Gemini?**
- ✅ Free tier with generous quota (60 requests/min)
- ✅ Fast response times (~1-2 seconds)
- ✅ Good at conversational tasks
- ✅ Official TypeScript SDK
- ❌ Could have used OpenAI/Claude, but Gemini is more accessible for demos

### Prompting Strategy

**System Instruction** (in `server/src/services/llm.ts`):
```typescript
const SYSTEM_INSTRUCTION = `You are a helpful support agent for a small e-commerce store called 'Spur Store'.
Your goal is to answer customer questions clearly and concisely.
If you don't know the answer, politely say so.

Store Policies:
- Shipping: We ship worldwide. Standard shipping is $5, free for orders over $50. 
  USA delivery takes 3-5 business days. International takes 7-14 days.
- Returns: 30-day return policy for unused items in original packaging. 
  Customer pays return shipping unless item is defective.
- Support Hours: Mon-Fri 9am - 5pm EST.
`;
```

**Conversation History:**
- Last 20 messages sent as context (prevents token overflow)
- Formatted as `{ role: 'user' | 'model', parts: string }`
- Enables contextual, multi-turn conversations

**Token Limits:**
- `maxOutputTokens: 500` - Keeps responses concise
- Input truncation if history too long (future improvement)

### Error Handling

```typescript
try {
  const result = await chat.sendMessage(userMessage);
  return result.response.text();
} catch (error) {
  console.error("LLM Generation Error:", error);
  return "I'm having trouble connecting to my brain right now. Please try again later.";
}
```

**Handles:**
- ❌ API key invalid/missing
- ❌ Rate limit exceeded
- ❌ Network timeouts
- ❌ Gemini service outages

All failures return friendly messages instead of crashing.

---

## 💡 Design Decisions

### 1. Vanilla CSS Instead of Tailwind/MUI

**Decision**: Custom CSS with modern design patterns

**Why?**
- Demonstrates pure CSS skills
- No dependency bloat (smaller bundle)
- Unique design (not "another Tailwind app")
- Better for take-home to show fundamentals

**Trade-off**: Slower to prototype, but cleaner final result.

### 2. localStorage for Session Persistence

**Decision**: Store `sessionId` in browser localStorage

**Pros:**
- Simple implementation
- Works across page refreshes
- No authentication needed
- Good UX for anonymous support chat

**Cons:**
- Cleared if user clears browser data
- Not secure (but we have no sensitive data)
- Can't sync across devices

**Why not cookies?** Less secure, GDPR concerns
**Why not JWT?** Overkill for anonymous chat

### 3. Drizzle ORM Over Prisma

**Decision**: Use Drizzle for database operations

**Comparison:**
| Feature | Drizzle | Prisma |
|---------|---------|--------|
| Type Safety | ✅ Excellent | ✅ Excellent |
| Bundle Size | 📦 Small | 📦 Large |
| Build Speed | ⚡ Fast | 🐌 Slow |
| Learning Curve | 📚 Medium | 📚 Easy |

For a small project, Drizzle's lightweight nature wins.

### 4. Monorepo vs Separate Repos

**Decision**: Monorepo (client + server together)

**Why?**
- Easier local development
- Shared TypeScript types possible (future)
- Single Git workflow
- Common for early-stage startups

**Trade-off**: Slightly larger repo, but worth it for DX.

---

## ⚖️ Trade-offs & "If I Had More Time..."

### Current Limitations

**1. Security**
- ❌ No rate limiting on API endpoints
- ❌ Anyone with a `sessionId` can read that conversation
- ❌ No input sanitization (risk of prompt injection)

**If I had more time:**
- Add JWT authentication
- Implement rate limiting (express-rate-limit)
- Sanitize user inputs
- Add CAPTCHA for abuse prevention

**2. Scalability**
- ❌ All messages loaded into memory for history
- ❌ No pagination for long conversations
- ❌ No caching layer (Redis)

**If I had more time:**
- Paginate message history
- Add Redis for session caching
- Implement conversation summarization for very long threads
- Use WebSockets for real-time updates

**3. Testing**
- ❌ No unit tests
- ❌ No integration tests
- ❌ No E2E tests

**If I had more time:**
- Jest for backend unit tests
- React Testing Library for component tests
- Playwright for E2E tests
- CI/CD pipeline with test coverage

**4. Observability**
- ❌ Basic console.log logging
- ❌ No error tracking (Sentry)
- ❌ No analytics

**If I had more time:**
- Integrate Sentry for error tracking
- Add structured logging (Winston/Pino)
- Analytics for user behavior
- Performance monitoring (response times, LLM latency)

**5. UX Enhancements**
- ❌ No markdown rendering in AI responses
- ❌ No "copy message" button
- ❌ No conversation export
- ❌ No dark mode

**If I had more time:**
- Markdown support with code highlighting
- Message actions (copy, regenerate, flag)
- Export chat as PDF
- Dark mode toggle
- Typing indicators with real streaming

**6. AI Improvements**
- ❌ No streaming responses (entire message at once)
- ❌ No conversation summarization
- ❌ FAQ answers could be more dynamic

**If I had more time:**
- Stream responses token-by-token for better UX
- RAG (Retrieval Augmented Generation) for dynamic FAQs
- Vector database for semantic search
- Multi-language support
- Sentiment analysis

### What I'm Proud Of

Despite time constraints:
- ✅ Clean, readable TypeScript throughout
- ✅ Proper error handling (no crashes)
- ✅ Extensible architecture (easy to add WhatsApp/Instagram)
- ✅ Production-ready deployment setup
- ✅ Comprehensive documentation

---

## 🚀 Deployment

### Live URLs
- **Frontend**: [Add your Vercel URL here]
- **Backend**: https://customer-service-ai-chatbot-1.onrender.com

### Quick Deploy

**Backend → Render:**
1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect repo, set root to `server`
4. Build: `npm install && npm run db:push && npm run build`
5. Start: `npm start`
6. Add env vars: `DATABASE_URL`, `GEMINI_API_KEY`

**Frontend → Vercel:**
1. Go to [vercel.com](https://vercel.com) → Import repo
2. Set root to `client`
3. Add env var: `VITE_API_URL=https://your-backend.onrender.com`
4. Deploy!

**Detailed guides:**
- [📖 Step-by-step deployment](DEPLOYMENT.md)
- [🚀 30-minute quickstart](QUICKSTART.md)
- [✅ Pre-deployment checklist](CHECKLIST.md)

---

## 📞 Support & Troubleshooting

**Common Issues:**

| Issue | Solution |
|-------|----------|
| `DATABASE_URL` error | Ensure it ends with `?sslmode=require` |
| CORS errors | Add your frontend URL to backend CORS config |
| LLM not responding | Check `GEMINI_API_KEY` is set correctly |
| 404 on `/chat/message` | Remove trailing slash from `VITE_API_URL` |

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed troubleshooting.

---

## 📄 License

MIT License - Feel free to use this as a reference for your own projects.

---

## 🙏 Acknowledgments

Built for **Spur** - Customer Engagement & Automation Platform

Assignment completed by [Your Name] - December 2025

## Deployment

### Option 1: Quick Deploy (Recommended)

**Backend (Render):**
1. Push code to GitHub
2. Go to [render.com](https://render.com) and create a new Web Service
3. Connect your GitHub repository
4. Select the `server` folder as root directory
5. Set environment variables:
   - `DATABASE_URL` (from Neon dashboard)
   - `GEMINI_API_KEY` (from Google AI Studio)
   - `PORT` will be auto-set by Render
6. Build command: `npm install && npm run db:push && npm run build`
7. Start command: `npm start`
8. Deploy!

**Frontend (Vercel):**
1. Go to [vercel.com](https://vercel.com) and import your GitHub repo
2. Set root directory to `client`
3. Add environment variable:
   - `VITE_API_URL` = your Render backend URL (e.g., `https://your-app.onrender.com`)
4. Deploy!

### Option 2: Detailed Step-by-Step
See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive deployment instructions.

## Trade-offs & Future Work
- **Security**: Currently, anyone with a sessionId can read the history. In a real app, I'd add JWT auth or signed cookies.
- **Rate Limiting**: Not implemented for this demo, but essential for production to prevent LLM abuse.
- **Error Recovery**: Add retry logic for LLM API failures.
- **Testing**: Add unit tests for API endpoints and integration tests for chat flow.
- **Monitoring**: Add logging service (e.g., Sentry) for production error tracking.

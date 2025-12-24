# Spur AI Chat Agent Assignment

This is a full-stack AI chat widget built for the Spur Founding Engineer take-home assignment.
It simulates a customer support agent "Spur Assistant" that answers shipping and return policy questions using Google's Gemini LLM.

**Live Demo**: _Deploy following instructions below, then add your URL here_

---

## 📚 Quick Navigation
- [🚀 Quick Deployment (30 mins)](QUICKSTART.md)
- [📖 Detailed Deployment Guide](DEPLOYMENT.md)
- [✅ Pre-Deployment Checklist](CHECKLIST.md)
- [💻 Local Development](#setup-instructions) (below)

---

## Tech Stack
- **Backend**: Node.js, Express, TypeScript.
- **Database**: PostgreSQL (Neon Serverless), Drizzle ORM.
- **Frontend**: React (Vite), Vanilla CSS (Premium Aesthetics).
- **AI**: Google Gemini Pro via `@google/generative-ai`.

## Architecture
- **Monorepo**: `/server` and `/client` in one repo for simplicity.
- **Persistence**: 
    - Every message is saved to Neon DB `messages` table.
    - `conversations` table tracks sessions.
    - Frontend stores `sessionId` in `localStorage` to resume chats.
- **Robustness**: 
    - Input validation on backend.
    - Graceful error handling in React (e.g., if API fails, UI doesn't break).
    - Separation of concerns: Database schema, LLM service, and Routes are distinct.

## Setup Instructions

### Prerequisites
- Node.js v16+
- A Neon DB project (PostgreSQL)
- A Google Gemini API Key

### 1. Backend Setup
```bash
cd server
npm install

# Create .env file
echo "DATABASE_URL=your_neon_url" > .env
echo "GEMINI_API_KEY=your_gemini_key" >> .env
echo "PORT=3000" >> .env

# Push Database Schema
npx drizzle-kit push

# Start Server
npm run dev
```

### 2. Frontend Setup
```bash
cd client
npm install

# Create .env file (optional for local dev)
echo "VITE_API_URL=http://localhost:3000" > .env

npm run dev
```

Open `http://localhost:5173`.

## Design Decisions
- **Drizzle ORM**: Chosen for type safety and lightweight nature compared to heavy ORMs like Prisma.
- **Vanilla CSS**: Used to demonstrate ability to build "premium" UI without relying on component libraries, ensuring a unique implementation.
- **Session Management**: Simple `localStorage` based session ID allows for "anonymous" but persistent chats.

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

# Deployment Guide for Spur AI Chat Agent

This guide walks you through deploying your AI chat application to production using free/affordable hosting services.

## Prerequisites

Before deploying, ensure you have:
- [ ] A GitHub account with your code pushed to a repository
- [ ] A Neon PostgreSQL database (free tier available at [neon.tech](https://neon.tech))
- [ ] A Google Gemini API key (get it from [Google AI Studio](https://makersuite.google.com/app/apikey))

---

## Part 1: Deploy Backend to Render

### Step 1: Prepare Your Repository
1. Ensure your code is pushed to GitHub
2. Make sure `render.yaml` exists in your root directory (already created)

### Step 2: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up using your GitHub account
3. Authorize Render to access your repositories

### Step 3: Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `spur-chat-backend` (or any name you prefer)
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: 
     ```
     npm install && npx drizzle-kit push && npm run build
     ```
   - **Start Command**: 
     ```
     npm start
     ```

### Step 4: Set Environment Variables
In the Render dashboard, add these environment variables:

| Key | Value | Notes |
|-----|-------|-------|
| `DATABASE_URL` | Your Neon connection string | From Neon dashboard, should start with `postgresql://` |
| `GEMINI_API_KEY` | Your Google Gemini API key | From Google AI Studio |
| `NODE_ENV` | `production` | Auto-set by Render usually |

**Finding your DATABASE_URL:**
1. Go to [console.neon.tech](https://console.neon.tech)
2. Select your project
3. Click "Connection Details"
4. Copy the "Connection string" (make sure SSL mode is enabled)

### Step 5: Deploy
1. Click **"Create Web Service"**
2. Wait for the build to complete (3-5 minutes)
3. Once deployed, you'll get a URL like: `https://spur-chat-backend.onrender.com`
4. **Important**: Copy this URL - you'll need it for the frontend

### Step 6: Test Backend
Test your backend is working:
```bash
curl https://YOUR-RENDER-URL.onrender.com/chat/message \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, what are your shipping policies?"}'
```

You should get a JSON response with an AI reply.

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up using your GitHub account
3. Authorize Vercel to access your repositories

### Step 2: Import Project
1. Click **"Add New..."** → **"Project"**
2. Select your GitHub repository
3. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)

### Step 3: Add Environment Variable
**Critical step!** Add this environment variable:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | Your Render backend URL (e.g., `https://spur-chat-backend.onrender.com`) |

**Important**: 
- Do NOT include a trailing slash
- Make sure it's HTTPS
- Use the exact URL from Render

### Step 4: Deploy
1. Click **"Deploy"**
2. Wait for the build (1-2 minutes)
3. Once deployed, you'll get a URL like: `https://your-app.vercel.app`

### Step 5: Test Frontend
1. Visit your Vercel URL
2. Try chatting with the AI assistant
3. Check browser console (F12) for any errors

---

## Part 3: Final Configuration

### Enable CORS
Your backend needs to allow requests from your Vercel domain. Update [server/src/index.ts](../server/src/index.ts):

```typescript
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'https://your-app.vercel.app'  // Add your Vercel URL
  ]
}));
```

Or for development, use:
```typescript
app.use(cors()); // Allows all origins (not recommended for production)
```

After making changes, push to GitHub and Render will auto-deploy.

---

## Troubleshooting

### Backend Issues

**Build fails on Render:**
- Check build logs in Render dashboard
- Ensure `package.json` has all dependencies listed
- Verify `DATABASE_URL` is set correctly

**Database connection fails:**
- Ensure your Neon database is active (free tier databases sleep after inactivity)
- Check that the connection string includes `?sslmode=require`
- Verify your Neon project allows external connections

**LLM errors:**
- Verify `GEMINI_API_KEY` is set correctly
- Check Google AI Studio for API quota limits
- Look at Render logs for specific error messages

### Frontend Issues

**CORS errors:**
- Add your Vercel URL to CORS whitelist in backend
- Ensure `VITE_API_URL` doesn't have a trailing slash

**API calls fail:**
- Check browser console (F12) for error messages
- Verify `VITE_API_URL` is set in Vercel environment variables
- Make sure the URL is HTTPS, not HTTP

**Environment variable not working:**
- After adding/changing env vars in Vercel, you MUST redeploy
- Go to Deployments → (three dots) → Redeploy

### General Tips
- Check logs in Render dashboard for backend errors
- Use browser DevTools Network tab to debug API calls
- Render free tier spins down after inactivity - first request may be slow

---

## Cost Breakdown (Free Tier)

| Service | Free Tier | Limits |
|---------|-----------|--------|
| Render | 750 hours/month | Spins down after 15min inactivity |
| Vercel | Unlimited deployments | 100GB bandwidth/month |
| Neon | 1 project | 10GB storage, sleeps after 5min |
| Google Gemini | 60 requests/min | Free tier available |

**Total**: $0/month for this demo

---

## Updating Your Deployment

### Backend Updates
1. Push changes to GitHub
2. Render auto-deploys from main branch
3. Or manually trigger deploy in Render dashboard

### Frontend Updates
1. Push changes to GitHub
2. Vercel auto-deploys from main branch
3. Or use Vercel CLI: `vercel --prod`

---

## Security Checklist

Before submitting:
- [ ] No API keys or secrets in GitHub
- [ ] All secrets are in `.env` (not `.env.example`)
- [ ] `.env` is in `.gitignore`
- [ ] CORS is configured properly
- [ ] Database connection uses SSL

---

## Submission

Once deployed, update your README.md:
1. Add your live URLs:
   - **Frontend**: `https://your-app.vercel.app`
   - **Backend**: `https://your-backend.onrender.com`

2. Fill in the Spur submission form with:
   - GitHub repository URL
   - Live demo URL (Vercel frontend)
   - Any notes about your implementation

---

## Alternative Deployment Options

If you prefer different services:

### Backend Alternatives
- **Railway**: Similar to Render, often faster cold starts
- **Fly.io**: Good for global deployment
- **Heroku**: Classic PaaS (requires credit card even for free tier)

### Frontend Alternatives
- **Netlify**: Very similar to Vercel
- **Cloudflare Pages**: Great for global CDN
- **GitHub Pages**: Free but requires static export

### Database Alternatives
- **Supabase**: PostgreSQL with nice dashboard
- **PlanetScale**: MySQL-compatible, good free tier
- **Railway**: Can host both app and DB together

---

Need help? Common issues are usually:
1. Wrong environment variable names (check spelling!)
2. Missing environment variables (frontend AND backend)
3. CORS not configured
4. Database URL incorrect or database sleeping

Good luck with your deployment! 🚀

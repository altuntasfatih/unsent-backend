# Vercel Node.js API for Message & Subscription

This project migrates n8n flows to serverless Node.js API endpoints, ready for Vercel deployment.

## Endpoints
- `/api/generate-message` (POST): Generate a breakup message using OpenAI, with subscription check and logging.
- `/api/add-subscription` (POST): Add a new subscription for a user.
- `/api/get-subscription` (GET): Retrieve a user's subscription info.

## Setup
1. Copy `.env.example` to `.env` and fill in your credentials:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `OPENAI_API_KEY`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run locally:
   ```bash
   npm run dev
   ```
4. Deploy to Vercel:
   - Push to GitHub and connect to Vercel.
   - Set environment variables in the Vercel dashboard.

## Notes
- Each file in `/api` is a serverless function.
- No Express needed; use the default export for handlers. 
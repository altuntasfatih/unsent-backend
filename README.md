# Unsent Backend API

A serverless Node.js API for message generation and subscription management, built with TypeScript and deployed on Vercel.

## Features

- **Message Generation**: Generate custom and structured messages using OpenAI
- **Subscription Management**: Handle subscriptions with support for multiple providers:
  - Apple App Store
  - RevenueCat
  - Adapty
- **Serverless Architecture**: Built for Vercel deployment with TypeScript

## API Endpoints

### Message Generation
- `POST /api/generate-custom-message`: Generate a custom message based on user input
  - Requires active subscription
  - Logs all message generations

- `POST /api/generate-structured-message`: Generate a structured message using a guided approach
  - Requires active subscription
  - Uses predefined prompts and templates

### Subscription Management
- `POST /api/purchase`: Add or update a user's subscription
  - Supports multiple validation methods (Apple, RevenueCat, Adapty)
  - Handles subscription expiry calculation
  - Prevents duplicate subscriptions

- `GET /api/get-subscription`: Retrieve a user's subscription details
  - Returns active subscription information
  - Includes expiry date and product details

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Package Manager**: Bun
- **Database**: Supabase
- **AI**: OpenAI API
- **Deployment**: Vercel
- **Validation**: 
  - Apple App Store Server API
  - RevenueCat API
  - Adapty API

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd unsent-backend
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Environment Variables**
   Create a `.env` file with the following variables:
   ```
   # Supabase
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key

   # OpenAI
   OPENAI_API_KEY=your_openai_api_key

   # Validation Method (choose one)
   VALIDATATION_METHOD=apple|revenuecat|adapty

   # Apple App Store (if using Apple validation)
   APPLE_SHARED_SECRET=your_shared_secret

   # RevenueCat (if using RevenueCat validation)
   REVENUECAT_SECRET_API_KEY=your_api_key
   REVENUECAT_PROJECT_ID=your_project_id

   # Adapty (if using Adapty validation)
   ADAPTY_SECRET_API_KEY=your_api_key
   ```

4. **Run locally**
   ```bash
   bun run dev
   ```

5. **Build and deploy**
   ```bash
   bun run build
   ```

## Development

- Each file in `/api` is a serverless function
- Use `bun run dev` for local development with hot reloading
- The project uses TypeScript for type safety
- All API responses follow a consistent format:
  ```typescript
  {
    success: boolean;
    error?: string;
    // Additional response data
  }
  ```

## Deployment

1. Push to GitHub
2. Connect your repository to Vercel
3. Set environment variables in the Vercel dashboard
4. Deploy!

## Notes

- All API endpoints require authentication via the `withAuth` middleware
- Subscription validation is configurable via the `VALIDATATION_METHOD` environment variable
- Message generation is rate-limited based on subscription status
- All message generations are logged for analytics and monitoring 
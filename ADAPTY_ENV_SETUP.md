# Adapty Environment Setup

## Required Environment Variables

Add the following environment variables to your `.env` file or deployment environment:

### VALIDATATION_METHOD
Choose the validation method for subscriptions.

```bash
VALIDATATION_METHOD=adapty
# or
VALIDATATION_METHOD=apple
```

### ADAPTY_SECRET_API_KEY
Your Adapty secret API key for server-side API access (required when using Adapty validation).

```bash
ADAPTY_SECRET_API_KEY=your_adapty_secret_api_key_here
```

## How to Get Your Adapty Secret API Key

1. Log in to your [Adapty Dashboard](https://app.adapty.io/)
2. Go to **App Settings** → **General** → **API Keys**
3. Copy your **Secret Token** (not the Public SDK key)
4. Add it to your environment variables

## Testing the Integration

The Adapty validation will:
1. Use the customer user ID (user_id from your request)
2. Call Adapty's server-side API to get the user's profile
3. Check if the user has any active subscriptions
4. Return validation success/failure accordingly

## API Reference

The validation uses Adapty's Server-Side API:
- **Endpoint**: `GET https://api.adapty.io/api/v2/server-side-api/profile/`
- **Headers**:
  - `adapty-customer-user-id`: The user ID
  - `Authorization`: `Api-Key YOUR_SECRET_API_KEY`
  - `Content-Type`: `application/json`

## Important Notes

- The `user_id` in your subscription request should match the customer user ID you use in Adapty
- Make sure the user has been identified in Adapty before calling this validation
- Active subscriptions in Adapty will be considered valid 
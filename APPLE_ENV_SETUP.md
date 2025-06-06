# Apple Store Server API Environment Setup

## Required Environment Variables

Add these to your `.env` file or deployment environment:

```bash
# Apple Store Server API Credentials
APPLE_KEY_ID=92S3H8WB7U
APPLE_ISSUER_ID=your-issuer-id-here
APPLE_BUNDLE_ID=com.unsentpro.app
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n
```

## Where to Find These Values

### APPLE_KEY_ID
- Already extracted from filename: `92S3H8WB7U`

### APPLE_ISSUER_ID  
- Found in App Store Connect → Users and Access → Keys → View Key Details
- Format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### APPLE_BUNDLE_ID
- Your app's bundle identifier (e.g., `com.unsentpro.app`)

### APPLE_PRIVATE_KEY
- The private key converted to single-line string format (already done above)
- **Important**: Keep the quotes around the entire key string

## Usage in Code

The `apple-validation.ts` utility will automatically use these environment variables:

```typescript
const credentials = {
  keyId: process.env.APPLE_KEY_ID,           // 92S3H8WB7U
  issuerId: process.env.APPLE_ISSUER_ID,     // Your issuer ID
  bundleId: process.env.APPLE_BUNDLE_ID,     // com.unsentpro.app  
  privateKey: process.env.APPLE_PRIVATE_KEY  // The string key
};
```

## Testing

Once environment variables are set, test with:

```bash
curl -X POST "http://localhost:3000/api/add-subscription" \
  -H "Content-Type: application/json" \
  -H "Authorization: 2f71a653-2d5c-4ce1-a231-f71e56c9bb77" \
  -d '{
    "user_id": "test_user",
    "product": "com.unsentpro.monthly", 
    "price": 4.99,
    "currency": "USD",
    "platform": "ios",
    "transaction_id": "1000000123456789",
    "original_transaction_id": "1000000123456789",
    "purchase_date": "2024-01-15T10:30:00Z",
    "environment": "sandbox"
  }'
```

## Security Notes

⚠️ **Important Security Practices:**
- Never commit your `.env` file to version control
- Add `.env` to your `.gitignore` file
- Use different keys for development/production
- Rotate keys periodically
- Keep the .p8 file secure and backed up

## Troubleshooting

### Common Issues:

1. **"Cannot find module 'jose'"**
   ```bash
   npm install jose
   ```

2. **"Missing required Apple credentials"**
   - Check all environment variables are set
   - Verify no extra spaces or quotes

3. **"Failed to generate Apple JWT"**
   - Verify private key format (should include BEGIN/END lines)
   - Check Key ID matches your App Store Connect key

4. **"Apple API authentication failed"**
   - Verify Issuer ID is correct
   - Check bundle ID matches your app
   - Ensure API key has proper permissions 
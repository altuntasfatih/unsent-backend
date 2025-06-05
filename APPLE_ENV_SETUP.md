# Apple Store Server API Environment Setup

## Required Environment Variables

Create a `.env` file in your backend directory with these variables:

```env
# Apple Store Server API Configuration
# Get these values from App Store Connect > Users and Access > Keys

# Your App Store Connect API Key ID (e.g., "2X9R4HXF34")
APPLE_KEY_ID=your_key_id_here

# Your Issuer ID from App Store Connect (e.g., "57246542-96fe-1a63-e053-0824d011072a")
APPLE_ISSUER_ID=your_issuer_id_here

# Your app's bundle ID (e.g., "com.unsentpro.app")
APPLE_BUNDLE_ID=com.unsentpro.app

# Your private key content from the .p8 file (include the full PEM format)
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
(your actual private key content here)
...
-----END PRIVATE KEY-----"

# Environment: 'production' or 'sandbox'  
APPLE_ENVIRONMENT=sandbox
```

## How to Get Your Apple Credentials

### 1. Create App Store Connect API Key
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to **Users and Access** → **Keys**
3. Click **Generate API Key**
4. Fill in:
   - **Name**: "Transaction Validation API"
   - **Access**: "App Manager" (minimum required)
5. Click **Generate**
6. **Download the .p8 file** (you can only download it once!)
7. Note the **Key ID** and **Issuer ID**

### 2. Convert .p8 File to Environment Variable
```bash
# View your private key content
cat AuthKey_XXXXXXXXXX.p8

# Copy the entire content (including BEGIN/END lines) to APPLE_PRIVATE_KEY
```

### 3. Find Your Bundle ID
- Your iOS app's bundle identifier (e.g., `com.unsentpro.app`)
- Found in Xcode project settings or App Store Connect

### 4. Test the Setup
```bash
# Install dependencies first
npm install

# Test API call
curl -X POST http://localhost:3000/api/add-subscription \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test123",
    "product": "com.unsentpro.monthly",
    "platform": "ios",
    "price": 9.99,
    "currency": "USD",
    "transaction_id": "1000000123456789",
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
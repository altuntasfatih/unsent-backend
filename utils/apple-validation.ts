import { SignJWT, importPKCS8, jwtVerify } from 'jose';
import { logger } from './logger.js';

// Constants
const APPLE_API_ENDPOINTS = {
  production: 'https://api.storekit.itunes.apple.com',
  sandbox: 'https://api.storekit-sandbox.itunes.apple.com'
} as const;

const JWT_EXPIRATION_TIME = 7200; // 2 hours in seconds
const TRANSACTION_ID_PATTERN = /^\d+$/;

// Types
export type Environment = 'production' | 'sandbox';

export interface AppleCredentials {
  keyId: string;
  issuerId: string;
  bundleId: string;
  privateKey: string;
}

export interface AppleTransactionInfo {
  transactionId: string;
  originalTransactionId: string;
  bundleId: string;
  productId: string;
  purchaseDate: number;
  originalPurchaseDate: number;
  quantity: number;
  type: string;
  inAppOwnershipType: string;
  signedDate: number;
  environment: string;
  transactionReason: string;
  storefront: string;
  storefrontId: string;
}

export interface AppleValidationResult {
  isValid: boolean;
  error?: string;
  transactionInfo?: AppleTransactionInfo;
}

export interface SubscriptionValidationRequest {
  customer_user_id: string;
  product: string;
  price: number;
  currency: string;
  platform?: string;
  transaction_id?: string;
  original_transaction_id?: string;
  purchase_date?: string;
  environment?: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  processedData?: {
    shouldValidateApple: boolean;
    validationPassed: boolean;
    transactionInfo?: AppleTransactionInfo;
  };
}

// Utility functions
function getAppleCredentials(): AppleCredentials {
  const keyId = process.env.APPLE_KEY_ID;
  const issuerId = process.env.APPLE_ISSUER_ID;
  const bundleId = process.env.APPLE_BUNDLE_ID;
  const privateKey = process.env.APPLE_PRIVATE_KEY;

  if (!keyId || !issuerId || !bundleId || !privateKey) {
    throw new Error('Missing required Apple credentials. Set APPLE_KEY_ID, APPLE_ISSUER_ID, APPLE_BUNDLE_ID, and APPLE_PRIVATE_KEY environment variables.');
  }

  return { keyId, issuerId, bundleId, privateKey };
}

function validateTransactionIdFormat(transactionId: string): boolean {
  return Boolean(transactionId) && TRANSACTION_ID_PATTERN.test(transactionId);
}

function isValidEnvironment(environment: string): environment is Environment {
  return environment === 'production' || environment === 'sandbox';
}

// JWT functions
async function generateAppleJWT(credentials: AppleCredentials): Promise<string> {
  try {
    // Import the private key for ES256 signing
    const pkcs8Key = await importPKCS8(credentials.privateKey, 'ES256');

    // Create and sign the JWT
    const jwt = await new SignJWT({
      iss: credentials.issuerId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + JWT_EXPIRATION_TIME,
      aud: 'appstoreconnect-v1',
      bid: credentials.bundleId
    })
    .setProtectedHeader({
      alg: 'ES256',
      kid: credentials.keyId,
      typ: 'JWT'
    })
    .sign(pkcs8Key);

    return jwt;
  } catch (error) {
    logger.error('JWT generation failed', { error });
    throw new Error(`Failed to generate Apple JWT: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function verifyAppleJWT(jwt: string, credentials: AppleCredentials): Promise<boolean> {
  try {
    // First, verify the JWT signature cryptographically
    const pkcs8Key = await importPKCS8(credentials.privateKey, 'ES256');
    
    try {
      const { payload, protectedHeader } = await jwtVerify(jwt, pkcs8Key, {
        issuer: credentials.issuerId,
        audience: 'appstoreconnect-v1',
        algorithms: ['ES256']
      });

      // Additional claims verification
      if (protectedHeader.kid !== credentials.keyId) {
        logger.error('JWT verification failed', { reason: 'Key ID mismatch' });
        return false;
      }

      if (payload.bid !== credentials.bundleId) {
        logger.error('JWT verification failed', { reason: 'Bundle ID mismatch' });
        return false;
      }

      // Verify timing claims with clock skew tolerance
      const now = Math.floor(Date.now() / 1000);
      
      if (payload.iat && payload.iat > now + 60) { // Allow 60 seconds clock skew
        logger.error('JWT verification failed', { reason: 'Token issued in the future' });
        return false;
      }

      logger.info('JWT verification successful', { 
        details: 'signature and claims validated' 
      });
      return true;

    } catch (jwtError) {
      logger.error('JWT signature verification failed', { error: jwtError });
      return false;
    }

  } catch (error) {
    logger.error('JWT verification failed during key import', { error });
    return false;
  }
}

// Parse functions
function parseJWS(jws: string): AppleTransactionInfo | null {
  try {
    const parts = jws.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWS format');
    }
    
    // Decode the payload (middle part)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    
    // Map the payload to our interface
    return {
      transactionId: payload.transactionId,
      originalTransactionId: payload.originalTransactionId,
      bundleId: payload.bundleId,
      productId: payload.productId,
      purchaseDate: payload.purchaseDate,
      originalPurchaseDate: payload.originalPurchaseDate,
      quantity: payload.quantity,
      type: payload.type,
      inAppOwnershipType: payload.inAppOwnershipType,
      signedDate: payload.signedDate,
      environment: payload.environment,
      transactionReason: payload.transactionReason,
      storefront: payload.storefront,
      storefrontId: payload.storefrontId
    };
  } catch (error) {
    logger.error('Error parsing JWS', { error });
    return null;
  }
}

function handleApiError(status: number, statusText: string): AppleValidationResult {
  switch (status) {
    case 401:
      return { 
        isValid: false, 
        error: 'Apple API authentication failed - check your JWT credentials' 
      };
    case 404:
      return { 
        isValid: false, 
        error: 'Transaction not found' 
      };
    default:
      return { 
        isValid: false, 
        error: `Apple API request failed: ${status} ${statusText}` 
      };
  }
}

// Main validation functions
export async function validateAppleTransaction(
  transactionId: string,
  environment: string
): Promise<AppleValidationResult> {
  try {
    // Input validation
    if (!validateTransactionIdFormat(transactionId)) {
      return { isValid: false, error: 'Invalid transaction ID format' };
    }

    if (!isValidEnvironment(environment)) {
      return { isValid: false, error: 'Invalid environment. Must be "production" or "sandbox"' };
    }

    logger.info('Validating Apple transaction', { 
      transactionId, 
      environment 
    });

    // Get credentials and generate JWT
    const credentials = getAppleCredentials();
    const jwt = await generateAppleJWT(credentials);
    
    // Verify the generated JWT is valid
    const isJWTValid = await verifyAppleJWT(jwt, credentials);
    if (!isJWTValid) {
      return { 
        isValid: false, 
        error: 'Generated JWT failed validation - check your Apple credentials' 
      };
    }

    // Construct API URL
    const baseUrl = APPLE_API_ENDPOINTS[environment];
    const url = `${baseUrl}/inApps/v2/transactions/${transactionId}`;

    logger.info('Calling Apple Store Server API', { 
      url,
      transactionId 
    });
    
    // Make API request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
    });

    logger.info('Apple API response received', { 
      status: response.status,
      transactionId 
    });

    // Handle non-OK responses
    if (!response.ok) {
      return handleApiError(response.status, response.statusText);
    }

    // Parse response
    const data = await response.json();
    
    if (!data.signedTransactionInfo) {
      return { 
        isValid: false, 
        error: 'No transaction info in response' 
      };
    }

    logger.info('Transaction validated successfully', { 
      transactionId,
      environment 
    });
    
    // Parse transaction info from JWS
    const transactionInfo = parseJWS(data.signedTransactionInfo);
    
    if (!transactionInfo) {
      return { 
        isValid: false, 
        error: 'Failed to parse transaction info' 
      };
    }

    return { 
      isValid: true, 
      transactionInfo 
    };

  } catch (error) {
    logger.error('Apple Store Server API validation error', { 
      error,
      transactionId,
      environment 
    });
    return { 
      isValid: false, 
      error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

export async function validateSubscriptionRequest(
  request: SubscriptionValidationRequest
): Promise<ValidationResult> {
  try {
    // Basic field validation
    const { customer_user_id, product, price, currency, platform, transaction_id, environment } = request;
    
    if (!customer_user_id || !product || !price || !currency) {
      return { 
        isValid: false, 
        error: 'Missing required fields: customer_user_id, product, price, currency' 
      };
    }

    // Check if Apple validation is needed
    const shouldValidateApple = platform?.toLowerCase() === 'ios';
    
    if (shouldValidateApple) {
      // Validate required Apple fields
      if (!transaction_id || !environment) {
        return { 
          isValid: false, 
          error: 'Missing required iOS fields: transaction_id, environment' 
        };
      }

      // Perform Apple transaction validation
      logger.info(`Performing Apple validation for transaction: ${transaction_id}`);
      const appleValidation = await validateAppleTransaction(transaction_id, environment);
      
      if (!appleValidation.isValid) {
        return { 
          isValid: false, 
          error: `Apple transaction validation failed: ${appleValidation.error}` 
        };
      }

      logger.info('Apple transaction validated successfully', { 
        transaction_id 
      });
      
      return {
        isValid: true,
        processedData: {
          shouldValidateApple: true,
          validationPassed: true,
          transactionInfo: appleValidation.transactionInfo
        }
      };
    }

    // Non-iOS platform - basic validation only
    return {
      isValid: true,
      processedData: {
        shouldValidateApple: false,
        validationPassed: true
      }
    };

  } catch (error) {
    console.error('Subscription validation error:', error);
    return { 
      isValid: false, 
      error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}


import type {
  PurchaseRequest,
  PurchaseResponse,
  Subscription,
  ProductType
} from '../types/types.js';
import { ProductEnum } from '../types/types.js';
import { withAuth } from '../utils/with-auth.js';
import { addSubscription, getActiveSubscriptionByTransactionId } from '../utils/supabase.js';
import { validateAdaptySubscription } from '../utils/adapty-validation.js';
import { validateAppleTransaction } from '../utils/apple-validation.js';
import { validateRevenueCatSubscription } from '../utils/revenuecat-validation.js';
import { sendSuccessResponse, sendErrorResponse } from '../utils/response-helpers.js';
import { logger } from '../utils/logger.js';

// Constants
const SUBSCRIPTION_DURATIONS = {
  [ProductEnum.Weekly]: 7,
  [ProductEnum.Monthly]: 30,
  [ProductEnum.Yearly]: 365
} as const;

// Helper Functions
function calculateExpiry(purchaseDate: Date, product: ProductType): Date {
  const daysToAdd = SUBSCRIPTION_DURATIONS[product];
  
  if (!daysToAdd) {
    throw new Error(`Unknown subscription type: ${product}`);
  }

  const expireDate = new Date(purchaseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  expireDate.setHours(23, 59, 59, 999);
  return expireDate;
}

async function checkExistingSubscription(transactionId?: string): Promise<Subscription | null> {
  if (typeof transactionId !== 'string' || transactionId.trim() === '') {
    return null;
  }
  
  const existingSubscription = await getActiveSubscriptionByTransactionId(transactionId);
  
  if (existingSubscription) {
    logger.info('Found existing active subscription', { transactionId });
  } else {
    logger.info('No existing subscription found', { transactionId });
  }
  
  return existingSubscription;
}

async function validateSubscriptionWithProvider(
  customer_user_id: string, 
  transaction_id: string, 
  environment: string
): Promise<{ isValid: boolean; error?: string }> {
  const validationMethod = process.env.VALIDATATION_METHOD;
  
  if (validationMethod === 'adapty') {
    const adaptyValidation = await validateAdaptySubscription(customer_user_id);
    if (!adaptyValidation.isValid) {
      logger.warn('Adapty subscription validation failed', { 
        customer_user_id,
        error: adaptyValidation.error 
      });
      return { 
        isValid: false, 
        error: `Adapty subscription validation failed: ${adaptyValidation.error}` 
      };
    }
    logger.info('Adapty subscription validated successfully', { customer_user_id });
    return { isValid: true };
  } 
  
  if (validationMethod === 'apple') {
    const appleValidation = await validateAppleTransaction(transaction_id, environment);
    if (!appleValidation.isValid) {
      logger.warn('Apple subscription validation failed', { 
        customer_user_id,
        transaction_id,
        error: appleValidation.error 
      });
      return { 
        isValid: false, 
        error: `Apple subscription validation failed: ${appleValidation.error}` 
      };
    }
    logger.info('Apple subscription validated successfully', { 
      customer_user_id,
      transaction_id 
    });
    return { isValid: true };
  } 
  
  if (validationMethod === 'revenuecat') {
    const revenueCatValidation = await validateRevenueCatSubscription(customer_user_id);
    if (!revenueCatValidation.isValid) {
      logger.warn('RevenueCat subscription validation failed', { 
        customer_user_id,
        error: revenueCatValidation.error 
      });
      return { 
        isValid: false, 
        error: `RevenueCat subscription validation failed: ${revenueCatValidation.error}` 
      };
    }
    logger.info('RevenueCat subscription validated successfully', { customer_user_id });
    return { isValid: true };
  }
  
  return { isValid: true };
}

// Main Handler
async function handler(req: any, res: any) {
  // 1. Validate HTTP method
  if (req.method !== 'POST') {
    return sendErrorResponse<PurchaseResponse>(
      res,
      'Method not allowed',
      405
    );
  }

  // 2. Extract and validate request body
  const {
    customer_user_id,
    product,
    price,
    currency,
    platform,
    transaction_id,
    original_transaction_id,
    purchase_date,
    environment
  } = req.body as PurchaseRequest || {};

  // Basic field validation
  if (!customer_user_id || !product || !price || !currency) {
    return sendErrorResponse<PurchaseResponse>(
      res,
      'Missing required fields: customer_user_id, product, price, and currency are required'
    );
  }

  // 3. Check for existing subscription
  const existingSubscription = await checkExistingSubscription(transaction_id);
  if (existingSubscription) {
    return sendSuccessResponse<PurchaseResponse>(
      res,
      { subscription: existingSubscription }
    );
  }

  // 4. Validate subscription with provider
  const validationResult = await validateSubscriptionWithProvider(
    customer_user_id, 
    transaction_id, 
    environment
  );
  
  if (!validationResult.isValid) {
    return sendErrorResponse<PurchaseResponse>(
      res,
      validationResult.error || 'Subscription validation failed'
    );
  }

  // 5. Calculate subscription expiry date
  let expires_at: Date;
  try {
    expires_at = calculateExpiry(new Date(purchase_date), product as ProductType);
  } catch (err: any) {
    return sendErrorResponse<PurchaseResponse>(
      res,
      err.message,
      400
    );
  }

  // 6. Create new subscription object
  const newSubscription: Subscription = {
    customer_user_id,
    product: product as ProductType,
    price,
    currency,
    is_active: true,
    platform,
    transaction_id,
    original_transaction_id,
    purchase_date,
    environment,
    expires_at
  };

  // 7. Insert subscription into database
  const { error } = await addSubscription(newSubscription);
  if (error) {
    return sendErrorResponse<PurchaseResponse>(
      res,
      error.message,
      500
    );
  }

  // 8. Return success response
  return sendSuccessResponse<PurchaseResponse>(
    res,
    { subscription: newSubscription }
  );
}

export default withAuth(handler); 
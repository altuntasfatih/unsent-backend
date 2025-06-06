import type {
  AddSubscriptionRequest,
  AddSubscriptionResponse,
  Subscription,
  ProductType
} from '../types/types.js';
import { ProductEnum } from '../types/types.js';
import { withAuth } from '../utils/with-auth.js';
import { addSubscription, getActiveSubscriptionByTransactionId } from '../utils/supabase.js';
import { validateAdaptySubscription } from '../utils/adapty-validation.js';
import { validateAppleTransaction } from '../utils/apple-validation.js';
import { sendSuccessResponse, sendErrorResponse } from '../utils/response-helpers.js';

const SUBSCRIPTION_DURATIONS = {
  [ProductEnum.Weekly]: 7,
  [ProductEnum.Monthly]: 30,
  [ProductEnum.Yearly]: 365
} as const;

function calculateExpiry(purchaseDate: Date, product: ProductType): Date {
  const daysToAdd = SUBSCRIPTION_DURATIONS[product];
  
  if (!daysToAdd) {
    throw new Error(`Unknown subscription type: ${product}`);
  }

  const expireDate = new Date(purchaseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  expireDate.setHours(23, 59, 59, 999);
  return expireDate;
}

async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    user_id,
    product,
    price,
    currency,
    platform,
    transaction_id,
    original_transaction_id,
    purchase_date,
    environment
  } = req.body as AddSubscriptionRequest || {};

  // Basic field validation
  if (!user_id || !product || !price || !currency) {
    return sendErrorResponse<AddSubscriptionResponse>(
      res,
      'Missing required fields: user_id, product, price, and currency are required'
    );
  }

  // Validate subscription based on configured method
  if (process.env.VALIDATATION_METHOD === 'adapty') {
    // Validate subscription with Adapty
    const adaptyValidation = await validateAdaptySubscription(user_id);
    if (!adaptyValidation.isValid) {
      return sendErrorResponse<AddSubscriptionResponse>(
        res,
        `Adapty subscription validation failed: ${adaptyValidation.error}`
      );
    }

    console.log('Adapty subscription validated successfully for user:', user_id);

  } else if (process.env.VALIDATATION_METHOD === 'apple' && transaction_id) {
    // Check for existing active subscription
    const existingSubscription = await getActiveSubscriptionByTransactionId(transaction_id);
    
    if (existingSubscription) {
      console.log('Returning existing active subscription for transaction:', transaction_id);
      return sendSuccessResponse<AddSubscriptionResponse>(
        res,
        { subscription: existingSubscription }
      );
    } else {
      // Validate with Apple Store Server API
      const appleValidation = await validateAppleTransaction(transaction_id, environment);
      if (!appleValidation.isValid) {
        return sendErrorResponse<AddSubscriptionResponse>(
          res,
          `Apple subscription validation failed: ${appleValidation.error}`
        );
      }
      console.log('Apple subscription validated successfully for user:', user_id);
    }
  }

  // Calculate subscription expiry date
  let expiresAt: Date;
  try {
    expiresAt = calculateExpiry(new Date(purchase_date), product as ProductType);
  } catch (err: any) {
    return sendErrorResponse<AddSubscriptionResponse>(
      res,
      err.message,
      400
    );
  }

  // Create new subscription object
  const newSubscription: Subscription = {
    user_id,
    product: product as ProductType,
    price,
    currency,
    is_active: true,
    platform,
    transaction_id,
    original_transaction_id: original_transaction_id,
    purchase_date,
    environment,
    expires_at: expiresAt
  };

  // Insert subscription into database
  const { error } = await addSubscription(newSubscription);

  if (error) {
    return sendErrorResponse<AddSubscriptionResponse>(
      res,
      error.message,
      500
    );
  }

  // Return success response
  return sendSuccessResponse<AddSubscriptionResponse>(
    res,
    { subscription: newSubscription }
  );
}

export default withAuth(handler);

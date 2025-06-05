import type { 
  AddSubscriptionRequest, 
  AddSubscriptionResponse, 
  Subscription, 
  ProductType 
} from '../types/types.js';
import { ProductEnum } from '../types/types.js';
import { withAuth } from '../utils/with-auth.js';
import { addSubscription, getActiveSubscriptionByTransactionId } from '../utils/supabase.js';
import { validateAppleTransaction } from '../utils/apple-validation.js';
import { sendSuccessResponse, sendErrorResponse } from '../utils/response-helpers.js';

function calculateExpiry(purchaseDate: Date, product: ProductType): Date {
  let daysToAdd = 0;
  
  switch (product) {
    case ProductEnum.Weekly:
      daysToAdd = 7;
      break;
    case ProductEnum.Monthly:
      daysToAdd = 30;
      break;
    case ProductEnum.Yearly:
      daysToAdd = 365;
      break;
    default:
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
      'Missing required fields',
      'user_id, product, price, and currency are required'
    );
  }

  // Validate Apple transaction if platform is iOS
  if (platform?.toLowerCase() === 'ios') {
    if (!transaction_id || !environment) {
      return sendErrorResponse<AddSubscriptionResponse>(
        res,
        'Missing required iOS fields',
        'transaction_id and environment are required for iOS platform'
      );
    }

    // Check for existing active subscription
    const existingSubscription = await getActiveSubscriptionByTransactionId(transaction_id);
    
    if (existingSubscription) {
      console.log('Returning existing active subscription for transaction:', transaction_id);
      return sendSuccessResponse<AddSubscriptionResponse>(
        res,
        { subscription: existingSubscription },
        'Existing active subscription found'
      );
    }

    // Validate with Apple Store Server API
    const validation = await validateAppleTransaction(transaction_id, environment);
    if (!validation.isValid) {
      return sendErrorResponse<AddSubscriptionResponse>(
        res,
        'Apple transaction validation failed',
        validation.error
      );
    }

    console.log('Apple transaction validated successfully:', transaction_id);
  }

  // Calculate subscription expiry date
  let expiresAt: Date;
  try {
    expiresAt = calculateExpiry(new Date(purchase_date), product as ProductType);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
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
    original_transaction_id,
    purchase_date,
    environment,
    expires_at: expiresAt,
  };

  // Insert subscription into database
  const { error } = await addSubscription(newSubscription);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // Return success response
  return sendSuccessResponse<AddSubscriptionResponse>(
    res,
    { subscription: newSubscription },
    'Subscription created successfully'
  );
}

export default withAuth(handler);

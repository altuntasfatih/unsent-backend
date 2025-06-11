import type { GetSubscriptionResponse } from '../types/types.js';
import { withAuth } from '../utils/with-auth.js';
import { getActiveSubscription } from '../utils/supabase.js';
import { sendSuccessResponse, sendErrorResponse } from '../utils/response-helpers.js';

async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return sendErrorResponse<GetSubscriptionResponse>(
      res,
      'Method not allowed: Only GET requests are allowed',
      405
    );
  }

  const { customer_user_id } = req.query;
  if (!customer_user_id || typeof customer_user_id !== 'string') {
    return sendErrorResponse<GetSubscriptionResponse>(
      res,
      'Missing or invalid customer_user_id: customer_user_id query parameter is required and must be a string'
    );
  }

  try {
    const subscription = await getActiveSubscription(customer_user_id);

    if (!subscription) {
      return sendErrorResponse<GetSubscriptionResponse>(
        res,
        `No active subscription found for customer_user_id: ${customer_user_id}`,
        404
      );
    }

    return sendSuccessResponse<GetSubscriptionResponse>(
      res,
      { subscription }
    );

  } catch (error: any) {
    return sendErrorResponse<GetSubscriptionResponse>(
      res,
      `Internal server error: ${error.message || 'An unexpected error occurred'}`,
      500
    );
  }
}

export default withAuth(handler);
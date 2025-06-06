import type { GetSubscriptionResponse } from '../types/types.js';
import { withAuth } from '../utils/with-auth.js';
import { getSubscription } from '../utils/supabase.js';
import { sendSuccessResponse, sendErrorResponse } from '../utils/response-helpers.js';

async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return sendErrorResponse<GetSubscriptionResponse>(
      res,
      'Method not allowed: Only GET requests are allowed',
      405
    );
  }

  const { user_id } = req.query;
  if (!user_id || typeof user_id !== 'string') {
    return sendErrorResponse<GetSubscriptionResponse>(
      res,
      'Missing or invalid user_id: user_id query parameter is required and must be a string'
    );
  }

  try {
    const subscription = await getSubscription(user_id);

    if (!subscription) {
      return sendErrorResponse<GetSubscriptionResponse>(
        res,
        `Subscription not found: No subscription found for user_id: ${user_id}`,
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
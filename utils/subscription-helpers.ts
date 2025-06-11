import { getActiveSubscription } from './supabase.js';
import { logger } from './logger.js';

export async function validateSubscription(
  customer_user_id: string
): Promise<boolean> {
  try {
    const subscription = await getActiveSubscription(customer_user_id);
    
    if (!subscription) {
      logger.warn('No active subscription found', { customer_user_id });
      return false;
    }

    return true;
  } catch (error: any) {
    logger.error('Error validating subscription', { 
      error: error.message, 
      customer_user_id 
    });
    return false;
  }
} 
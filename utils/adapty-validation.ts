import { logger } from './logger.js';

// Constants
const ADAPTY_API_BASE_URL = 'https://api.adapty.io/api/v2/server-side-api';
const API_KEY = process.env.ADAPTY_SECRET_API_KEY;

// Types
interface AdaptyProfile {
  customer_user_id: string;
  subscriptions: {
    [vendorProductId: string]: {
      is_active: boolean;
      will_renew: boolean;
      is_lifetime: boolean;
      expires_at?: string;
      started_at?: string;
      vendor_product_id: string;
      vendor_transaction_id?: string;
      vendor_original_transaction_id?: string;
    };
  };
}

interface AdaptyValidationResult {
  isValid: boolean;
  error?: string;
  profile?: AdaptyProfile;
}

// Main validation function
export async function validateAdaptySubscription(
  customer_user_id: string
): Promise<AdaptyValidationResult> {
  try {
    logger.info('Validating Adapty subscription', { customer_user_id });
        
    // Call Adapty API
    const response = await fetch(`${ADAPTY_API_BASE_URL}/profile/`, {
      method: 'GET',
      headers: {
        'adapty-customer-user-id': customer_user_id,
        'Content-Type': 'application/json',
        'Authorization': `Api-Key ${API_KEY}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Adapty API error', { 
        status: response.status, 
        error: errorText,
        customer_user_id 
      });
      return {
        isValid: false,
        error: `Adapty API error: ${response.status} - ${errorText}`
      };
    }
    
    const profileData = await response.json() as AdaptyProfile;
    logger.info('Adapty profile retrieved successfully', { customer_user_id });
    
    // Check if user has any active subscriptions
    const hasActiveSubscription = Object.values(profileData.subscriptions || {})
      .some(subscription => subscription.is_active);
    
    if (!hasActiveSubscription) {
      logger.warn('No active subscriptions found', { customer_user_id });
      return {
        isValid: false,
        error: 'No active subscriptions found in Adapty profile'
      };
    }
    
    logger.info('Active subscription found', { customer_user_id });
    return {
      isValid: true,
      profile: profileData
    };
    
  } catch (error) {
    logger.error('Adapty validation error', { 
      error,
      customer_user_id 
    });
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error'
    };
  }
} 
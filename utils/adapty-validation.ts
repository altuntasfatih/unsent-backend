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
  customerUserId: string
): Promise<AdaptyValidationResult> {
  try {
    console.log('Validating Adapty subscription for user:', customerUserId);
        
    // Call Adapty API
    const response = await fetch(`${ADAPTY_API_BASE_URL}/profile/`, {
      method: 'GET',
      headers: {
        'adapty-customer-user-id': customerUserId,
        'Content-Type': 'application/json',
        'Authorization': `Api-Key ${API_KEY}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Adapty API error:', response.status, errorText);
      return {
        isValid: false,
        error: `Adapty API error: ${response.status} - ${errorText}`
      };
    }
    
    const profileData = await response.json() as AdaptyProfile;
    console.log('Adapty profile retrieved successfully');
    
    // Check if user has any active subscriptions
    const hasActiveSubscription = Object.values(profileData.subscriptions || {})
      .some(subscription => subscription.is_active);
    
    if (!hasActiveSubscription) {
      return {
        isValid: false,
        error: 'No active subscriptions found in Adapty profile'
      };
    }
    
    console.log('Active subscription found in Adapty profile');
    return {
      isValid: true,
      profile: profileData
    };
    
  } catch (error) {
    console.error('Adapty validation error:', error);
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error'
    };
  }
} 
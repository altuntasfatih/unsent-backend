import { logger } from './logger.js';

// Constants
const REVENUECAT_API_BASE_URL = 'https://api.revenuecat.com/v2';
const API_KEY = process.env.REVENUECAT_SECRET_API_KEY;
const PROJECT_ID = process.env.REVENUECAT_PROJECT_ID;

// Types

interface RevenueCatActiveEntitlement {
  object: 'customer.active_entitlement';
  entitlement_id: string;
  expires_at: number;
}

interface RevenueCatAttribute {
  object: 'customer.attribute';
  name: string;
  value: string;
  updated_at: number;
}

interface RevenueCatExperiment {
  object: 'experiment_enrollment';
  id: string;
  name: string;
  variant: string;
}

interface RevenueCatList<T> {
  object: 'list';
  items: T[];
  next_page?: string;
  url: string;
}

interface RevenueCatCustomer {
  object: 'customer';
  id: string;
  project_id: string;
  first_seen_at: number;
  last_seen_at: number;
  last_seen_app_version: string;
  last_seen_country: string;
  last_seen_platform: string;
  last_seen_platform_version: string;
  active_entitlements: RevenueCatList<RevenueCatActiveEntitlement>;
  experiment?: RevenueCatExperiment;
  attributes: RevenueCatList<RevenueCatAttribute>;
}

interface RevenueCatValidationResult {
  isValid: boolean;
  error?: string;
  customer?: RevenueCatCustomer;
}

// Main validation function
export async function validateRevenueCatSubscription(
  customerUserId: string
): Promise<RevenueCatValidationResult> {
  // Format user ID to ensure proper RevenueCat format
  if (customerUserId.startsWith(':')) {
    customerUserId = customerUserId.replace(':', '$RCAnonymousID:');
  } else if (!customerUserId.startsWith('$RCAnonymousID:')) {
    customerUserId = `$RCAnonymousID:${customerUserId}`;
  }

  try {
    logger.info('Validating RevenueCat subscription', { 
      customerUserId,
      rawUserId: customerUserId,
    });

    if (!PROJECT_ID) {
      throw new Error('REVENUECAT_PROJECT_ID environment variable is not set');
    }

    const apiUrl = `${REVENUECAT_API_BASE_URL}/projects/${PROJECT_ID}/customers/${customerUserId}`;
    
    logger.info('Calling RevenueCat API', { 
      apiUrl,
      customerUserId,
    });

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('RevenueCat API error', {
        status: response.status,
        error: errorText,
        customerUserId
      });
      return {
        isValid: false,
        error: `RevenueCat API error: ${response.status} - ${errorText}`
      };
    }

    const customerData = await response.json() as RevenueCatCustomer;

    logger.info('RevenueCat customer data retrieved successfully', {
      customerUserId,
      entitlements: customerData.active_entitlements?.items?.map(ent => ({
        id: ent.entitlement_id,
        expiresAt: new Date(ent.expires_at).toISOString(),
      })) ?? [],
    });

    const hasActiveEntitlements = Boolean(
      customerData.active_entitlements?.items?.length
    );

    if (!hasActiveEntitlements) {
      logger.warn('No active entitlements found', { customerUserId });
      return {
        isValid: false,
        error: 'No active entitlements found in RevenueCat profile',
      };
    }

    logger.info('Active entitlements found', { customerUserId });
    return {
      isValid: true,
      customer: customerData,
    };

  } catch (error) {
    logger.error('RevenueCat validation error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      customerUserId
    });
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error'
    };
  }
}

// Helper function to get active entitlements
export function getActiveEntitlements(customer: RevenueCatCustomer): RevenueCatActiveEntitlement[] {
  return customer.active_entitlements.items;
}

// Helper function to get customer attributes
export function getCustomerAttributes(customer: RevenueCatCustomer): RevenueCatAttribute[] {
  return customer.attributes.items;
}

// Helper function to get customer email
export function getCustomerEmail(customer: RevenueCatCustomer): string | undefined {
  return customer.attributes.items.find(attr => attr.name === '$email')?.value;
}

// Helper function to check if entitlement is expired
export function isEntitlementExpired(entitlement: RevenueCatActiveEntitlement): boolean {
  return entitlement.expires_at < Date.now();
} 
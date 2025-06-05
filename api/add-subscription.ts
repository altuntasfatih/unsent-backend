import type { AddSubscriptionRequest } from '../types/api.js';
import type { Subscription, ProductType } from '../types/supabase.js';
import { ProductEnum } from '../types/supabase.js';
import { withAuth } from '../utils/with-auth.js';
import { addSubscription } from '../utils/supabase.js';

function calculateExpiry(product: ProductType): string {
  const now = new Date();
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
  const expireDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  expireDate.setHours(23, 59, 59, 999);
  return expireDate.toISOString();
}

async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user_id, product, price, currency } = req.body as AddSubscriptionRequest || {};
  if (!user_id || !product || !price || !currency) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  let expires_at: string;
  try {
    expires_at = calculateExpiry(product as ProductType);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }

  const newSubscription: Subscription = {
    user_id,
    product: product as ProductType,
    price,
    currency,
    is_active: true,
    expires_at,
  };

  const { error } = await addSubscription(newSubscription);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true, expires_at });
}

export default withAuth(handler);

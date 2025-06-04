import { createClient } from '@supabase/supabase-js';
import type { Subscription } from '../types/supabase';
import { withAuth } from '../utils/with-auth.js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user_id } = req.query;
  if (!user_id || typeof user_id !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid user_id' });
  }

  const { data, error } = await supabase
    .from('subscription')
    .select('*')
    .eq('user_id', user_id)
    .maybeSingle<Subscription>();

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  if (!data) {
    return res.status(404).json({ error: 'Subscription not found' });
  }

  return res.status(200).json({ success: true, subscription: data as Subscription });
}

export default withAuth(handler);
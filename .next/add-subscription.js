import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
function calculateExpiry(product) {
    const now = new Date();
    let daysToAdd = 0;
    switch (product) {
        case 'com.unsentpro.weekly':
            daysToAdd = 7;
            break;
        case 'com.unsentpro.monthly':
            daysToAdd = 30;
            break;
        case 'com.unsentpro.yearly':
            daysToAdd = 365;
            break;
        default:
            throw new Error(`Unknown subscription type: ${product}`);
    }
    const expireDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    expireDate.setHours(23, 59, 59, 999);
    return expireDate.toISOString();
}
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    const { user_id, product, price, currency } = req.body || {};
    if (!user_id || !product || !price || !currency) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    let expires_at;
    try {
        expires_at = calculateExpiry(product);
    }
    catch (err) {
        return res.status(400).json({ error: err.message });
    }
    const { error } = await supabase.from('subscription').insert([
        {
            user_id,
            product,
            price,
            currency,
            is_active: true,
            expires_at,
        },
    ]);
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ success: true, expires_at });
}

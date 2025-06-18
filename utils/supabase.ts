import { createClient } from '@supabase/supabase-js';
import type { MessageLog, Subscription } from '../types/types.js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

export async function getActiveSubscription(customer_user_id: string): Promise<Subscription | null> {
  customer_user_id = customer_user_id.trim();
  const { data } = await supabase
    .from('subscription')
    .select('*')
    .eq('is_active', true)
    .eq('customer_user_id', customer_user_id)
    .gte('expires_at', new Date().toISOString())
    .maybeSingle<Subscription>();
  
  return data;
}

export async function getActiveSubscriptionByTransactionId(transaction_id: string): Promise<Subscription | null> {
  const { data } = await supabase
    .from('subscription')
    .select('*')
    .eq('transaction_id', transaction_id)
    .eq('is_active', true)
    .gte('expires_at', new Date().toISOString())
    .maybeSingle<Subscription>();
  
  return data;
}

export async function addSubscription(subscription: Subscription): Promise<{ error: any }> {
  return await supabase.from('subscription').insert([subscription]);
}

export async function logMessage(logEntry: MessageLog): Promise<void> {
  const { error } = await supabase.from('message-logs').insert([logEntry]);
  if (error) {
    throw new Error(`Failed to log message: ${error.message}`);
  }
}

export function createLogEntry(
  system_prompt: string,
  user_prompt: string,
  generated_message: string,
  customer_user_id: string,
  user_agent: string,
  ip: string,
): MessageLog {
  return {
    prompt: {
      system_prompt,
      user_prompt,
    },
    generated_message,
    ip,
    user_agent,
    customer_user_id,
  };
} 
import { createClient } from '@supabase/supabase-js';
import type { MessageLog, Subscription } from '../types/types.js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

export async function getSubscription(userId: string): Promise<Subscription | null> {
  const { data } = await supabase
    .from('subscription')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle<Subscription>();
  
  return data;
}

export async function getActiveSubscriptionByTransactionId(transactionId: string): Promise<Subscription | null> {
  const { data } = await supabase
    .from('subscription')
    .select('*')
    .eq('transaction_id', transactionId)
    .eq('is_active', true)
    .gte('expires_at', new Date().toISOString())
    .maybeSingle<Subscription>();
  
  return data;
}

export async function addSubscription(subscription: Subscription): Promise<{ error: any }> {
  return await supabase.from('subscription').insert([subscription]);
}

export async function validateSubscription(userId: string): Promise<void> {
  const { data: subscription, error: subError } = await supabase
    .from('subscription')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (subError) {
    throw new Error(`Subscription check failed: ${subError.message}`);
  }

  if (!subscription?.is_active || new Date(subscription.expires_at) < new Date()) {
    throw new Error('You do not have an active subscription.');
  }
}

export async function logMessage(logEntry: MessageLog): Promise<void> {
  const { error } = await supabase.from('message-logs').insert([logEntry]);
  if (error) {
    throw new Error(`Failed to log message: ${error.message}`);
  }
}

export function createLogEntry(
  userPrompt: string,
  generatedMessage: string,
  userId: string,
  userAgent: string,
  ip: string,
): MessageLog {
  return {
    input_prompt: userPrompt,
    generated_message: generatedMessage,
    ip,
    user_agent: userAgent,
    user_id: userId,
  };
} 
// API Types
export interface GenerateCustomMessageRequest {
  user_id: string;
  device_id?: string;
  tone?: string;
  context?: string;
  rawMessage?: string;
}

export interface GenerateStructuredMessageRequest {
  user_id: string;
  device_id?: string;
  recipient?: string;
  messageType?: string;
  additionalNotes?: string;
  wordCount?: number;
  answers?: Answer[];
}

export interface Answer {
  question: string;
  selectedOption?: string;
  customInput?: string;
}

export interface Prompts {
  systemPrompt: string;
  userPrompt: string;
}

export type AddSubscriptionRequest = {
  user_id: string;
  product: string;
  price: number;
  currency: string;
};

// Supabase Types
export type ProductType = 'com.unsentpro.weekly' | 'com.unsentpro.monthly' | 'com.unsentpro.yearly';

export enum ProductEnum {
  Weekly = 'com.unsentpro.weekly',
  Monthly = 'com.unsentpro.monthly',
  Yearly = 'com.unsentpro.yearly',
}

export type Subscription = {
  id?: number;
  user_id: string;
  product: ProductType;
  price: number;
  currency: string;
  is_active: boolean;
  expires_at: string;
};

export type MessageLog = {
  id?: number;
  input_prompt: string;
  generated_message: string;
  ip?: string | null;
  user_agent?: string | null;
  device_id?: string | null;
  user_id: string;
}; 
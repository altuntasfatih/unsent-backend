// API Types
export interface GenerateCustomMessageRequest {
  user_id: string;
  tone: string;
  context: string;
  rawMessage: string;
}

export interface GenerateStructuredMessageRequest {
  user_id: string;
  recipient?: string;
  messageType: string;
  additionalNotes?: string;
  wordCount: number;
  answers: Answer[];
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

export interface AddSubscriptionRequest {
  user_id: string;
  product: ProductType;
  price: number;
  currency: string;
  platform: string;
  transaction_id: string;
  original_transaction_id?: string;
  purchase_date: string;
  environment: string;
}

// Base API Response
export interface BaseResponse {
  success: boolean;
  error?: string;
}

// Specific Response Types
export interface AddSubscriptionResponse extends BaseResponse {
  subscription: Subscription;
}

export interface GetSubscriptionResponse extends BaseResponse {
  subscription: Subscription;
}

export interface MessageGenerationResponse extends BaseResponse {
  input_prompt: string;
  generated_message: string;
}

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
  platform: string;
  transaction_id: string;
  original_transaction_id?: string,
  purchase_date: string;
  environment: string;
  expires_at: Date;
};

export type MessageLog = {
  id?: number;
  user_id: string;
  input_prompt: string;
  generated_message: string;
  ip?: string | null;
  user_agent?: string | null;
}; 
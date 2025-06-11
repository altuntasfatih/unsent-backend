// API Types
export interface GenerateCustomMessageRequest {
  customer_user_id: string;
  tone: string;
  context: string;
  raw_message: string;
}

export interface GenerateStructuredMessageRequest {
  customer_user_id: string;
  recipient?: string;
  message_type: string;
  additional_notes?: string;
  word_count: number;
  answers: Answer[];
}

export interface Answer {
  question: string;
  selected_option?: string;
  custom_input?: string;
}

export interface Prompts {
  system_prompt: string;
  user_prompt: string;
}

export interface PurchaseRequest {
  customer_user_id: string;
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
export interface PurchaseResponse extends BaseResponse {
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
  customer_user_id: string;
  product: ProductType;
  price: number;
  currency: string;
  is_active: boolean;
  platform: string;
  transaction_id: string;
  original_transaction_id?: string;
  purchase_date: string;
  environment: string;
  expires_at: Date;
};

export type MessageLog = {
  id?: number;
  customer_user_id: string;
  input_prompt: string;
  generated_message: string;
  ip?: string | null;
  user_agent?: string | null;
}; 
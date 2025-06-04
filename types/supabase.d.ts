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
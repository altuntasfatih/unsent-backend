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
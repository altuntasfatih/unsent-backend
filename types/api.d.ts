export type Answer = {
  question: string;
  selectedOption?: string;
  customInput?: string;
};

export type GenerateMessageRequest = {
  user_id: string;
  recipient?: string;
  messageType?: string;
  additionalNotes?: string;
  answers?: Answer[];
  device_id?: string;
};

export type AddSubscriptionRequest = {
  user_id: string;
  product: string;
  price: number;
  currency: string;
}; 
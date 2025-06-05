import { OpenAI } from 'openai';

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
export const OPENAI_MODEL = 'gpt-3.5-turbo';

interface GenerateMessageOptions {
  maxTokens?: number;
  temperature?: number;
}

export async function generateMessageWithAI(
  systemPrompt: string, 
  userPrompt: string, 
  options: GenerateMessageOptions = {}
): Promise<string> {
  const { maxTokens = 600, temperature = 0.8 } = options;

  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: maxTokens,
    temperature,
  });

  return completion.choices[0]?.message?.content || '';
} 
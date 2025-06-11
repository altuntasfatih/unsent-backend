import { OpenAI } from 'openai';

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
export const OPENAI_MODEL = 'gpt-3.5-turbo';

interface GenerateMessageOptions {
  max_tokens?: number;
  temperature?: number;
}

export async function generateMessageWithAI(
  system_prompt: string, 
  user_prompt: string, 
  options: GenerateMessageOptions = {}
): Promise<string> {
  const { max_tokens = 600, temperature = 0.8 } = options;

  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: system_prompt },
      { role: 'user', content: user_prompt },
    ],
    max_tokens,
    temperature,
  });

  return completion.choices[0]?.message?.content || '';
} 
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import type { GenerateMessageRequest, Answer } from '../types/api';
import type { MessageLog } from '../types/supabase';
import { withAuth } from '../utils/with-auth';
import { promises as fs } from 'fs';
import path from 'path';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

async function getPrompts() {
  const filePath = path.join(process.cwd(), 'prompts', 'break-up-message.json');
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data) as {
    systemPrompt: string;
    userPromptStructure: string;
  };
}

function formatUserPrompt(structure: string, body: GenerateMessageRequest): string {
  const { recipient, messageType, additionalNotes, answers } = body;
  const answersText = (answers || [])
    .map(
      (answer: Answer) =>
        `${answer.question} \n->  ${answer.customInput || answer.selectedOption || '(not answered)'} \n`
    )
    .join('\n');
  return structure
    .replace('{{recipient}}', recipient || '')
    .replace('{{messageType}}', messageType || '')
    .replace('{{additionalNotes}}', additionalNotes || '')
    .replace('{{answersText}}', answersText);
}

async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user_id, recipient, messageType, additionalNotes, answers, device_id } = req.body as GenerateMessageRequest || {};
  if (!user_id) {
    return res.status(400).json({ error: 'Missing user_id' });
  }

  // 1. Check subscription
  const { data: subscription, error: subError } = await supabase
    .from('subscription')
    .select('*')
    .eq('user_id', user_id)
    .maybeSingle();
  if (subError) {
    return res.status(500).json({ error: subError.message });
  }
  if (!subscription || !subscription.is_active || new Date(subscription.expires_at) < new Date()) {
    return res.status(403).json({ error: 'You do not have an active subscription.' });
  }

  // 2. Load prompts
  const { systemPrompt, userPromptStructure } = await getPrompts();
  const user_prompt = formatUserPrompt(userPromptStructure, req.body as GenerateMessageRequest);

  // 3. Call OpenAI
  let generated_message: string;
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: user_prompt },
      ],
      max_tokens: 600,
      temperature: 0.8,
    });
    generated_message = completion.choices[0]?.message?.content || '';
  } catch (err: any) {
    return res.status(500).json({ error: 'OpenAI error', details: err.message });
  }

  // 4. Log to Supabase
  const logEntry: MessageLog = {
    input_prompt: user_prompt,
    generated_message,
    ip: req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || (req.socket as any)?.remoteAddress,
    user_agent: req.headers['user-agent'],
    device_id: device_id || null,
    user_id,
  };
  await supabase.from('message-logs').insert([logEntry]);

  // 5. Respond
  return res.status(200).json({ input_prompt: user_prompt, generated_message });
}

export default withAuth(handler); 
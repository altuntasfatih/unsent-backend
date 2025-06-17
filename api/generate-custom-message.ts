import type { GenerateCustomMessageRequest,  MessageGenerationResponse, Prompts } from '../types/types.js';
import { withAuth } from '../utils/with-auth.js';
import { generateMessageWithAI } from '../utils/openai.js';
import { logMessage, createLogEntry } from '../utils/supabase.js';
import { validateSubscription } from '../utils/subscription-helpers.js';
import { promises as fs } from 'fs';
import path from 'path';
import { sendSuccessResponse, sendErrorResponse } from '../utils/response-helpers.js';
import { createRequestLogger } from '../utils/logger.js';

const MAX_WORDS = 250;
// Utility functions
async function getPrompts(): Promise<Prompts> {
  const filePath = path.join(process.cwd(), 'prompts', 'custom-message.json');
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data) as Prompts;
}

function formatUserPrompt(structure: string, body: GenerateCustomMessageRequest): string {
  const { tone, context, raw_message, word_count } = body;

  return structure
    .replace('{{tone}}', tone || '')
    .replace('{{context}}', context || '')
    .replace('{{requested_word_count}}', word_count.toString())
    .replace('{{max_words}}', MAX_WORDS.toString())
    .replace('{{raw_message}}', raw_message || '');
}

// Main handler
async function handler(req: any, res: any) {
  const requestId = crypto.randomUUID();
  const log = createRequestLogger(requestId);

  if (req.method !== 'POST') {
    log.warn('Invalid method', { method: req.method });
    return sendErrorResponse<MessageGenerationResponse>(
      res,
      'Method not allowed',
      405
    );
  }

  const { customer_user_id } = req.body as GenerateCustomMessageRequest || {};
  if (!customer_user_id) {
    log.warn('Missing customer_user_id in request');
    return sendErrorResponse<MessageGenerationResponse>(
      res,
      'Missing customer_user_id: customer_user_id is required to generate custom message'
    );
  }

  try {
    log.info('Processing custom message request', { customer_user_id });

    // 1. Validate subscription
    const hasValidSubscription = await validateSubscription(customer_user_id);
    if (!hasValidSubscription) {
      return sendErrorResponse<MessageGenerationResponse>(
        res,
        'No active subscription found',
        403
      );
    }
    log.info('Subscription validated', { customer_user_id });

    // 2. Load and format prompts
    const { system_prompt, user_prompt } = await getPrompts();
    const formatted_user_prompt = formatUserPrompt(user_prompt, req.body as GenerateCustomMessageRequest);
    log.info('Prompts loaded and formatted', { customer_user_id });

    // 3. Generate message using the utility function
    const generated_message = await generateMessageWithAI(system_prompt, formatted_user_prompt);
    log.info('Message generated successfully', { customer_user_id });

    // 4. Log the interaction
    const ip = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || (req.socket as any)?.remoteAddress;
    const user_agent = req.headers['user-agent'];
    const log_entry = createLogEntry(formatted_user_prompt, generated_message, customer_user_id, user_agent, ip);
    await logMessage(log_entry);
    log.info('Message logged to database', { customer_user_id });

    // 5. Respond
    log.info('Request completed successfully', { customer_user_id });
    return sendSuccessResponse<MessageGenerationResponse>(
      res,
      {
        input_prompt: formatted_user_prompt,
        generated_message
      }
    );

  } catch (error: any) {
    const status_code = error.message.includes('subscription') ? 403 : 500;
    log.error('Request failed', { 
      error: error.message,
      status_code,
      customer_user_id 
    });
    return sendErrorResponse<MessageGenerationResponse>(
      res,
      error.message || 'An unexpected error occurred',
      status_code
    );
  }
}

export default withAuth(handler); 
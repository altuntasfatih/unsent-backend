import type { GenerateStructuredMessageRequest, MessageGenerationResponse, Answer, Prompts } from '../types/types.js';
import { withAuth } from '../utils/with-auth.js';
import { logMessage, createLogEntry } from '../utils/supabase.js';
import { generateMessageWithAI } from '../utils/openai.js';
import { promises as fs } from 'fs';
import path from 'path';
import { sendSuccessResponse,sendErrorResponse } from '../utils/response-helpers.js';
import { createRequestLogger } from '../utils/logger.js';
import { validateSubscription } from '../utils/subscription-helpers.js';

const MAX_WORDS = 250;

// Utility functions
async function getPrompts(): Promise<Prompts> {
  const filePath = path.join(process.cwd(), 'prompts', 'structured-message.json');
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data) as Prompts;
}

function formatAnswers(answers: Answer[] = []): string {
  return answers
    .map(answer => 
      `${answer.question} \n->  ${answer.custom_input || answer.selected_option || '(not answered)'} \n`
    )
    .join('\n');
}

function formatUserAndSystemPrompts(
  system_prompt: string, 
  user_prompt: string, 
  body: GenerateStructuredMessageRequest
): { system_prompt: string; user_prompt: string } {
  const { recipient, message_type, additional_notes, answers, word_count } = body;
  const answersText = formatAnswers(answers);

  const formattedUserPrompt = user_prompt
    .replace('{{recipient}}', recipient || '')
    .replace('{{message_type}}', message_type || '')
    .replace('{{additional_notes}}', additional_notes || '')
    .replace('{{word_count}}', word_count.toString())
    .replace('{{answersText}}', answersText);

  const formattedSystemPrompt = system_prompt.replace('{{max_words}}', MAX_WORDS.toString());

  return { system_prompt: formattedSystemPrompt, user_prompt: formattedUserPrompt };
}

// Main handler
async function handler(req: any, res: any) {
  const requestId = crypto.randomUUID();
  const log = createRequestLogger(requestId);

  if (req.method !== 'POST') {
    log.warn('Invalid method', { method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { customer_user_id } = req.body as GenerateStructuredMessageRequest || {};
  if (!customer_user_id) {
    log.warn('Missing customer_user_id in request');
    return sendErrorResponse<MessageGenerationResponse>(
      res,
      'Missing customer_user_id',
      400
    );
  }

  try {
    log.info('Processing structured message request', { customer_user_id });

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
    const { 
      system_prompt: formatted_system_prompt, 
      user_prompt: formatted_user_prompt 
    } = formatUserAndSystemPrompts(
      system_prompt, 
      user_prompt, 
      req.body as GenerateStructuredMessageRequest
    );
    log.info('Prompts loaded and formatted', { customer_user_id });

    // 3. Generate message
    const generated_message = await generateMessageWithAI(
      formatted_system_prompt, 
      formatted_user_prompt
    );
    log.info('Message generated successfully', { customer_user_id });

    // 4. Log the interaction
    const ip = req.headers['x-real-ip'] || 
               req.headers['x-forwarded-for'] || 
               (req.socket as any)?.remoteAddress;
    const user_agent = req.headers['user-agent'];
    const log_entry = createLogEntry(
      formatted_system_prompt,
      formatted_user_prompt, 
      generated_message, 
      customer_user_id, 
      user_agent, 
      ip
    );
    await logMessage(log_entry);
    log.info('Message logged to database', { customer_user_id });

    // 5. Respond
    log.info('Request completed successfully', { customer_user_id });
    return sendSuccessResponse<MessageGenerationResponse>(
      res,
      {
        system_prompt: formatted_system_prompt,
        user_prompt: formatted_user_prompt,
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
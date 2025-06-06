import type { GenerateCustomMessageRequest,  MessageGenerationResponse, Prompts } from '../types/types.js';
import { withAuth } from '../utils/with-auth.js';
import { generateMessageWithAI } from '../utils/openai.js';
import { validateSubscription, logMessage, createLogEntry } from '../utils/supabase.js';
import { promises as fs } from 'fs';
import path from 'path';
import { sendSuccessResponse, sendErrorResponse } from '../utils/response-helpers.js';

// Utility functions
async function getPrompts(): Promise<Prompts> {
  const filePath = path.join(process.cwd(), 'prompts', 'custom-message.json');
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data) as Prompts;
}

function formatUserPrompt(structure: string, body: GenerateCustomMessageRequest): string {
  const { tone, context, rawMessage } = body;

  return structure
    .replace('{{tone}}', tone || '')
    .replace('{{context}}', context || '')
    .replace('{{rawMessage}}', rawMessage || '');
}

// Main handler
async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return sendErrorResponse<MessageGenerationResponse>(
      res,
      'Method not allowed',
      405
    );
  }

  const { user_id } = req.body as GenerateCustomMessageRequest || {};
  if (!user_id) {
    return sendErrorResponse<MessageGenerationResponse>(
      res,
      'Missing user_id: user_id is required to generate custom message'
    );
  }

  try {
    // 1. Validate subscription
    await validateSubscription(user_id);

    // 2. Load and format prompts
    const { systemPrompt, userPrompt } = await getPrompts();
    const formattedUserPrompt = formatUserPrompt(userPrompt, req.body as GenerateCustomMessageRequest);

    // 3. Generate message using the utility function
    const generatedMessage = await generateMessageWithAI(systemPrompt, formattedUserPrompt);

    // 4. Log the interaction
    const ip = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || (req.socket as any)?.remoteAddress;
    const logEntry = createLogEntry(formattedUserPrompt, generatedMessage, user_id,  req.headers['user-agent'], ip);
    await logMessage(logEntry);

    // 5. Respond
    return sendSuccessResponse<MessageGenerationResponse>(
      res,
      {
        input_prompt: formattedUserPrompt,
        generated_message: generatedMessage
      }
    );

  } catch (error: any) {
    const statusCode = error.message.includes('subscription') ? 403 : 500;
    return sendErrorResponse<MessageGenerationResponse>(
      res,
      error.message || 'An unexpected error occurred',
      statusCode
    );
  }
}

export default withAuth(handler); 
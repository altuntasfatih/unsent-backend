import type { GenerateStructuredMessageRequest, MessageGenerationResponse, Answer, Prompts } from '../types/types.js';
import { withAuth } from '../utils/with-auth.js';
import { validateSubscription, logMessage, createLogEntry } from '../utils/supabase.js';
import { generateMessageWithAI } from '../utils/openai.js';
import { promises as fs } from 'fs';
import path from 'path';
import { sendErrorResponse } from '../utils/response-helpers.js';

// Utility functions
async function getPrompts(): Promise<Prompts> {
  const filePath = path.join(process.cwd(), 'prompts', 'structured-message.json');
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data) as Prompts;
}

function formatAnswers(answers: Answer[] = []): string {
  return answers
    .map(answer => 
      `${answer.question} \n->  ${answer.customInput || answer.selectedOption || '(not answered)'} \n`
    )
    .join('\n');
}

function formatUserPrompt(structure: string, body: GenerateStructuredMessageRequest): string {
  const { recipient, messageType, additionalNotes, answers, wordCount } = body;
  const answersText = formatAnswers(answers);

  return structure
    .replace('{{recipient}}', recipient || '')
    .replace('{{messageType}}', messageType || '')
    .replace('{{additionalNotes}}', additionalNotes || '')
    .replace('{{wordCount}}', wordCount?.toString() || '')
    .replace('{{answersText}}', answersText);
}

// Main handler
async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user_id } = req.body as GenerateStructuredMessageRequest || {};
  if (!user_id) {

    return sendErrorResponse<MessageGenerationResponse>(
      res,
      'Missing user_id',
      400
    );
  }

  try {
    // 1. Validate subscription
    await validateSubscription(user_id);

    // 2. Load and format prompts
    const { systemPrompt, userPrompt } = await getPrompts();
    const formattedUserPrompt = formatUserPrompt(userPrompt, req.body as GenerateStructuredMessageRequest);

    // 3. Generate message
    const generatedMessage = await generateMessageWithAI(systemPrompt, formattedUserPrompt);

    // 4. Log the interaction
    const ip = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || (req.socket as any)?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const logEntry = createLogEntry(formattedUserPrompt, generatedMessage, user_id, userAgent, ip);
    await logMessage(logEntry);

    // 5. Respond
    return res.status(200).json({
      success: true,
      input_prompt: formattedUserPrompt,
      generated_message: generatedMessage
    } as MessageGenerationResponse);

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
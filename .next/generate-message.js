import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const SYSTEM_PROMPT = 'You are an emotionally aware assistant that helps users generate thoughtful breakup closure letters. Write in first person (I), 150–300 words, and align with the user\'s tone. Integrate emotional complexity with honesty. Acknowledge forgiveness, sadness, or anger respectfully. Never include names unless explicitly provided. End with an emotionally appropriate closing line.';
function formatUserPrompt(body) {
    const { recipient, messageType, additionalNotes, answers } = body;
    const answersText = (answers || [])
        .map((answer) => `${answer.question} \n->  ${answer.customInput || answer.selectedOption || '(not answered)'} \n`)
        .join('\n');
    return `Please generate a breakup message using the following structured inputs:\nRecipient Name: ${recipient}\nMessage Type: ${messageType}\nAdditional Notes from User: ${additionalNotes}\nUser Answers:\n${answersText}\nInstructions:\n- Use the answers to inform tone, emotional content, and closure.\n- If both selectedOption and customInput exist, prefer customInput.\n- If tone is unspecified, default to honest and respectful.\n- Avoid raw profanity or cruelty, even if the user is upset.\n- Keep the message emotionally grounded and cathartic.\n- Only mention the recipient's name once (if needed).\n- End with a meaningful and emotionally fitting closing sentence.`;
}
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    const { user_id, recipient, messageType, additionalNotes, answers, device_id } = req.body || {};
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
    // 2. Format prompts
    const system_prompt = SYSTEM_PROMPT;
    const user_prompt = formatUserPrompt(req.body);
    // 3. Call OpenAI
    let generated_message;
    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: system_prompt },
                { role: 'user', content: user_prompt },
            ],
            max_tokens: 600,
            temperature: 0.8,
        });
        generated_message = completion.choices[0]?.message?.content || '';
    }
    catch (err) {
        return res.status(500).json({ error: 'OpenAI error', details: err.message });
    }
    // 4. Log to Supabase
    await supabase.from('message-logs').insert([
        {
            execution_id: null, // You can generate a UUID if needed
            input_prompt: user_prompt,
            generated_message,
            ip: req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
            user_agent: req.headers['user-agent'],
            device_id: device_id || null,
            user_id,
        },
    ]);
    // 5. Respond
    return res.status(200).json({ input_prompt: user_prompt, generated_message });
}

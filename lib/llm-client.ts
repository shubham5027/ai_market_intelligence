import axios from 'axios';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMCallOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export async function callOpenRouter(options: LLMCallOptions): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: options.model,
        messages: options.messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://competitive-intelligence.ai',
          'X-Title': 'Competitive Intelligence System',
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error: any) {
    console.error('OpenRouter API error:', error.response?.data || error.message);
    throw new Error(`LLM call failed: ${error.message}`);
  }
}

export async function callOpenAI(options: LLMCallOptions): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: options.model,
        messages: options.messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error: any) {
    console.error('OpenAI API error:', error.response?.data || error.message);
    throw new Error(`OpenAI call failed: ${error.message}`);
  }
}

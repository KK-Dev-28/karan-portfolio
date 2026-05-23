import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

const ENGINE_UNAVAILABLE = 'Writing engine is not available at this time. Please try again later.';
const ENGINE_FORMAT_ERR  = 'Writing engine returned an unexpected format. Please try again.';

@Injectable()
export class BlogAiService {
  private client: Anthropic | null = null;

  constructor(cfg: ConfigService) {
    const key = cfg.get<string>('ANTHROPIC_API_KEY');
    if (key) this.client = new Anthropic({ apiKey: key });
  }

  async generate(prompt: string, tone = 'professional', length = 'medium') {
    if (!this.client) throw new BadRequestException(ENGINE_UNAVAILABLE);

    const wordCount = length === 'short' ? '300-500 words' : length === 'long' ? '1000-1500 words' : '600-900 words';

    try {
      const response = await this.client.messages.create({
        model:      'claude-opus-4-7',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: `Write a blog post based on this topic/prompt: "${prompt}"

Requirements:
- Tone: ${tone}
- Length: ${wordCount}
- Write in first person where appropriate
- Make it engaging and practical
- Use clear paragraphs (no markdown headers, just plain paragraphs)

Return ONLY a valid JSON object — no markdown fences, no extra text:
{
  "title": "compelling title here",
  "body": "full blog post body here as plain text with newlines between paragraphs",
  "excerpt": "one sentence summary under 160 characters",
  "tags": ["tag1", "tag2", "tag3"]
}`,
        }],
      });

      const raw = (response.content[0] as any).text?.trim() ?? '';
      try {
        const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
        return JSON.parse(cleaned);
      } catch {
        throw new BadRequestException(ENGINE_FORMAT_ERR);
      }
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(ENGINE_UNAVAILABLE);
    }
  }
}

import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { SiteContentService } from '../site-content/site-content.service';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

const MODEL = 'claude-opus-5';
const MAX_TOKENS = 1024;
/** Trim history so a long session can't grow the prompt without bound. */
const MAX_TURNS = 20;
const MAX_CHARS = 2000;

const UNAVAILABLE =
  "The assistant isn't available right now — please use the contact form and Karan will reply directly.";

@Injectable()
export class ChatService {
  private readonly log = new Logger(ChatService.name);
  private client: Anthropic | null = null;

  constructor(cfg: ConfigService, private siteContent: SiteContentService) {
    const key = cfg.get<string>('ANTHROPIC_API_KEY');
    if (key) this.client = new Anthropic({ apiKey: key });
  }

  get available(): boolean { return this.client !== null; }

  async reply(history: ChatTurn[]): Promise<{ reply: string }> {
    if (!this.client) throw new ServiceUnavailableException(UNAVAILABLE);

    // Ground the assistant in the live CMS content rather than a hardcoded
    // copy, so editing the site in Admin also updates what the bot knows.
    const system = await this.buildSystemPrompt();

    const messages = history
      .filter(t => t.content?.trim())
      .slice(-MAX_TURNS)
      .map(t => ({
        role: t.role === 'assistant' ? ('assistant' as const) : ('user' as const),
        content: t.content.slice(0, MAX_CHARS),
      }));

    if (!messages.length || messages[0].role !== 'user') {
      return { reply: 'Ask me anything about Karan’s work, skills, or availability.' };
    }

    try {
      const res = await this.client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        // Low effort + thinking off: this is short conversational Q&A over a
        // small grounded context, where latency matters more than depth.
        thinking: { type: 'disabled' },
        output_config: { effort: 'low' },
        system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
        messages,
      });

      // A safety refusal returns 200 with stop_reason 'refusal' and no usable
      // content — check before reading content[0].
      if (res.stop_reason === 'refusal') {
        return { reply: "I can't help with that one, but ask me anything about Karan's work." };
      }

      const text = res.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map(b => b.text)
        .join('')
        .trim();

      return { reply: text || UNAVAILABLE };
    } catch (err: any) {
      this.log.error(`[CHAT] ${err?.status ?? ''} ${err?.message ?? err}`);
      throw new ServiceUnavailableException(UNAVAILABLE);
    }
  }

  /** Builds the grounding prompt from whatever is currently in the CMS. */
  private async buildSystemPrompt(): Promise<string> {
    let facts = '';
    try {
      const c: any = await this.siteContent.getAll();
      facts = JSON.stringify(
        {
          hero: c?.hero, skills: c?.skills, experience: c?.experience,
          services: c?.services, gigs: c?.gigs, faqs: c?.faqs,
          contact: c?.['contact-info'], about: c?.about,
        },
        null, 0,
      ).slice(0, 12_000);
    } catch {
      facts = '{}'; // CMS unreachable — fall back to the static brief below
    }

    return [
      "You are the assistant on Karan Kapoor's portfolio website. You speak to visitors —",
      'recruiters, potential clients, and fellow developers — on his behalf.',
      '',
      'Karan is a Full Stack Developer with ~2.6 years of experience, based in Ludhiana,',
      'Punjab, India. He works as a Junior Software Developer at CS Soft Solutions in Mohali',
      '(joined as an intern in January 2024, full-time from July 2024) and is pursuing an MCA',
      'at Lovely Professional University. His stack is Angular on the front end with .NET,',
      'NestJS and PostgreSQL behind it. He is available for freelance, remote and part-time work.',
      '',
      'Live site content follows as JSON — treat it as the source of truth and prefer it over',
      'anything above if they disagree:',
      facts,
      '',
      'How to answer:',
      '- Be warm, concise and concrete. Two or three sentences is usually right.',
      '- Only state facts present above. If you do not know something — his rates, his',
      '  availability on a specific date, personal details — say so plainly and point the',
      '  visitor to the contact form rather than guessing.',
      '- Never invent projects, employers, dates, technologies, or credentials.',
      '- When someone sounds like a potential client or recruiter, encourage them to get in',
      '  touch via the contact section or the WhatsApp button.',
      '- You are not Karan. Refer to him in the third person.',
      '- Plain text only. No markdown, no headings, no bullet characters.',
    ].join('\n');
  }
}

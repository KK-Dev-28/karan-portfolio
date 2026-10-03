import { Injectable, Logger, BadRequestException, ServiceUnavailableException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { GeneratedLayout } from './layout.entity';
import { LAYOUT_TOKEN_VARS, sanitizeTokens, isValidLayoutId, withinBounds } from './layout.validation';

/* A small, strictly-shaped JSON task — it does not need a frontier model, and
   this runs on an admin's click, so latency is felt directly. */
const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 700;

const SYSTEM = `You design structural layout presets for a software developer's portfolio.

Return ONLY a JSON object, no prose and no markdown fence:
{"id":"kebab-case-id","label":"Two Or Three Words","blurb":"One sentence saying what this layout is for.","tokens":{ ... }}

tokens must use exactly these keys:
${LAYOUT_TOKEN_VARS.join(', ')}

Rules:
- --container between 720px and 1920px
- --layout-gap and --section-py in rem, between 0.25rem and 12rem
- --radius and --radius-lg in px; --radius-lg larger than --radius
- --grid-cols-2, --grid-cols-3, --grid-cols-4 are integers 1-6 and must not decrease across them
- --grid-tile-min between 160px and 480px, and comfortably smaller than --container
- A narrow container must pair with fewer columns, or content is unreadable.
- The result must be visibly different from a 1200px container with 2rem gaps.
- id must be lowercase letters, digits and hyphens only.`;

@Injectable()
export class LayoutService {
  private readonly log = new Logger(LayoutService.name);
  private client: Anthropic | null = null;

  constructor(
    cfg: ConfigService,
    @InjectRepository(GeneratedLayout) private readonly repo: Repository<GeneratedLayout>,
  ) {
    const key = cfg.get<string>('ANTHROPIC_API_KEY');
    if (key) this.client = new Anthropic({ apiKey: key });
  }

  /** Published layouts, served to every visitor. */
  list() {
    return this.repo.find({ order: { createdAt: 'ASC' } });
  }

  /**
   * Produces a candidate layout. Deliberately does NOT save: the Studio previews
   * it on the real page first and an admin decides whether it is any good.
   */
  async generate(brief?: string): Promise<Omit<GeneratedLayout, 'createdAt'>> {
    if (!this.client) {
      throw new ServiceUnavailableException('ANTHROPIC_API_KEY is not configured on the server.');
    }

    const ask = brief?.trim()
      ? `Design a layout matching this brief: ${brief.trim().slice(0, 300)}`
      : 'Design a layout that is clearly distinct from a standard 1200px centred column.';

    let raw: string;
    try {
      const res = await this.client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM,
        messages: [{ role: 'user', content: ask }],
      });
      const block = res.content.find(c => c.type === 'text');
      raw = block && block.type === 'text' ? block.text : '';
    } catch (err) {
      this.log.error(`Layout generation failed: ${(err as Error).message}`);
      throw new ServiceUnavailableException('The layout generator is unavailable right now.');
    }

    return this.parseCandidate(raw);
  }

  /* The model is told to return bare JSON, but a fence or a sentence before it
     is the common failure and is cheap to recover from. */
  private parseCandidate(raw: string): Omit<GeneratedLayout, 'createdAt'> {
    const start = raw.indexOf('{');
    const end   = raw.lastIndexOf('}');
    if (start === -1 || end <= start) {
      throw new BadRequestException('The generator did not return a layout. Try again.');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(raw.slice(start, end + 1));
    } catch {
      throw new BadRequestException('The generator returned malformed JSON. Try again.');
    }

    const tokens = sanitizeTokens(parsed?.tokens);
    /* A partial token set would silently inherit the rest from Standard and
       produce something barely distinguishable from it. */
    if (Object.keys(tokens).length < LAYOUT_TOKEN_VARS.length) {
      throw new BadRequestException('The generated layout was incomplete. Try again.');
    }
    if (!withinBounds(tokens)) {
      throw new BadRequestException('The generated layout had values outside usable limits. Try again.');
    }

    const id = String(parsed?.id ?? '').trim().toLowerCase();
    if (!isValidLayoutId(id)) {
      throw new BadRequestException('The generated layout had an unusable id. Try again.');
    }

    return {
      id,
      label: String(parsed?.label ?? id).trim().slice(0, 48) || id,
      blurb: String(parsed?.blurb ?? '').trim().slice(0, 220),
      tokens,
    };
  }

  /** Publishes a layout. Revalidates rather than trusting the posted body. */
  async save(input: { id: string; label: string; blurb?: string; tokens: unknown }) {
    const id = String(input.id ?? '').trim().toLowerCase();
    if (!isValidLayoutId(id)) throw new BadRequestException('Invalid layout id.');

    const tokens = sanitizeTokens(input.tokens);
    if (Object.keys(tokens).length < LAYOUT_TOKEN_VARS.length) {
      throw new BadRequestException('Layout is missing required tokens.');
    }
    if (!withinBounds(tokens)) throw new BadRequestException('Layout values are outside usable limits.');

    /* Built-in ids ship in the front-end registry and would be shadowed by a
       row of the same name, changing a layout a visitor already chose. */
    if (BUILT_IN_IDS.has(id)) {
      throw new BadRequestException(`"${id}" is a built-in layout. Choose another id.`);
    }

    const row = this.repo.create({
      id,
      label: String(input.label ?? id).trim().slice(0, 48) || id,
      blurb: String(input.blurb ?? '').trim().slice(0, 220),
      tokens,
    });
    return this.repo.save(row);
  }

  async remove(id: string) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('No such generated layout.');
    await this.repo.remove(row);
    return { ok: true };
  }
}

/* Kept in step with BUILT_IN_LAYOUTS in the front-end registry. */
const BUILT_IN_IDS = new Set([
  'standard', 'dossier', 'atelier-grid', 'zen',
  'command', 'canvas', 'bento-hud', 'cinematic-wide',
]);

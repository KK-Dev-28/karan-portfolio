import { Body, Controller, Get, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ChatService, ChatTurn } from './chat.service';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private chat: ChatService) {}

  /** Lets the frontend hide the assistant entirely when no API key is set,
   *  rather than showing a launcher that always errors. */
  @Get('status')
  @ApiOperation({ summary: 'Whether the assistant is configured and usable' })
  status() {
    return { available: this.chat.available };
  }

  /* Public and unauthenticated, so it is rate-limited per IP — each call costs
     real money. 10 per minute is generous for a human and hostile to a script. */
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Ask the portfolio assistant a question' })
  send(@Body() body: { messages?: ChatTurn[] }) {
    return this.chat.reply(Array.isArray(body?.messages) ? body.messages : []);
  }
}

import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BlogService } from './blog.service';
import { BlogAuthService } from './blog-auth.service';
import { BlogAiService } from './blog-ai.service';
import { BlogJwtGuard } from './blog-jwt.guard';
import {
  BlogCheckoutDto, BlogVerifyDto, BlogRegisterDto, BlogLoginDto,
  BlogUpdateProfileDto, BlogCreatePostDto, BlogUpdatePostDto, BlogAiGenerateDto,
} from './blog.dto';

@Controller('blog')
export class BlogController {
  constructor(
    private svc:  BlogService,
    private auth: BlogAuthService,
    private ai:   BlogAiService,
  ) {}

  // ── Public ──────────────────────────────────────────
  @Get('access-info')
  accessInfo() { return this.svc.getAccessInfo(); }

  @Get('posts')
  getPosts(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit: number,
  ) { return this.svc.getPosts(page, Math.min(limit, 50)); }

  @Get('posts/:slug')
  getPost(@Param('slug') slug: string) { return this.svc.getPost(slug); }

  @Get('u/:username')
  getProfile(@Param('username') username: string) { return this.auth.getPublicProfile(username); }

  @Get('u/:username/posts')
  getUserPosts(@Param('username') username: string) { return this.svc.getPostsByUser(username); }

  // ── Payment ─────────────────────────────────────────
  @Post('checkout')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  checkout(@Body() body: BlogCheckoutDto) { return this.svc.createCheckout(body.name, body.email); }

  @Post('verify')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  verify(@Body() body: BlogVerifyDto) {
    return this.svc.verifyPayment(body.razorpayOrderId, body.razorpayPaymentId, body.razorpaySignature, body.name, body.email);
  }

  // ── Auth ─────────────────────────────────────────────
  @Post('auth/register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  register(@Body() body: BlogRegisterDto) { return this.auth.register(body); }

  @Post('auth/login')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  login(@Body() body: BlogLoginDto) { return this.auth.login(body.email, body.password); }

  @Get('auth/me')
  @UseGuards(BlogJwtGuard)
  getMe(@Req() req: any) { return this.auth.getMe(req.blogUser.sub); }

  @Patch('auth/me')
  @UseGuards(BlogJwtGuard)
  updateMe(@Req() req: any, @Body() body: BlogUpdateProfileDto) { return this.auth.updateProfile(req.blogUser.sub, body); }

  // ── AI Generation ────────────────────────────────────
  @Post('ai/generate')
  @UseGuards(BlogJwtGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  generate(@Body() body: BlogAiGenerateDto) {
    return this.ai.generate(body.prompt, body.tone, body.length);
  }

  // ── Writer (auth-gated) ──────────────────────────────
  @Get('mine')
  @UseGuards(BlogJwtGuard)
  getMyPosts(@Req() req: any) { return this.svc.getMyPosts(req.blogUser.sub); }

  @Post('posts')
  @UseGuards(BlogJwtGuard)
  createPost(@Req() req: any, @Body() body: BlogCreatePostDto) { return this.svc.createPost(req.blogUser.sub, body); }

  @Patch('posts/:id')
  @UseGuards(BlogJwtGuard)
  updatePost(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: BlogUpdatePostDto) {
    return this.svc.updatePost(req.blogUser.sub, id, body);
  }

  @Delete('posts/:id')
  @UseGuards(BlogJwtGuard)
  deletePost(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.svc.deletePost(req.blogUser.sub, id);
  }

  // ── Admin ────────────────────────────────────────────
  @Get('admin/posts')
  @UseGuards(JwtAuthGuard)
  adminPosts() { return this.svc.getAllPostsAdmin(); }

  @Get('admin/users')
  @UseGuards(JwtAuthGuard)
  adminUsers() { return this.svc.getAllUsersAdmin(); }

  @Post('admin/post')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Admin: create blog post directly (no writer account needed)' })
  createAdminPost(@Body() body: any) { return this.svc.createPostAdmin(body); }
}

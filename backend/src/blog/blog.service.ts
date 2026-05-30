import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import Razorpay from 'razorpay';
import { validatePaymentVerification } from 'razorpay/dist/utils/razorpay-utils';
import { BlogPost } from './blog-post.entity';
import { BlogAccess } from './blog-access.entity';
import { BlogUser } from './blog-user.entity';

@Injectable()
export class BlogService {
  private rzp: Razorpay | null = null;

  constructor(
    @InjectRepository(BlogPost)   private posts: Repository<BlogPost>,
    @InjectRepository(BlogAccess) private access: Repository<BlogAccess>,
    @InjectRepository(BlogUser)   private users: Repository<BlogUser>,
    private cfg: ConfigService,
  ) {
    const keyId     = cfg.get<string>('RAZORPAY_KEY_ID');
    const keySecret = cfg.get<string>('RAZORPAY_KEY_SECRET');
    if (keyId && keySecret) this.rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }

  private get currency()  { return (this.cfg.get<string>('RAZORPAY_CURRENCY') || 'INR').toUpperCase(); }
  private get keyId()     { return this.cfg.get<string>('RAZORPAY_KEY_ID') ?? ''; }
  private get keySecret() { return this.cfg.get<string>('RAZORPAY_KEY_SECRET') ?? ''; }
  private get amount()    {
    const n = parseInt(this.cfg.get<string>('BLOG_ACCESS_AMOUNT') ?? '24900', 10);
    return Number.isFinite(n) && n >= 100 ? n : 24900;
  }

  getAccessInfo() { return { amount: this.amount, currency: this.currency, keyId: this.keyId }; }

  async createCheckout(name: string, email: string) {
    if (!this.rzp) throw new BadRequestException('Payments not configured.');
    const order = await this.rzp.orders.create({ amount: this.amount, currency: this.currency, receipt: `blog_${Date.now()}`, notes: { name, email } });
    return { orderId: order.id, amount: order.amount as number, currency: this.currency, keyId: this.keyId };
  }

  async verifyPayment(orderId: string, paymentId: string, signature: string, name: string, email: string) {
    const valid = validatePaymentVerification({ order_id: orderId, payment_id: paymentId }, signature, this.keySecret);
    if (!valid) throw new BadRequestException('Invalid payment signature.');

    const existing = await this.access.findOneBy({ email });
    if (existing) {
      await this.access.update(existing.id, { razorpayOrderId: orderId, razorpayPaymentId: paymentId, active: true });
      return { registrationToken: existing.token };
    }
    const token = randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await this.access.save(this.access.create({ email, name, token, razorpayOrderId: orderId, razorpayPaymentId: paymentId, expiresAt }));
    return { registrationToken: token };
  }

  async getPosts(page = 1, limit = 12) {
    const [posts, total] = await this.posts.findAndCount({
      where: { published: true },
      order: { publishedAt: 'DESC' },
      skip:  (page - 1) * limit,
      take:  limit,
    });
    return { posts, total, page, pages: Math.ceil(total / limit) };
  }

  async getPost(slug: string) {
    const post = await this.posts.findOne({ where: { slug, published: true }, relations: ['author'] });
    if (!post) throw new NotFoundException('Post not found.');
    return post;
  }

  async getMyPosts(userId: number) {
    return this.posts.find({ where: { authorId: userId }, order: { createdAt: 'DESC' } });
  }

  async getPostsByUser(username: string) {
    const user = await this.users.findOneBy({ username, active: true, publicProfile: true });
    if (!user) throw new NotFoundException('Profile not found.');
    return this.posts.find({ where: { authorId: user.id, published: true }, order: { publishedAt: 'DESC' } });
  }

  private makeSlug(title: string): string {
    return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80)
      + '-' + randomBytes(3).toString('hex');
  }

  async createPost(userId: number, dto: { title: string; body: string; excerpt?: string; coverImage?: string; tags?: string[]; published?: boolean }) {
    const user = await this.users.findOneBy({ id: userId });
    if (!user) throw new ForbiddenException();
    const post = this.posts.create({
      ...dto,
      slug:           this.makeSlug(dto.title),
      authorName:     user.name,
      authorEmail:    user.email,
      authorUsername: user.username,
      authorId:       user.id,
      published:      dto.published ?? false,
      publishedAt:    dto.published ? new Date() : null,
    });
    return this.posts.save(post);
  }

  async updatePost(userId: number, id: number, dto: any) {
    const post = await this.posts.findOneBy({ id });
    if (!post) throw new NotFoundException('Post not found.');
    if (post.authorId !== userId) throw new ForbiddenException('Not your post.');
    if (dto.published && !post.published) (dto as any).publishedAt = new Date();
    Object.assign(post, dto);
    return this.posts.save(post);
  }

  async deletePost(userId: number, id: number) {
    const post = await this.posts.findOneBy({ id });
    if (!post) throw new NotFoundException('Post not found.');
    if (post.authorId !== userId) throw new ForbiddenException('Not your post.');
    await this.posts.remove(post);
  }

  getAllPostsAdmin() { return this.posts.find({ order: { createdAt: 'DESC' } }); }
  getAllUsersAdmin() { return this.users.find({ order: { createdAt: 'DESC' }, select: ['id','email','username','name','active','createdAt'] }); }

  async createPostAdmin(dto: { title: string; body: string; excerpt?: string; coverImage?: string; tags?: string[]; published?: boolean }) {
    const post = this.posts.create({
      ...dto,
      slug:        this.makeSlug(dto.title),
      authorName:  'Karan Kapoor',
      authorEmail: 'kk0888176@gmail.com',
      published:   dto.published ?? true,
      publishedAt: dto.published !== false ? new Date() : null,
    });
    return this.posts.save(post);
  }
}

import { Injectable, BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { BlogUser } from './blog-user.entity';
import { BlogAccess } from './blog-access.entity';

@Injectable()
export class BlogAuthService {
  constructor(
    @InjectRepository(BlogUser)   private users: Repository<BlogUser>,
    @InjectRepository(BlogAccess) private access: Repository<BlogAccess>,
    private jwt: JwtService,
    private cfg: ConfigService,
  ) {}

  private get jwtSecret() { return this.cfg.get('BLOG_JWT_SECRET') || this.cfg.get('JWT_SECRET'); }

  private sign(user: BlogUser) {
    return this.jwt.sign(
      { sub: user.id, email: user.email, username: user.username, type: 'blog' },
      { secret: this.jwtSecret, expiresIn: '30d' },
    );
  }

  async register(dto: { registrationToken: string; email: string; username: string; name: string; password: string }) {
    const access = await this.access.findOneBy({ token: dto.registrationToken });
    if (!access || !access.active) throw new BadRequestException('Invalid or already-used registration token.');
    if (access.expiresAt && new Date() > access.expiresAt) throw new BadRequestException('Registration token has expired.');
    if (access.email && access.email !== dto.email) throw new BadRequestException('Email must match the one used for payment.');

    const emailTaken    = await this.users.findOneBy({ email: dto.email });
    if (emailTaken) {
      // Already registered — just return a new token
      const token = this.sign(emailTaken);
      return { token, user: this.safeUser(emailTaken) };
    }
    const usernameTaken = await this.users.findOneBy({ username: dto.username });
    if (usernameTaken) throw new ConflictException('Username already taken.');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.users.save(this.users.create({ email: dto.email, username: dto.username, name: dto.name, passwordHash }));
    await this.access.update(access.id, { active: false });
    return { token: this.sign(user), user: this.safeUser(user) };
  }

  async login(email: string, password: string) {
    const user = await this.users.findOneBy({ email: email.toLowerCase().trim(), active: true });
    if (!user) throw new UnauthorizedException('No account found with that email.');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Incorrect password.');
    return { token: this.sign(user), user: this.safeUser(user) };
  }

  async registerFree(dto: { email: string; username: string; name: string; password: string }) {
    const email    = dto.email.toLowerCase().trim();
    const username = dto.username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');

    if (!email || !username || !dto.name?.trim() || !dto.password) {
      throw new BadRequestException('All fields are required.');
    }
    if (dto.password.length < 6) throw new BadRequestException('Password must be at least 6 characters.');

    const emailTaken = await this.users.findOneBy({ email });
    if (emailTaken) {
      const token = this.sign(emailTaken);
      return { token, user: this.safeUser(emailTaken) };
    }
    const usernameTaken = await this.users.findOneBy({ username });
    if (usernameTaken) throw new ConflictException('Username already taken. Try another.');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.users.save(
      this.users.create({ email, username, name: dto.name.trim(), passwordHash }),
    );
    return { token: this.sign(user), user: this.safeUser(user) };
  }

  async getMe(userId: number) {
    const user = await this.users.findOneBy({ id: userId });
    if (!user) throw new UnauthorizedException();
    return this.safeUser(user);
  }

  async updateProfile(userId: number, dto: Partial<{
    name: string; bio: string; avatar: string; website: string; twitter: string;
    linkedin: string; github: string; showBio: boolean; showSocials: boolean;
    showPostCount: boolean; publicProfile: boolean; currentPassword: string; newPassword: string;
  }>) {
    const user = await this.users.findOneBy({ id: userId });
    if (!user) throw new UnauthorizedException();

    if (dto.newPassword) {
      if (!dto.currentPassword) throw new BadRequestException('Current password required to set a new one.');
      const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
      if (!ok) throw new BadRequestException('Current password is incorrect.');
      user.passwordHash = await bcrypt.hash(dto.newPassword, 12);
    }

    const { currentPassword, newPassword, ...rest } = dto;
    Object.assign(user, rest);
    await this.users.save(user);
    return this.safeUser(user);
  }

  async getPublicProfile(username: string) {
    const user = await this.users.findOne({ where: { username, active: true }, relations: ['posts'] });
    if (!user || !user.publicProfile) throw new BadRequestException('Profile not found.');
    return {
      username:      user.username,
      name:          user.name,
      bio:           user.showBio ? user.bio : null,
      avatar:        user.avatar,
      website:       user.showSocials ? user.website : null,
      twitter:       user.showSocials ? user.twitter : null,
      linkedin:      user.showSocials ? user.linkedin : null,
      github:        user.showSocials ? user.github : null,
      postCount:     user.showPostCount ? (user.posts || []).filter(p => p.published).length : null,
      joinedAt:      user.createdAt,
    };
  }

  safeUser(u: BlogUser) {
    const { passwordHash, ...safe } = u as any;
    return safe;
  }
}

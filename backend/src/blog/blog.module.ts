import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BlogPost }        from './blog-post.entity';
import { BlogAccess }      from './blog-access.entity';
import { BlogUser }        from './blog-user.entity';
import { BlogService }     from './blog.service';
import { BlogAuthService } from './blog-auth.service';
import { BlogAiService }   from './blog-ai.service';
import { BlogJwtGuard }    from './blog-jwt.guard';
import { BlogController }  from './blog.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([BlogPost, BlogAccess, BlogUser]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject:  [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret:      cfg.get('BLOG_JWT_SECRET') || cfg.get('JWT_SECRET'),
        signOptions: { expiresIn: '30d' },
      }),
    }),
  ],
  providers:   [BlogService, BlogAuthService, BlogAiService, BlogJwtGuard],
  controllers: [BlogController],
  exports:     [BlogService],
})
export class BlogModule {}

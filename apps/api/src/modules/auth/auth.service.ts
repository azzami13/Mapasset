import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  async login(username: string, password: string) {
    const user = await this.users.findOne({ where: { username } });

    if (!user) throw new UnauthorizedException('Username tidak ditemukan');
    if (!user.is_active) throw new ForbiddenException('User nonaktif');

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) throw new UnauthorizedException('Password salah');

    user.last_login_at = new Date();
    user.login_count = (user.login_count || 0) + 1;
    await this.users.save(user);

    const payload = { sub: user.id, username: user.username, role: user.role?.name || 'VIEWER' };
    const access_token = await this.jwt.signAsync(payload);

    return { access_token };
  }

  async me(userId: number) {
    const user = await this.users.findOne({ where: { id: userId } as any });
    if (!user) throw new UnauthorizedException();

    return {
      id: user.id,
      username: user.username,
      role: user.role?.name,
      is_active: user.is_active,
      last_login_at: user.last_login_at,
      login_count: user.login_count,
    };
  }
}

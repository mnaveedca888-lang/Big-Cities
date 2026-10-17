import { PrismaClient, User } from '@prisma/client';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_DAYS = 7;

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  private getAccessSecret() {
    const s = process.env.JWT_ACCESS_TOKEN_SECRET;
    if (!s) throw new Error('Missing JWT_ACCESS_TOKEN_SECRET');
    return s;
  }

  private getRefreshSecret() {
    const s = process.env.JWT_REFRESH_TOKEN_SECRET;
    if (!s) throw new Error('Missing JWT_REFRESH_TOKEN_SECRET');
    return s;
  }

  async hashPassword(password: string) {
    return argon2.hash(password);
  }

  async verifyPassword(hash: string, password: string) {
    return argon2.verify(hash, password);
  }

  signAccessToken(userId: string) {
    return jwt.sign({ sub: userId }, this.getAccessSecret(), { expiresIn: ACCESS_EXPIRES_IN });
  }

  signRefreshToken(userId: string, sessionId: string) {
    return jwt.sign({ sub: userId, sid: sessionId }, this.getRefreshSecret(), { expiresIn: `${REFRESH_EXPIRES_DAYS}d` });
  }

  async register(payload: { name: string; email: string; password: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: payload.email } });
    if (existing) throw new Error('EMAIL_EXISTS');
    const passwordHash = await this.hashPassword(payload.password);
    const user = await this.prisma.user.create({ data: { name: payload.name, email: payload.email, passwordHash } });
    return user;
  }

  async createSessionAndTokens(user: User, opts: { ip?: string | null; userAgent?: string | null }) {
    const sessionId = randomUUID();
    const refreshToken = this.signRefreshToken(user.id, sessionId);
    const refreshTokenHash = await argon2.hash(refreshToken);
    const refreshExpiresAt = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
    await this.prisma.session.create({ data: { id: sessionId, userId: user.id, refreshTokenHash, userAgent: opts.userAgent || null, ip: opts.ip || null, expiresAt: refreshExpiresAt } });
    const accessToken = this.signAccessToken(user.id);
    const accessExpiresAt = Date.now() + 15 * 60 * 1000;
    return { accessToken, refreshToken, sessionId, expiresAt: accessExpiresAt };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email }, include: { role: true } });
    if (!user || !user.passwordHash) throw new Error('INVALID_CREDENTIALS');
    const ok = await this.verifyPassword(user.passwordHash, password);
    if (!ok) throw new Error('INVALID_CREDENTIALS');
    return user;
  }

  async revokeSession(sessionId: string) {
    await this.prisma.session.updateMany({ where: { id: sessionId }, data: { revoked: true, refreshTokenHash: '' } });
  }

  async verifyRefreshToken(token: string) {
    try {
      const payload: any = jwt.verify(token, this.getRefreshSecret());
      const { sid } = payload;
      const session = await this.prisma.session.findUnique({ where: { id: sid } });
      if (!session || session.revoked) throw new Error('INVALID_SESSION');
      const match = await argon2.verify(session.refreshTokenHash || '', token).catch(() => false);
      if (!match) throw new Error('INVALID_TOKEN');
      return { userId: payload.sub as string, sessionId: sid };
    } catch (err) {
      throw new Error('INVALID_REFRESH_TOKEN');
    }
  }

  async verifyAccessToken(token: string) {
    try {
      const payload: any = jwt.verify(token, this.getAccessSecret());
      return payload.sub as string;
    } catch (err) {
      throw new Error('INVALID_ACCESS_TOKEN');
    }
  }
}

export default AuthService;

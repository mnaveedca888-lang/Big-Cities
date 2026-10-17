import type { UserProfile } from './index';

export interface AuthSession {
  user: UserProfile;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

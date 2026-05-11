import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AnalysisService {
  private readonly aiServiceHttp =
    process.env.AI_SERVICE_HTTP_URL || 'http://localhost:8001';

  async checkAiServiceHealth(): Promise<boolean> {
    try {
      const res = await axios.get(`${this.aiServiceHttp}/health`);
      return res.data?.status === 'ok';
    } catch {
      return false;
    }
  }

  validateUsername(username: string): void {
    if (!username || username.trim().length === 0) {
      throw new HttpException(
        'GitHub username is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (username.length > 39) {
      throw new HttpException(
        'Invalid GitHub username',
        HttpStatus.BAD_REQUEST,
      );
    }
    // GitHub usernames: alphanumeric + hyphens, no leading/trailing hyphens
    const valid = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(
      username.trim(),
    );
    if (!valid) {
      throw new HttpException(
        'Invalid GitHub username format',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  sanitizeTargetRole(role?: string): string {
    const allowed = [
      'Full Stack Engineer',
      'Backend Engineer',
      'Frontend Engineer',
      'ML Engineer',
      'DevOps Engineer',
    ];

    return role && allowed.includes(role) ? role : 'Full Stack Engineer';
  }
}

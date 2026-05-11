import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpCode,
} from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('analysis')
export class AnalysisController {
  constructor(private analysisService: AnalysisService) {}

  @Post('validate')
  @HttpCode(200)
  validate(@Body() body: { username: string; target_role?: string }) {
    this.analysisService.validateUsername(body.username);
    const role = this.analysisService.sanitizeTargetRole(body.target_role);
    return {
      valid: true,
      username: body.username.trim(),
      target_role: role,
    };
  }

  @Get('health')
  async health() {
    const aiUp = await this.analysisService.checkAiServiceHealth();
    return {
      api: 'ok',
      ai_service: aiUp ? 'ok' : 'unavailable',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Request() req) {
    return { userId: req.user.id, email: req.user.email };
  }
}

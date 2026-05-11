import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { HistoryService } from './history.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('history')
export class HistoryController {
  constructor(private historyService: HistoryService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getMyHistory(@Request() req) {
    return this.historyService.findByUser(req.user.id);
  }

  @Get(':id')
  async getReport(@Param('id') id: string) {
    const report = await this.historyService.findById(id);
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }
}

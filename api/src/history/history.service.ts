import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Analysis } from './analysis.entity';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(Analysis)
    private repo: Repository<Analysis>,
  ) {}

  async save(userId: string | null, report: any): Promise<Analysis> {
    const analysis = this.repo.create({
      username: report.username,
      targetRole: report.target_role,
      report,
      overallScore: report.score?.overall || 0,
      isPublic: true,
      user: userId ? { id: userId } : undefined,
    });

    return this.repo.save(analysis);
  }

  async findByUser(userId: string): Promise<Analysis[]> {
    return this.repo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Analysis | null> {
    return this.repo.findOne({ where: { id } });
  }
}

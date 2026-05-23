import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Survey } from './survey.entity';
import { SurveyResponse } from './survey-response.entity';

@Injectable()
export class SurveyService {
  constructor(
    @InjectRepository(Survey) private surveyRepo: Repository<Survey>,
    @InjectRepository(SurveyResponse) private responseRepo: Repository<SurveyResponse>,
  ) {}

  findAllAdmin() {
    return this.surveyRepo.find({ order: { createdAt: 'DESC' } });
  }

  findActive() {
    return this.surveyRepo.find({ where: { status: 'active' }, order: { createdAt: 'DESC' } });
  }

  async findBySlug(slug: string) {
    const s = await this.surveyRepo.findOne({ where: { slug } });
    if (!s) throw new NotFoundException('Survey not found');
    return s;
  }

  findOne(id: number) {
    return this.surveyRepo.findOne({ where: { id } });
  }

  create(data: Partial<Survey>) {
    return this.surveyRepo.save(this.surveyRepo.create(data));
  }

  async update(id: number, data: Partial<Survey>) {
    await this.surveyRepo.update(id, data);
    return this.surveyRepo.findOne({ where: { id } });
  }

  async remove(id: number) {
    await this.surveyRepo.delete(id);
    return { ok: true };
  }

  async submitResponse(surveyId: number, answers: Record<string, any>, respondentEmail?: string, respondentName?: string) {
    const survey = await this.surveyRepo.findOne({ where: { id: surveyId } });
    if (!survey || survey.status !== 'active') throw new NotFoundException('Survey not available');
    return this.responseRepo.save(
      this.responseRepo.create({ surveyId, answers, respondentEmail, respondentName }),
    );
  }

  async getResponses(surveyId: number) {
    return this.responseRepo.find({ where: { surveyId }, order: { createdAt: 'DESC' } });
  }

  async getResponseCount(surveyId: number): Promise<number> {
    return this.responseRepo.count({ where: { surveyId } });
  }
}

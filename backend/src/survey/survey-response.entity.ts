import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Survey } from './survey.entity';

@Entity('survey_responses')
export class SurveyResponse {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Survey, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'surveyId' })
  survey: Survey;

  @Column()
  surveyId: number;

  @Column({ type: 'jsonb' })
  answers: Record<string, any>;

  @Column({ nullable: true })
  respondentEmail: string;

  @Column({ nullable: true })
  respondentName: string;

  @CreateDateColumn()
  createdAt: Date;
}

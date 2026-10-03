import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

/* A layout generated in the Design Studio and published. Built-in layouts stay
   in the front-end registry; only generated ones are stored, so this table is
   additive and an empty table simply means nobody has generated one yet. */
@Entity('generated_layouts')
export class GeneratedLayout {
  /** The slug used as html[data-layout] — supplied, not auto-generated. */
  @PrimaryColumn({ type: 'varchar', length: 40 }) id: string;
  @Column({ type: 'varchar', length: 48 })        label: string;
  @Column({ type: 'varchar', length: 220, default: '' }) blurb: string;
  /* Only the nine structural custom properties, each already validated. */
  @Column({ type: 'jsonb' })                      tokens: Record<string, string>;
  @CreateDateColumn()                             createdAt: Date;
}

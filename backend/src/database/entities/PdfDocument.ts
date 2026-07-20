import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';

@Entity('pdf_documents')
export class PdfDocument {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  originalName!: string;

  @Column()
  storedPath!: string;

  @Column({ type: 'longtext', nullable: true })
  extractedText!: string | null;

  @Column({ type: 'int', default: 0 })
  pageCount!: number;

  @Column()
  chromaCollectionName!: string;

  @CreateDateColumn()
  uploadedAt!: Date;

  @Column({ default: false })
  isProcessed!: boolean;
}

import fs from 'fs/promises';
import path from 'path';
import { Repository } from 'typeorm';
import { PDFParse } from 'pdf-parse';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { OpenAIEmbeddings } from '@langchain/openai';
import { ChatOpenAI } from '@langchain/openai';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'; // ← NEW
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { AppDataSource } from '../../config/database';
import { Embeddings } from "@langchain/core/embeddings";
import {HuggingFaceInferenceEmbeddings} from '@langchain/community/embeddings/hf';


import {
  chromaClient,
  deleteCollection,
  ChromaUnavailableError,
} from '../../config/chroma';
import { PdfDocument } from '../../database/entities/PdfDocument';
import { AppError } from '../../shared/middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;
const TOP_K_CHUNKS = 4;

export interface UploadProcessResult {
  documentId: string;
  pageCount: number;
  chunkCount: number;
  collectionName: string;
}

export interface SourceChunk {
  content: string;
  metadata: Record<string, unknown>;
}

export interface AskQuestionResult {
  answer: string;
  sourceChunks: SourceChunk[];
}

export class PdfChatService {
  private readonly documentRepository: Repository<PdfDocument>;

  constructor() {
    this.documentRepository = AppDataSource.getRepository(PdfDocument);
  }

  // ✅ NO CHANGES from here until the private methods at bottom
  async uploadAndProcess(
    file: Express.Multer.File,
    userId: string,
  ): Promise<UploadProcessResult> {
    const documentId = uuidv4();
    const collectionName = this.buildCollectionName(documentId);
    let parser: PDFParse | null = null;

    try {
      const fileBuffer = await fs.readFile(file.path);
      parser = new PDFParse({ data: fileBuffer });

      const textResult = await parser.getText();
      const infoResult = await parser.getInfo();

      const extractedText = textResult.text.trim();
      const pageCount = textResult.total || infoResult.total || textResult.pages.length;

      if (!extractedText) {
        throw new AppError('No text could be extracted from the PDF', 422);
      }

      const chunks = await this.splitText(extractedText);

      if (chunks.length === 0) {
        throw new AppError('No text chunks could be created from the PDF', 422);
      }

      const embeddings = this.createEmbeddings();
      const documents = chunks.map(
        (chunk, index) =>
          new Document({
            pageContent: chunk,
            metadata: {
              documentId,
              userId,
              chunkIndex: index,
              originalName: file.originalname,
            },
          }),
      );

      await Chroma.fromDocuments(documents, embeddings, {
        collectionName,
        index: chromaClient,
      });

      const document = this.documentRepository.create({
        id: documentId,
        userId,
        originalName: file.originalname,
        storedPath: file.path,
        extractedText,
        pageCount,
        chromaCollectionName: collectionName,
        isProcessed: true,
      });

      await this.documentRepository.save(document);

      return {
        documentId,
        pageCount,
        chunkCount: chunks.length,
        collectionName,
      };
    } catch (error) {
      console.error('REAL ERROR in uploadAndProcess:', error);

      await this.cleanupFailedUpload(file.path, collectionName);

      if (error instanceof AppError || error instanceof ChromaUnavailableError) {
        throw error;
      }

      throw new AppError('Failed to process PDF document', 500);
    } finally {
      if (parser) {
        await parser.destroy();
      }
    }
  }

  async askQuestion(
    documentId: string,
    question: string,
    userId: string,
  ): Promise<AskQuestionResult> {
    const document = await this.findOwnedDocument(documentId, userId);

    if (!document.isProcessed) {
      throw new AppError('Document is still being processed', 409);
    }

    const embeddings = this.createEmbeddings();
    const vectorStore = await Chroma.fromExistingCollection(embeddings, {
      collectionName: document.chromaCollectionName,
      index: chromaClient,
    });

    const relevantDocuments = await vectorStore.similaritySearch(
      question,
      TOP_K_CHUNKS,
    );

    const sourceChunks: SourceChunk[] = relevantDocuments.map((doc) => ({
      content: doc.pageContent,
      metadata: doc.metadata,
    }));

    const context = sourceChunks.map((chunk) => chunk.content).join('\n\n');
    const prompt = `Answer using this context:\n${context}\n\nQuestion: ${question}`;

    const model = this.createChatModel();
    const response = await model.invoke(prompt);
    const answer =
      typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

    return {
      answer,
      sourceChunks,
    };
  }

  async deleteDocument(documentId: string, userId: string): Promise<void> {
    const document = await this.findOwnedDocument(documentId, userId);

    await deleteCollection(document.chromaCollectionName);
    await this.deleteFileIfExists(document.storedPath);
    await this.documentRepository.remove(document);
  }

  async listDocuments(userId: string): Promise<PdfDocument[]> {
    return this.documentRepository.find({
      where: { userId },
      order: { uploadedAt: 'DESC' },
    });
  }

  private async findOwnedDocument(
    documentId: string,
    userId: string,
  ): Promise<PdfDocument> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId, userId },
    });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    return document;
  }

  private buildCollectionName(documentId: string): string {
    const prefix = process.env.CHROMA_COLLECTION_PREFIX || 'pdf_doc_';
    return `${prefix}${documentId}`;
  }

  private async splitText(text: string): Promise<string[]> {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP,
    });

    return splitter.splitText(text);
  }

  // ✅ CHANGED — Now supports Google embeddings (free) or OpenAI
  private createEmbeddings(): Embeddings {
    const provider = process.env.LLM_PROVIDER || 'openai';

    if (provider === 'groq') {
      // Groq doesn't do embeddings — use Google instead (also free!)
      const apiKey = process.env.HUGGINGFACE_API_KEY;
     

      if (!apiKey) {
        throw new AppError('HUGGINGFACE_API_KEY is not configured', 500);
      }
console.log('✅ Using HuggingFace embeddings (FREE)');
    return new HuggingFaceInferenceEmbeddings({
      apiKey,
      model: 'sentence-transformers/all-MiniLM-L6-v2'
    });    }

    // Default: OpenAI embeddings
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new AppError('OPENAI_API_KEY is not configured', 500);
    }
    return new OpenAIEmbeddings({
      apiKey,
      model: 'text-embedding-3-small',
    });
  }

  // ✅ CHANGED — Now supports Groq (free) or OpenAI
  private createChatModel(): ChatOpenAI {
    const provider = process.env.LLM_PROVIDER || 'openai';

    if (provider === 'groq') {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        throw new AppError('GROQ_API_KEY is not configured', 500);
      }
      // Same ChatOpenAI class — just different baseURL!
      return new ChatOpenAI({
        apiKey,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2,
        configuration: {
          baseURL: 'https://api.groq.com/openai/v1'
        }
      });
    }

    // Default: OpenAI
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new AppError('OPENAI_API_KEY is not configured', 500);
    }
    return new ChatOpenAI({
      apiKey,
      model: 'gpt-3.5-turbo',
      temperature: 0.2,
    });
  }

  private async cleanupFailedUpload(
    filePath: string,
    collectionName: string,
  ): Promise<void> {
    await deleteCollection(collectionName);
    await this.deleteFileIfExists(filePath);
  }

  private async deleteFileIfExists(filePath: string): Promise<void> {
    try {
      await fs.unlink(path.resolve(filePath));
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code !== 'ENOENT'
      ) {
        throw error;
      }
    }
  }
}

export const pdfChatService = new PdfChatService();
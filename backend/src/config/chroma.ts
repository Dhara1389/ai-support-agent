import {
  ChromaClient,
  Collection,
  ChromaConnectionError,
  ChromaNotFoundError,
} from 'chromadb';

export const CHROMA_UNAVAILABLE_MESSAGE =
  'Vector database unavailable. Ensure ChromaDB container is running.';

export class ChromaUnavailableError extends Error {
  statusCode = 503;

  constructor() {
    super(CHROMA_UNAVAILABLE_MESSAGE);
    this.name = 'ChromaUnavailableError';
  }
}

interface ChromaConnectionConfig {
  host: string;
  port: number;
  ssl: boolean;
}

const parseChromaUrl = (url: string): ChromaConnectionConfig => {
  const parsed = new URL(url);

  return {
    host: parsed.hostname,
    port: parsed.port
      ? parseInt(parsed.port, 10)
      : parsed.protocol === 'https:'
        ? 443
        : 8000,
    ssl: parsed.protocol === 'https:',
  };
};

const getChromaUrl = (): string => {
  return process.env.CHROMA_URL || 'http://localhost:8000';
};

const createChromaClient = (): ChromaClient => {
  const { host, port, ssl } = parseChromaUrl(getChromaUrl());
  return new ChromaClient({ host, port, ssl });
};

export const chromaClient = createChromaClient();

const isConnectionError = (error: unknown): boolean => {
  if (error instanceof ChromaConnectionError) {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('fetch failed') ||
      message.includes('econnrefused') ||
      message.includes('network') ||
      message.includes('connect')
    );
  }

  return false;
};

const handleChromaError = (error: unknown): never => {
  if (error instanceof ChromaUnavailableError) {
    throw error;
  }

  if (isConnectionError(error)) {
    throw new ChromaUnavailableError();
  }

  throw error;
};

export const ensureChromaConnection = async (): Promise<void> => {
  try {
    await chromaClient.heartbeat();
  } catch (error) {
    handleChromaError(error);
  }
};

export const getOrCreateCollection = async (
  collectionName: string,
): Promise<Collection> => {
  try {
    await ensureChromaConnection();
    return await chromaClient.getOrCreateCollection({ name: collectionName });
  } catch (error) {
    return handleChromaError(error);
  }
};

export const deleteCollection = async (collectionName: string): Promise<void> => {
  try {
    await chromaClient.deleteCollection({ name: collectionName });
  } catch (error) {
    if (error instanceof ChromaNotFoundError) {
      return;
    }

    handleChromaError(error);
  }
};

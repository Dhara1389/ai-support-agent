// Simple API helper - no fancy patterns, just direct fetch calls

const API_BASE = 'http://localhost:3000/api';

// Helper to get auth header with Bearer token
function getAuthHeader(token: string): HeadersInit {
  return {
    'Authorization': `Bearer ${token}`,
  };
}

// Generic fetch wrapper that handles JSON and errors
async function fetchJson<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, options);

  const data = await response.json();

  if (!response.ok) {
    // Backend returns errors in { message: string } format
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

// ==================== AUTH ====================

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      isActive: boolean;
    };
    token: string;
  };
}

// POST /api/auth/register
export async function registerUser(data: RegisterRequest): Promise<AuthResponse> {
  return fetchJson(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

// POST /api/auth/login
export async function loginUser(data: LoginRequest): Promise<AuthResponse> {
  return fetchJson(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

// GET /api/auth/me
export async function getMe(token: string): Promise<AuthResponse> {
  return fetchJson(`${API_BASE}/auth/me`, {
    headers: getAuthHeader(token),
  });
}

// ==================== PDF CHAT ====================

// POST /api/pdf-chat/upload
// Uses FormData with field name "file"
export async function uploadPdf(token: string, file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/pdf-chat/upload`, {
    method: 'POST',
    headers: getAuthHeader(token),
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Upload failed');
  }

  return data;
}

// POST /api/pdf-chat/ask
export interface AskQuestionRequest {
  documentId: string;
  question: string;
}

export async function askQuestion(token: string, data: AskQuestionRequest): Promise<any> {
  return fetchJson(`${API_BASE}/pdf-chat/ask`, {
    method: 'POST',
    headers: {
      ...getAuthHeader(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

// GET /api/pdf-chat/documents
export async function getDocuments(token: string): Promise<any> {
  return fetchJson(`${API_BASE}/pdf-chat/documents`, {
    headers: getAuthHeader(token),
  });
}

// ==================== DB ANALYSER ====================

// POST /api/db-analyser/connect
export interface ConnectDbRequest {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export async function connectDb(token: string, data: ConnectDbRequest): Promise<any> {
  return fetchJson(`${API_BASE}/db-analyser/connect`, {
    method: 'POST',
    headers: {
      ...getAuthHeader(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

// POST /api/db-analyser/query
export interface QueryRequest {
  connectionId: string;
  question: string;
}

export async function runQuery(token: string, data: QueryRequest): Promise<any> {
  return fetchJson(`${API_BASE}/db-analyser/query`, {
    method: 'POST',
    headers: {
      ...getAuthHeader(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}
# 🤖 AI Support Agent

A full-stack AI-powered support agent portfolio project demonstrating RAG pipelines, natural language to SQL, JWT authentication, and agentic AI patterns — built with Node.js, TypeScript, LangChain.js, Groq, HuggingFace, and ChromaDB.

> **Version 1 complete.** Version 2 adds LangChain AgentExecutor, MCP server integration, Redis persistence, and SSE streaming — see [Roadmap](#️-roadmap).

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, TypeScript, Express |
| Database | MySQL 8 + TypeORM (migrations, no synchronize) |
| Auth | JWT (jsonwebtoken + bcrypt) |
| LLM / Chat | Groq API — llama-3.3-70b-versatile (free tier) |
| Embeddings | HuggingFace — sentence-transformers/all-MiniLM-L6-v2 (free) |
| Vector Store | ChromaDB (local via Python for dev, Docker for production) |
| Orchestration | LangChain.js (@langchain/groq, @langchain/community) 
| File Parsing | pdf-parse v2, mammoth |
| API Testing | curl, PowerShell Invoke-RestMethod | 
Postman
---

## 📦 Modules — Version 1

| Module | Description | Status |
|---|---|---|
| **Auth** | JWT register, login, protected routes, bcrypt hashing | ✅ Complete |
| **PDF Chatbot** | Upload PDF → RAG pipeline → conversational Q&A with source chunks | ✅ Complete |
| **DB Analyser** | Connect any MySQL DB → ask in English → NL→SQL via Groq → results | ✅ Complete 

> **Resume Analyser** and **Document Analyser** are being built directly as agentic modules in Version 2, skipping a basic V1 implementation since the pattern is already demonstrated by existing modules.

---

## 🗂️ Folder Structure

```
ai-support-agent/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts          # TypeORM AppDataSource (app DB)
│   │   │   ├── chroma.ts            # ChromaDB client + collection helpers
│   │   │   └── multer.ts            # File upload config
│   │   ├── modules/
│   │   │   ├── auth/                # JWT auth (dto, service, controller, routes, middleware)
│   │   │   ├── pdf-chat/            # RAG PDF chatbot (dto, service, controller, routes)
│   │   │   └── db-analyser/         # NL→SQL engine (dto, service, controller, routes)
│   │   ├── shared/
│   │   │   ├── middleware/          # Global error handler, validation wrapper
│   │   │   └── utils/               # JWT, password, response, file utilities
│   │   ├── database/
│   │   │   ├── entities/            # User, PdfDocument TypeORM entities
│   │   │   └── migrations/          # users, pdf_documents table migrations
│   │   └── app.ts                   # Express app entry point
│   ├── uploads/                     # Uploaded PDFs (gitignored)
│   ├── .env.example
│   ├── tsconfig.json
│   └── package.json
├── docker-compose.yml               # ChromaDB Docker service (production)
├── chroma-data/                     # ChromaDB local data (gitignored)

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- MySQL 8+
- Python 3.8+ (ChromaDB local server)
- Groq API key — free at [console.groq.com](https://console.groq.com)
- HuggingFace token — free at [huggingface.co](https://huggingface.co/settings/tokens)

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/ai-support-agent.git
cd ai-support-agent
```

### 2. Backend setup

```bash
cd backend
npm install
copy .env.example .env
# Fill in your values — see Environment Variables section below
```

### 3. MySQL setup

```bash
mysql -u root -p
```

```sql
CREATE DATABASE ai_support_agent;
exit
```

### 4. Run database migrations

```bash
cd backend
npm run migration:run
```

Creates `users` and `pdf_documents` tables.

### 5. ChromaDB setup (local development)

```bash
pip install chromadb
chroma run --path ./chroma-data --port 8000
```

Keep this terminal open. Verify:

```bash
curl http://localhost:8000/api/v2/heartbeat
```

> For production, ChromaDB runs via `docker-compose up -d` using the included `docker-compose.yml`.

### 6. Start backend

```bash
cd backend
npm run dev
```

Verify:
```bash
curl http://localhost:3000/health
``

### 8. (Optional) Load test database for DB Analyser

```bash
mysql -u root -p < sample_test_db.sql
```

This creates `ai_agent_test_db` with 8 tables and realistic seed data for testing NL→SQL queries.

---

## ⚙️ Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

```env
PORT=3000
NODE_ENV=development

# MySQL — App Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=yourpassword
DB_NAME=ai_support_agent

# JWT
JWT_SECRET=generate_with_node_-e_crypto_randomBytes_64_hex
JWT_EXPIRES_IN=7d

# Groq (LLM for chat completions and SQL generation)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx

# HuggingFace (embeddings for PDF RAG pipeline)
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxx

# ChromaDB
CHROMA_URL=http://localhost:8000
CHROMA_COLLECTION_PREFIX=pdf_doc_

# File Upload
MAX_FILE_SIZE_MB=10
UPLOAD_DIR=uploads
```

> Generate `JWT_SECRET`:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

---

## 📡 API Reference

### Health Check
```
GET  /health    → { status: 'ok', timestamp }
```

### Auth Module — `/api/auth`
```
POST   /register    Register new user { name, email, password }
POST   /login       Login → returns JWT token
GET    /me          Get current user (protected)
```

### PDF Chat Module — `/api/pdf-chat`
```
POST   /upload      Upload PDF (multipart/form-data, field: 'file') (protected)
POST   /ask         Ask question { documentId, question } (protected)
GET    /documents   List user's uploaded documents (protected)
DELETE /documents/:id  Delete document + ChromaDB collection (protected)
```

### DB Analyser Module — `/api/db-analyser`
```
POST   /connect              Connect DB + read schema { host, port, username, password, database }
POST   /query                NL→SQL query { connectionId, question }
GET    /schema/:connectionId Get stored schema
GET    /connections          List active connections (no credentials returned)
DELETE /disconnect/:id       Remove stored connection
```

---

## 🔍 How Each Module Works

### PDF Chat (RAG Pipeline)

```
Upload PDF
    → pdf-parse extracts text
    → LangChain RecursiveCharacterTextSplitter chunks text (500 chars, 50 overlap)
    → HuggingFace generates embeddings for each chunk
    → ChromaDB stores vectors in collection: pdf_doc_<documentId>
    → MySQL saves document metadata

Ask question
    → HuggingFace embeds the question
    → ChromaDB similarity search → top 4 relevant chunks
    → Groq (llama-3.3-70b-versatile) answers using retrieved context
    → Returns { answer, sourceChunks }
```

### DB Analyser (NL → SQL)

```
Connect
    → Temporary TypeORM DataSource created with user credentials
    → information_schema queried for tables + columns
    → Schema stored in memory Map (credentials + schema, not live connection)
    → DataSource destroyed immediately after schema read

Query
    → Stored schema retrieved from Map
    → Schema formatted as prompt context for Groq
    → Groq generates SELECT SQL from natural language question
    → SQL validated (must start with SELECT — security rule)
    → Fresh DataSource created → query executed (10s timeout) → destroyed
    → Returns { sql, results, rowCount }
```

---

## 🔐 Security

| Area | Implementation |
|---|---|
| Passwords | bcrypt hashed, salt rounds 10 |
| Auth tokens | JWT, signed secret, configurable expiry |
| Route protection | verifyToken middleware on all non-auth routes |
| File uploads | MIME type validation (PDF only), size limit from env |
| DB Analyser queries | Only SELECT allowed — validated before execution |
| Query timeout | 10 seconds via Promise.race |
| Credential logging | Never logged — only connectionId appears in logs |
| DB migrations | synchronize: false — schema changes via migrations only |

---

## 🗺️ Roadmap

### ✅ Version 1 — Complete

- [x] Project setup — monorepo, TypeScript, Express, TypeORM
- [x] ChromaDB docker-compose + local Python setup
- [x] Vite + React + Tailwind frontend scaffold
- [x] JWT authentication — register, login, protected routes
- [x] User entity + migration
- [x] PDF Chat — RAG pipeline (HuggingFace embeddings + ChromaDB + Groq)
- [x] PdfDocument entity + migration
- [x] DB Analyser — NL→SQL with Groq, schema introspection, SELECT validation

- [x] Sample test database (ai_agent_test_db — 8 tables, realistic seed data)

### 🔜 Version 2 — Agentic Upgrade (Planned)

- [ ] Resume Analyser Agent — LangChain AgentExecutor with multi-step tools
  (extract → analyse skills → ATS score → web search → suggest improvements)
- [ ] Document Analyser Agent — classify → summarise → key points → Q&A
- [ ] DB Analyser Agent — upgrade to AgentExecutor with self-correcting SQL
- [ ] MCP Server — expose DB tools via @modelcontextprotocol/sdk
- [ ] Orchestrator Agent — master agent routing between all modules
- [ ] SSE streaming — real-time agent reasoning via Server-Sent Events
- [ ] Redis — replace in-memory Maps with persistent session storage
- [ ] ChromaDB Docker — migrate from local Python to containerized
- [ ] Deployment — Railway (backend + DB) + Vercel (frontend)

---

## 🛠️ Built With AI-Assisted Development

This project was built using a structured, phase-by-phase AI-assisted workflow — reflecting how I work as an AI/LLM engineer: directing AI tools with precise technical specs, reviewing every generated file, owning all architecture decisions, and testing each module before moving forward.

| Tool | Role in this project |
|---|---|
| **Claude (Anthropic)** | Architecture design, phase breakdown, detailed prompt engineering for Cursor/Cline, debugging strategy, documentation |
| **Cursor** | AI pair-programming — generated initial module scaffolding from phase prompts |
| **Cline (VS Code)** | Continued development when Cursor hit free tier limits — used for file completion and TypeScript fixes |
| **Groq API** | Powers LLM features in the live app — chat completions for SQL generation and PDF Q&A |
| **HuggingFace** | Powers embedding generation in the live app — sentence-transformers for RAG pipeline |

**My workflow:** I write detailed, scoped prompts specifying exact file names, function signatures, TypeScript types, and security rules. I review every generated file, run TypeScript compile checks (`tsc --noEmit`), test every endpoint manually with curl before committing, and manage all git history and database migrations myself. AI tools accelerate implementation — architecture, security decisions, debugging, and quality control are entirely mine.

---

## 👤 Author

**Dhara** — Node.js & AI Backend Engineer
Specialising in LLM integration, RAG pipelines, and AI agent systems.
6 years backend experience → pivoting into AI/LLM engineering for remote international clients.

[LinkedIn]www.linkedin.com/in/
dhara-andharia-b4660218a
· [GitHub](https://github.com/Dhara1389/ai-support-agent)

---

## 📄 License

MIT

---

## 🧪 Testing the API

All endpoints can be tested using any of these three methods — choose whichever suits your workflow best.

---

### Method 1 — Postman (Recommended for Visual Testing)

Postman is the easiest way to test all endpoints with a GUI, save requests, and manage environments.

**Download:** [postman.com/downloads](https://www.postman.com/downloads/)

#### Setup Steps

**1. Create a new Collection**
- Open Postman → Collections → New Collection
- Name it: `AI Support Agent`

**2. Set up an Environment**
- Click Environments → New Environment
- Name it: `AI Support Agent Local`
- Add these variables:

| Variable | Initial Value | Current Value |
|---|---|---|
| `base_url` | `http://localhost:3000` | `http://localhost:3000` |
| `token` | (leave empty) | (auto-filled after login) |
| `documentId` | (leave empty) | (auto-filled after PDF upload) |
| `connectionId` | (leave empty) | (auto-filled after DB connect) |

**3. Auto-capture JWT token after login**

In your `POST /api/auth/login` request → go to **Tests** tab → add:

```javascript
const response = pm.response.json();
if (response.success) {
    pm.environment.set("token", response.data.token);
    console.log("Token saved to environment");
}
```

Now every time you login, the token is automatically saved and used in all subsequent requests.

**4. Auto-capture documentId after PDF upload**

In your `POST /api/pdf-chat/upload` request → Tests tab:

```javascript
const response = pm.response.json();
if (response.success) {
    pm.environment.set("documentId", response.data.documentId);
}
```

**5. Auto-capture connectionId after DB connect**

In your `POST /api/db-analyser/connect` request → Tests tab:

```javascript
const response = pm.response.json();
if (response.success) {
    pm.environment.set("connectionId", response.data.connectionId);
}
```

#### Postman Request Examples

**Register**
```
Method:  POST
URL:     {{base_url}}/api/auth/register
Body:    raw → JSON
{
    "name": "Dhara",
    "email": "dhara@test.com",
    "password": "Test@1234"
}
```

**Login**
```
Method:  POST
URL:     {{base_url}}/api/auth/login
Body:    raw → JSON
{
    "email": "dhara@test.com",
    "password": "Test@1234"
}
```

**Upload PDF**
```
Method:  POST
URL:     {{base_url}}/api/pdf-chat/upload
Auth:    Bearer Token → {{token}}
Body:    form-data
         Key: file | Type: File | Value: select your PDF
```

**Ask Question**
```
Method:  POST
URL:     {{base_url}}/api/pdf-chat/ask
Auth:    Bearer Token → {{token}}
Body:    raw → JSON
{
    "documentId": "{{documentId}}",
    "question": "What is this document about?"
}
```

**Connect Database**
```
Method:  POST
URL:     {{base_url}}/api/db-analyser/connect
Auth:    Bearer Token → {{token}}
Body:    raw → JSON
{
    "host": "localhost",
    "port": 3306,
    "username": "root",
    "password": "yourpassword",
    "database": "ai_agent_test_db"
}
```

**NL → SQL Query**
```
Method:  POST
URL:     {{base_url}}/api/db-analyser/query
Auth:    Bearer Token → {{token}}
Body:    raw → JSON
{
    "connectionId": "{{connectionId}}",
    "question": "Show all customers from Mumbai"
}
```

---

### Method 2 — curl (Terminal / Command Line)

Best for quick one-off tests and CI/CD scripts.

**Register**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Dhara","email":"dhara@test.com","password":"Test@1234"}'
```

**Login**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dhara@test.com","password":"Test@1234"}'
```

**Upload PDF**
```bash
curl -X POST http://localhost:3000/api/pdf-chat/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/your/document.pdf;type=application/pdf"
```

**Ask Question**
```bash
curl -X POST http://localhost:3000/api/pdf-chat/ask \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"documentId":"YOUR_DOCUMENT_ID","question":"What is this document about?"}'
```

**Connect Database**
```bash
curl -X POST http://localhost:3000/api/db-analyser/connect \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"host":"localhost","port":3306,"username":"root","password":"yourpassword","database":"ai_agent_test_db"}'
```

**NL → SQL Query**
```bash
curl -X POST http://localhost:3000/api/db-analyser/query \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"connectionId":"YOUR_CONNECTION_ID","question":"Show all customers from Mumbai"}'
```

**Health Check**
```bash
curl http://localhost:3000/health
```

> **Windows note:** Use `curl.exe` instead of `curl` in PowerShell to avoid the built-in alias conflict. Add `;type=application/pdf` to file uploads to force correct MIME type detection.

---

### Method 3 — PowerShell (Windows Native)

Best for Windows users who prefer staying in PowerShell without installing extra tools.

> **Requirement:** PowerShell 7+ required for `-Form` parameter support.
> Check: `$PSVersionTable.PSVersion` — Major must be 7+
> Install: `winget install Microsoft.PowerShell`

**Register**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"name":"Dhara","email":"dhara@test.com","password":"Test@1234"}'
```

**Login and Save Token**
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"email":"dhara@test.com","password":"Test@1234"}'
$token = $response.data.token
```

**Upload PDF**
```powershell
$form = @{ file = Get-Item -Path "C:\path\to\document.pdf" }
$uploadResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/pdf-chat/upload" `
  -Method Post `
  -Headers @{ Authorization = "Bearer $token" } `
  -Form $form
$documentId = $uploadResponse.data.documentId
```

**Ask Question**
```powershell
$body = @{ documentId = $documentId; question = "What is this document about?" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/pdf-chat/ask" `
  -Method Post `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $body
```

**Connect Database**
```powershell
$body = @{
    host     = "localhost"
    port     = 3306
    username = "root"
    password = "yourpassword"
    database = "ai_agent_test_db"
} | ConvertTo-Json
$connectResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/db-analyser/connect" `
  -Method Post `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $body
$connectionId = $connectResponse.data.connectionId
```

**NL → SQL Query**
```powershell
$body = @{ connectionId = $connectionId; question = "Show all customers from Mumbai" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/db-analyser/query" `
  -Method Post `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $body
```

---

### Method Comparison

| Feature | Postman | curl | PowerShell |
|---|---|---|---|
| Visual interface | ✅ Yes | ❌ No | ❌ No |
| Save requests | ✅ Yes | ❌ No | 🟡 Scripts only |
| Auto-capture token | ✅ Yes (Tests tab) | ❌ Manual | 🟡 Variables |
| File upload | ✅ Easy | ✅ Easy | 🟡 PowerShell 7+ only |
| Best for | Development + demo | Scripts + CI | Windows native |
| Installation needed | ✅ Yes | ❌ Built-in (Mac/Linux) | ❌ Built-in (Windows) |

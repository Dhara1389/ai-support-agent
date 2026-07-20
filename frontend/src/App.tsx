import { useState, useEffect } from 'react';
import { registerUser, loginUser, getMe, uploadPdf, askQuestion, getDocuments, connectDb, runQuery } from './api';

// ==================== TYPES ====================

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
}

interface Document {
  id: string;
  originalName: string;
  pageCount: number;
  uploadedAt: string;
  isProcessed: boolean;
}

// ==================== MAIN APP ====================

type Screen = 'login' | 'pdf-chat' | 'db-analyser';

export default function App() {
  // Auth state
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Screen state
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');

  // ==================== AUTH EFFECT ====================
  // Check if we have a token on load and verify it
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      getMe(savedToken)
        .then((res) => {
          setUser(res.data.user);
          setCurrentScreen('pdf-chat');
        })
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
        });
    }
  }, []);

  // ==================== LOGIN / REGISTER ====================

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let res;
      if (isLogin) {
        res = await loginUser({ email, password });
      } else {
        res = await registerUser({ email, password, name });
      }

      const authToken = res.data.token;
      setToken(authToken);
      setUser(res.data.user);
      localStorage.setItem('token', authToken);
      setCurrentScreen('pdf-chat');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    setCurrentScreen('login');
    setEmail('');
    setPassword('');
    setName('');
    setError('');
  };

  // ==================== PDF CHAT ====================

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [question, setQuestion] = useState('');
  const [chatAnswer, setChatAnswer] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setPdfFile(file);
    setUploading(true);
    setChatAnswer('');

    try {
      const res = await uploadPdf(token, file);
      // Refresh documents list
      await loadDocuments();
      setChatAnswer(`Uploaded successfully! ${res.message}`);
    } catch (err) {
      setChatAnswer(`Error: ${err instanceof Error ? err.message : 'Upload failed'}`);
    } finally {
      setUploading(false);
    }
  };

  const loadDocuments = async () => {
    if (!token) return;
    try {
      const res = await getDocuments(token);
      setDocuments(res.data);
    } catch (err) {
      console.error('Failed to load documents', err);
    }
  };

  // Load documents when screen becomes active
  useEffect(() => {
    if (currentScreen === 'pdf-chat' && token) {
      loadDocuments();
    }
  }, [currentScreen, token]);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !token) return;

    setPdfLoading(true);
    setChatAnswer('');

    try {
      const docId = selectedDocId || documents[0]?.id;
      if (!docId) {
        setChatAnswer('Please upload a PDF first or select a document.');
        setPdfLoading(false);
        return;
      }

      const res = await askQuestion(token, { documentId: docId, question });
      setChatAnswer(res.data.answer || JSON.stringify(res.data, null, 2));
    } catch (err) {
      setChatAnswer(`Error: ${err instanceof Error ? err.message : 'Failed to get answer'}`);
    } finally {
      setPdfLoading(false);
    }
  };

  // ==================== DB ANALYSER ====================

  const [dbHost, setDbHost] = useState('localhost');
  const [dbPort, setDbPort] = useState('3306');
  const [dbUser, setDbUser] = useState('root');
  const [dbPassword, setDbPassword] = useState('');
  const [dbName, setDbName] = useState('');
  const [connectionId, setConnectionId] = useState('');
  const [nlQuestion, setNlQuestion] = useState('');
  const [sqlResult, setSqlResult] = useState('');
  const [dbLoading, setDbLoading] = useState(false);
  const [dbConnecting, setDbConnecting] = useState(false);

  const handleConnectDb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setDbConnecting(true);
    setSqlResult('');

    try {
      const res = await connectDb(token, {
        host: dbHost,
        port: parseInt(dbPort),
        username: dbUser,
        password: dbPassword,
        database: dbName,
      });
      setConnectionId(res.data.connectionId || res.data.id || '');
      setSqlResult(`Connected successfully! ${res.message}`);
    } catch (err) {
      setSqlResult(`Error: ${err instanceof Error ? err.message : 'Connection failed'}`);
    } finally {
      setDbConnecting(false);
    }
  };

  const handleRunQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlQuestion.trim() || !token || !connectionId) return;

    setDbLoading(true);
    setSqlResult('');

    try {
      const res = await runQuery(token, { connectionId, question: nlQuestion });
      setSqlResult(JSON.stringify(res.data, null, 2));
    } catch (err) {
      setSqlResult(`Error: ${err instanceof Error ? err.message : 'Query failed'}`);
    } finally {
      setDbLoading(false);
    }
  };

  // ==================== RENDER ====================

  // If not logged in, show login/register screen
  if (!token || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
            AI Support Agent
          </h1>
          <p className="text-center text-gray-600 mb-6">
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </p>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your name"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Register'}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-600">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {isLogin ? 'Register' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Logged in - show main app with navigation
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">AI Support Agent</h1>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentScreen('pdf-chat')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                currentScreen === 'pdf-chat'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              PDF Chat
            </button>
            <button
              onClick={() => setCurrentScreen('db-analyser')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                currentScreen === 'db-analyser'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              DB Analyser
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* PDF Chat Screen */}
        {currentScreen === 'pdf-chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Upload PDF</h2>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  disabled={uploading}
                  className="hidden"
                  id="pdf-upload"
                />
                <label
                  htmlFor="pdf-upload"
                  className="cursor-pointer block"
                >
                  <div className="text-4xl mb-2">📄</div>
                  <p className="text-gray-600 mb-2">
                    {pdfFile ? pdfFile.name : 'Click to select a PDF file'}
                  </p>
                  <p className="text-sm text-gray-500">Maximum file size: 10MB</p>
                </label>
              </div>

              {uploading && (
                <div className="mt-4 text-blue-600 font-medium">Uploading and processing...</div>
              )}

              {/* Documents List */}
              {documents.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Your Documents</h3>
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDocId(doc.id)}
                        className={`p-3 border rounded-md cursor-pointer ${
                          selectedDocId === doc.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-medium text-gray-800">{doc.originalName}</p>
                        <p className="text-sm text-gray-500">
                          {doc.pageCount} pages • {doc.isProcessed ? 'Ready' : 'Processing...'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Chat Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Ask a Question</h2>

              <form onSubmit={handleAskQuestion} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Question
                  </label>
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ask something about your PDF..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={pdfLoading || !selectedDocId && documents.length === 0}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                >
                  {pdfLoading ? 'Thinking...' : 'Ask Question'}
                </button>
              </form>

              {pdfLoading && (
                <div className="mt-4 text-blue-600 font-medium animate-pulse">
                  Processing your question...
                </div>
              )}

              {chatAnswer && !pdfLoading && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Answer</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-4 whitespace-pre-wrap text-gray-800">
                    {chatAnswer}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DB Analyser Screen */}
        {currentScreen === 'db-analyser' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Connection Form */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Connect Database</h2>

              <form onSubmit={handleConnectDb} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Host
                    </label>
                    <input
                      type="text"
                      value={dbHost}
                      onChange={(e) => setDbHost(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Port
                    </label>
                    <input
                      type="number"
                      value={dbPort}
                      onChange={(e) => setDbPort(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={dbUser}
                    onChange={(e) => setDbUser(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={dbPassword}
                    onChange={(e) => setDbPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Database Name
                  </label>
                  <input
                    type="text"
                    value={dbName}
                    onChange={(e) => setDbName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={dbConnecting}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                >
                  {dbConnecting ? 'Connecting...' : 'Connect'}
                </button>
              </form>

              {connectionId && (
                <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                  Connected! Connection ID: {connectionId}
                </div>
              )}
            </div>

            {/* Query Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Ask a Question</h2>

              <form onSubmit={handleRunQuery} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Question (in plain English)
                  </label>
                  <textarea
                    value={nlQuestion}
                    onChange={(e) => setNlQuestion(e.target.value)}
                    required
                    rows={4}
                    disabled={!connectionId}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    placeholder="e.g., Show me all users who registered in the last 7 days"
                  />
                </div>

                <button
                  type="submit"
                  disabled={dbLoading || !connectionId}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                >
                  {dbLoading ? 'Running Query...' : 'Run Query'}
                </button>
              </form>

              {dbLoading && (
                <div className="mt-4 text-blue-600 font-medium animate-pulse">
                  Generating SQL and running query...
                </div>
              )}

              {sqlResult && !dbLoading && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Result</h3>
                  <pre className="bg-gray-50 border border-gray-200 rounded-md p-4 overflow-x-auto text-sm text-gray-800">
                    {sqlResult}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
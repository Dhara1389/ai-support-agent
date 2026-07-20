import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ChatGroq } from '@langchain/groq';
import { ConnectDbDto, NlQueryDto } from './db-analyser.dto';
import { AppError } from '../../shared/middleware/errorHandler';

// SECURITY: Store credentials + schema only, never live DataSource objects
export interface StoredConnection {
  credentials: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
  schema: {
    tables: Array<{
      name: string;
      columns: Array<{
        name: string;
        type: string;
        nullable: string;
      }>;
    }>;
  };
  connectedAt: Date;
  userId: string;
}

export class DbAnalyserService {
  // SECURITY: In-memory Map — Phase 2 will replace with Redis
  private connections = new Map<string, StoredConnection>();

  // SECURITY: Build DataSource with unique name to avoid AlreadyHasActiveConnectionError
  private buildDataSource(
    credentials: StoredConnection['credentials'],
    userId: string,
    connectionId: string,
  ): DataSource {
    return new DataSource({
      name: `db_analyser_${userId}_${connectionId}_${Date.now()}`,
      type: 'mysql',
      host: credentials.host,
      port: credentials.port,
      username: credentials.username,
      password: credentials.password,
      database: credentials.database,
      connectTimeout: 10000,
      extra: { connectionLimit: 1 },
    });
  }

  // SECURITY: Connect, read schema, then immediately destroy DataSource
  async connectAndInspect(dto: ConnectDbDto, userId: string): Promise<{
    connectionId: string;
    tables: StoredConnection['schema']['tables'];
  }> {
    const connectionId = uuidv4();
    const mapKey = `${userId}:${connectionId}`;
    const dataSource = this.buildDataSource(dto, userId, connectionId);

    try {
      await dataSource.initialize();

      const rows = await dataSource.query(
        `SELECT
          TABLE_NAME    as tableName,
          COLUMN_NAME   as columnName,
          DATA_TYPE     as dataType,
          IS_NULLABLE   as isNullable
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ?
        ORDER BY TABLE_NAME, ORDINAL_POSITION`,
        [dto.database],
      );

      // Transform rows into structured schema
      const tablesMap = new Map<string, StoredConnection['schema']['tables'][0]>();

      for (const row of rows) {
        const tableName = row.tableName as string;
        if (!tablesMap.has(tableName)) {
          tablesMap.set(tableName, {
            name: tableName,
            columns: [],
          });
        }
        tablesMap.get(tableName)!.columns.push({
          name: row.columnName as string,
          type: row.dataType as string,
          nullable: row.isNullable as string,
        });
      }

      const tables = Array.from(tablesMap.values());

      // SECURITY: Store credentials + schema only, never live connection
      this.connections.set(mapKey, {
        credentials: dto,
        schema: { tables },
        connectedAt: new Date(),
        userId,
      });

      // SECURITY: Never log credentials — use connectionId only
      console.log(
        `[DB Analyser] Schema loaded for connection: ${connectionId}`,
      );

      return { connectionId, tables };
    } finally {
      // SECURITY: Always destroy DataSource after schema read
      await dataSource.destroy();
    }
  }

  // SECURITY: Generate SQL via Groq, validate SELECT-only, execute with timeout
  async generateAndRunQuery(
    connectionId: string,
    question: string,
    userId: string,
  ): Promise<{
    sql: string;
    results: unknown[];
    rowCount: number;
  }> {
    const mapKey = `${userId}:${connectionId}`;
    const stored = this.connections.get(mapKey);

    if (!stored) {
      throw new AppError('Connection not found or expired', 404);
    }

    // SECURITY: Ensure user can only access their own connections
    if (stored.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    // Build schema string for LLM prompt
    const schemaString = stored.schema.tables
      .map(
        (table) =>
          `Table: ${table.name} (${table.columns
            .map((col) => `${col.name} ${col.type}`)
            .join(', ')})`,
      )
      .join('\n');

    // SECURITY: Use Groq API (NOT OpenAI)
    const model = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: 'llama-3.3-70b-versatile',
      temperature: 0,
    });

    const response = await model.invoke([
      {
        role: 'system',
        content: `You are a MySQL expert. Given this schema:
${schemaString}

Generate ONLY a valid SELECT SQL query.
Rules:
- Return ONLY raw SQL, no markdown, no backticks, no explanation
- Only SELECT statements, never INSERT/UPDATE/DELETE/DROP/ALTER/TRUNCATE
- Use proper MySQL syntax
- Do not add semicolons at the end`,
      },
      {
        role: 'user',
        content: question,
      },
    ]);

    const sql = (response.content as string).trim();

    // SECURITY: Validate query is SELECT only
    if (!sql.toUpperCase().startsWith('SELECT')) {
      throw new AppError('Only SELECT queries are permitted', 400);
    }

    // SECURITY: Re-create a FRESH DataSource for each query execution
    const queryDataSource = this.buildDataSource(
      stored.credentials,
      userId,
      `${connectionId}_query`,
    );

    try {
      await queryDataSource.initialize();

      // SECURITY: Query timeout of 10 seconds via Promise.race
      const results = await Promise.race([
        queryDataSource.query(sql),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Query timed out after 10 seconds')),
            10000,
          ),
        ),
      ]) as unknown[];

      return {
        sql,
        results,
        rowCount: results.length,
      };
    } finally {
      // SECURITY: Always destroy DataSource after query execution
      await queryDataSource.destroy();
    }
  }

  // SECURITY: Remove connection from Map — no persistent storage
  async disconnectDb(
    connectionId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const mapKey = `${userId}:${connectionId}`;

    if (!this.connections.has(mapKey)) {
      throw new AppError('Connection not found', 404);
    }

    this.connections.delete(mapKey);

    return { message: 'Disconnected successfully' };
  }

  // SECURITY: Never return credentials in list
  listConnections(userId: string): Array<{
    connectionId: string;
    database: string;
    connectedAt: Date;
  }> {
    const userConnections: Array<{
      connectionId: string;
      database: string;
      connectedAt: Date;
    }> = [];

    for (const [mapKey, stored] of this.connections.entries()) {
      if (stored.userId === userId) {
        const connectionId = mapKey.split(':')[1];
        userConnections.push({
          connectionId,
          database: stored.credentials.database,
          connectedAt: stored.connectedAt,
        });
      }
    }

    return userConnections;
  }

  // SECURITY: Return schema only, never credentials
  getSchema(
    connectionId: string,
    userId: string,
  ): StoredConnection['schema'] {
    const mapKey = `${userId}:${connectionId}`;
    const stored = this.connections.get(mapKey);

    if (!stored) {
      throw new AppError('Connection not found or expired', 404);
    }

    return stored.schema;
  }
}

// SECURITY: Export singleton instance
export const dbAnalyserService = new DbAnalyserService();
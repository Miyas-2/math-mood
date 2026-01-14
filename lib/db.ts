import { Pool, QueryResult, QueryResultRow } from 'pg';

// PostgreSQL connection pool
const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'mathtutor',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD,
});

// Test connection on startup
pool.on('connect', () => {
    console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Helper function for queries
export async function query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: (string | number | boolean | null | number[])[]
): Promise<QueryResult<T>> {
    const start = Date.now();
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text: text.slice(0, 50), duration, rows: res.rowCount });
    return res;
}

// Get a client for transactions
export async function getClient() {
    const client = await pool.connect();
    return client;
}

export default pool;

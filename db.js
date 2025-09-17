import pg from 'pg';
import { Pool } from 'pg';

let localPoolConfig = {
    user: 'postgres',
    password: '12345',
    // Fixed logic: use localhost as default since your Docker exposes port 5432
    host: process.env.DB_HOST || "localhost",
    port: '5432',
    database: 'jwttut',
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    max: 20
};

const poolConfig = process.env.DATABASE_URL ? { 
    connectionString: process.env.DATABASE_URL, 
    ssl: { rejectUnauthorized: false } 
} : localPoolConfig;

console.log('Database config being used:', {
    ...poolConfig,
    password: '***' // Hide password in logs
});

const pool = new Pool(poolConfig);

// Add connection event handlers for debugging
pool.on('connect', (client) => {
    console.log('✅ New client connected to database');
});

pool.on('error', (err, client) => {
    console.error('❌ Unexpected error on idle client', err);
});

// Test the connection when the module loads
pool.query('SELECT NOW()', (err, result) => {
    if (err) {
        console.error('❌ Database connection test failed:', err);
        console.error('Host being used:', localPoolConfig.host);
    } else {
        console.log('✅ Database connected successfully at:', result.rows[0].now);
    }
});

export default pool;
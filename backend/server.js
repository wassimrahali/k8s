require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// env defaults
const {
  DB_HOST = 'localhost',
  DB_PORT = 3306,
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'mydb',
  PORT = 3000
} = process.env;

let pool;

async function initDb() {
  pool = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  // ensure table exists
  await pool.query(`CREATE TABLE IF NOT EXISTS notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    text VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`);
}

initDb().catch(err => {
  console.error('Failed to initialize DB:', err);
  process.exit(1);
});

// basic endpoints
app.get('/api/notes', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM notes ORDER BY id DESC LIMIT 100');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
});

app.post('/api/notes', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });
  try {
    const [result] = await pool.query('INSERT INTO notes (text) VALUES (?)', [text]);
    res.status(201).json({ id: result.insertId, text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
});

// health/readiness endpoints
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/ready', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ready: true });
  } catch (err) {
    res.status(500).json({ ready: false });
  }
});

app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));

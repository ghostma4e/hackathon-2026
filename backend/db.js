const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false
  }
});

// Проверка
pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ Ошибка подключения:', err.message);
  }
  console.log('🐘 ЕСТЬ КОНТАКТ! Подключено через Transaction Pooler!');
  release();
});

module.exports = pool;
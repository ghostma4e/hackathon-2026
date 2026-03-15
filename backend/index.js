require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();

// Настройка CORS для деплоя
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Инициализация БД
const initDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS teams (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                score INTEGER DEFAULT 0
            );
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'user'
            );
        `);
        console.log("✅ База данных готова");
    } catch (err) {
        console.error("❌ Ошибка БД:", err.message);
    }
};
initDB();

// МАРШРУТЫ
app.get('/api/teams', async (req, res) => {
    try {
        const allTeams = await pool.query("SELECT * FROM teams ORDER BY score DESC, id ASC");
        res.json(allTeams.rows);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/api/teams', async (req, res) => {
    try {
        const { name } = req.body;
        const newTeam = await pool.query("INSERT INTO teams (name) VALUES($1) RETURNING *", [name]);
        res.json(newTeam.rows[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const newUser = await pool.query(
            "INSERT INTO users (username, password, role) VALUES($1, $2, 'user') RETURNING *",
            [username, password]
        );
        res.json(newUser.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Пользователь уже существует" });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await pool.query("SELECT * FROM users WHERE username = $1 AND password = $2", [username, password]);
        if (user.rows.length > 0) res.json(user.rows[0]);
        else res.status(401).json({ error: "Неверный логин или пароль" });
    } catch (err) {
        res.status(500).send("Ошибка сервера");
    }
});

app.patch('/api/teams/:id/score', async (req, res) => {
    try {
        const { id } = req.params;
        const { amount } = req.body;
        const updatedTeam = await pool.query(
            "UPDATE teams SET score = score + $1 WHERE id = $2 RETURNING *",
            [amount, id]
        );
        res.json(updatedTeam.rows[0]);
    } catch (err) {
        res.status(500).send("Ошибка баллов");
    }
});

// Удаление команды (только для админов)
app.delete('/api/teams/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM teams WHERE id = $1', [id]);
    res.json({ message: "Удалено" });
  } catch (err) {
    res.status(500).json({ error: "Ошибка базы данных" });
  }
});

// ПОРТ ДЛЯ ДЕПЛОЯ (динамический)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
});
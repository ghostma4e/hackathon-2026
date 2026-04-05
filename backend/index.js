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
        // Обновленная структура таблицы с кодом и владельцем
        await pool.query(`
            CREATE TABLE IF NOT EXISTS teams (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                score INTEGER DEFAULT 0,
                invite_code VARCHAR(255),
                owner_username VARCHAR(255),
                project_url TEXT
            );
        `);
        console.log("✅ База данных синхронизирована");
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
  // Вывод в терминал (черное окно консоли)
  console.log("--------------------------");
  console.log("ПОЛУЧЕНО ОТ ФРОНТЕНДА:", req.body); 

  const { name, invite_code } = req.body;

  // Если вдруг invite_code не дошел, этот блок создаст его принудительно
  const safeCode = invite_code || "TEST_" + Math.floor(Math.random() * 100);

  try {
    const result = await pool.query(
      'INSERT INTO teams (name, score, invite_code) VALUES ($1, 0, $2) RETURNING *',
      [name || "Без названия", safeCode]
    );
    
    console.log("УСПЕШНО ЗАПИСАНО В БД:", result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("ОШИБКА ПРИ ЗАПИСИ В БД:", err.message);
    res.status(500).json({ error: err.message });
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

// 1. Вступление в команду по секретному коду
app.patch('/api/teams/join', async (req, res) => {
  const { invite_code, username } = req.body;
  try {
    // Ищем команду с таким кодом, которая еще никем не занята
    const checkTeam = await pool.query(
      'SELECT * FROM teams WHERE invite_code = $1',
      [invite_code]
    );

    if (checkTeam.rows.length === 0) {
      return res.status(404).json({ error: "Неверный код команды" });
    }

    if (checkTeam.rows[0].owner_username) {
      return res.status(400).json({ error: "Эта команда уже занята другим участником" });
    }

    // Привязываем юзера к команде
    const result = await pool.query(
      'UPDATE teams SET owner_username = $1 WHERE invite_code = $2 RETURNING *',
      [username, invite_code]
    );

    res.json({ message: "Вы успешно стали капитаном команды!", team: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Ошибка сервера при вступлении" });
  }
});

// 2. Обновление ссылки на проект (для капитана)
app.patch('/api/teams/:id/project', async (req, res) => {
  const { id } = req.params;
  const { project_url } = req.body;
  try {
    await pool.query('UPDATE teams SET project_url = $1 WHERE id = $2', [project_url, id]);
    res.json({ message: "Проект успешно обновлен!" });
  } catch (err) {
    res.status(500).json({ error: "Ошибка при сохранении ссылки" });
  }
});
// Маршрут для сохранения оценок
app.patch('/api/teams/:id/rate', async (req, res) => {
  const { id } = req.params;
  
  // 1. ПРИНУДИТЕЛЬНОЕ ПРЕОБРАЗОВАНИЕ (Чистим данные)
  const tech = parseInt(req.body.tech, 10) || 0;
  const design = parseInt(req.body.design, 10) || 0;
  const idea = parseInt(req.body.idea, 10) || 0;
  const comment = String(req.body.comment || "");

  // Считаем общую сумму
  const totalScore = tech + design + idea;

  console.log(`>>> Сохраняем для команды ${id}: T:${tech} D:${design} I:${idea}`);

  try {
    const { data, error } = await supabase
      .from('teams')
      .update({ 
        score_tech: tech, 
        score_design: design, 
        score_idea: idea, 
        judge_comment: comment,
        score: totalScore 
      })
      .eq('id', id)
      .select(); // Важно, чтобы вернулись данные

    if (error) {
      console.error('Ошибка Supabase:', error.message);
      return res.status(400).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      console.log('Запрос прошел, но команда не найдена. Проверь ID:', id);
      return res.status(404).json({ error: "Команда не найдена" });
    }

    res.json({ message: "Успешно!", data: data[0] });
  } catch (err) {
    console.error('Ошибка сервера:', err);
    res.status(500).json({ error: "Server Error" });
  }
});
// ПОРТ ДЛЯ ДЕПЛОЯ (динамический)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
});
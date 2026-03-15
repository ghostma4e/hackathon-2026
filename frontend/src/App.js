import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Настройка URL сервера (авто-определение для Vite, Create React App или прямой адрес)
const API_URL = process.env.REACT_APP_API_URL || 
                import.meta.env?.VITE_API_URL || 
                'https://hackathon-2026-4g0h.onrender.com';

function App() {
  // Инициализация пользователя из localStorage, чтобы не вылетало при обновлении
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('hack_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  
  const [deletingId, setDeletingId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [teams, setTeams] = useState([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [isRegistering, setIsRegistering] = useState(false);

  const fetchTeams = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/teams`);
      const sortedTeams = res.data.sort((a, b) => b.score - a.score);
      setTeams(sortedTeams);
    } catch (err) {
      console.error("Ошибка при загрузке команд", err);
    }
  };

  useEffect(() => {
    if (user) fetchTeams();
  }, [user]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError(''); // Сбрасываем старую ошибку перед новой попыткой

    // Проверка совпадения паролей
    if (isRegistering && form.password !== form.confirmPassword) {
      setAuthError("Пароли не совпадают!");
      return;
    }

    const path = isRegistering ? 'register' : 'login';
    try {
      const res = await axios.post(`${API_URL}/api/${path}`, form);
      setUser(res.data);
      localStorage.setItem('hack_user', JSON.stringify(res.data));
    } catch (err) {
      // Вместо alert пишем ошибку сервера в наш текст
      setAuthError(err.response?.data?.error || "Ошибка сервера");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('hack_user'); // Очищаем память
    setUser(null);                       // Выходим
  };

  const addTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName) return;
    try {
        await axios.post(`${API_URL}/api/teams`, { name: newTeamName });
        setNewTeamName('');
        fetchTeams();
    } catch (err) { alert("Ошибка при добавлении"); }
  };

  const changeScore = async (id, amount) => {
    try {
      await axios.patch(`${API_URL}/api/teams/${id}/score`, { amount });
      fetchTeams();
    } catch (err) {
      alert("Ошибка при обновлении баллов");
    }
  };
  // Эта функция должна быть в App.js, чтобы кнопка её видела
  const deleteTeam = async (id) => {

    try {
      // Говорим серверу удалить запись из базы
      await axios.delete(`${API_URL}/api/teams/${id}`);
      // Обновляем список на экране
      fetchTeams();
    } catch (err) {
      console.error(err);
      alert("Ошибка при удалении команды");
    }
  };

  // --- ЭКРАН ВХОДА ---
  if (!user) {
    return (
      <div className="min-h-screen bg-indigo-950 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl border border-white/20 w-full max-w-md shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            {isRegistering ? 'Регистрация' : 'Вход в систему'}
          </h2>
          <form onSubmit={handleAuth} className="space-y-4 text-white">
            <input 
              className="w-full bg-white/5 border border-white/10 p-3 rounded-xl outline-none" 
              placeholder="Логин" 
              onChange={e => setForm({...form, username: e.target.value})}
            />

            {/* ПОЛЕ ПАРОЛЯ С ГЛАЗКОМ */}
            <div className="relative">
              <input 
                className="w-full bg-white/5 border border-white/10 p-3 rounded-xl outline-none pr-12" 
                type={showPassword ? "text" : "password"} 
                placeholder="Пароль" 
                onChange={e => setForm({...form, password: e.target.value})}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-cyan-400 transition-colors"
              >
                {showPassword ? "👁️‍🗨️" : "👁️"}
              </button>
            </div>
            
            {isRegistering && (
              <div className="relative animate-in fade-in slide-in-from-top-2 duration-300">
                <input 
                  className="w-full bg-white/5 border border-white/10 p-3 rounded-xl outline-none pr-12" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Повторите пароль" 
                  onChange={e => setForm({...form, confirmPassword: e.target.value})}
                />
              </div>
            )}

            {authError && (
              <p className="text-red-400 text-sm font-medium animate-pulse ml-1">
                ⚠️ {authError}
              </p>
            )}

            <button className="w-full bg-cyan-500 py-3 rounded-xl font-bold hover:bg-cyan-400 transition-all mt-2">
              {isRegistering ? 'Создать аккаунт' : 'Войти'}
            </button>
          </form>
          <button 
            onClick={() => {
              setIsRegistering(!isRegistering);
              setAuthError('');
              setShowPassword(false); // Скрываем пароль при переключении режима
            }} 
            className="w-full text-cyan-400 mt-4 text-sm"
          >
            {isRegistering ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Регистрация'}
          </button>
        </div>
      </div>
    );
  }

  // --- ГЛАВНЫЙ ЭКРАН ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white p-6 sm:p-10 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* ХЕДЕР */}
        <div className="flex justify-between items-center mb-10 bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase">Hackathon <span className="text-cyan-400">2026</span></h1>
            <p className="text-xs text-cyan-400 font-mono">Status: Connected to Cloud DB</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-50">Пользователь:</p>
            <p className="font-bold text-white">{user.username} <span className="text-cyan-400 text-xs">[{user.role}]</span></p>
            <button onClick={handleLogout} className="text-xs text-red-400 underline hover:text-red-300 transition-colors">Выйти</button>
          </div>
        </div>

        {/* АДМИН-ПАНЕЛЬ: СОЗДАНИЕ КОМАНДЫ */}
        {user.role === 'admin' && (
          <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
            <h3 className="text-lg font-semibold mb-3 ml-2 text-white/70">Управление командами</h3>
            <form onSubmit={addTeam} className="flex gap-2 bg-white/10 p-2 rounded-2xl border border-white/20 shadow-lg">
              <input 
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Название новой команды..."
                className="bg-transparent px-4 py-2 outline-none flex-grow text-white placeholder:text-white/30"
              />
              <button type="submit" className="bg-cyan-500 hover:bg-cyan-400 px-6 py-2 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-cyan-500/20">
                Создать
              </button>
            </form>
          </div>
        )}

        {/* ТАБЛИЦА ЛИДЕРОВ */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">🏆 Таблица лидеров</h2>
          <div className="space-y-4">
  {/* Сортируем команды по убыванию баллов перед выводом */}
  {[...teams].sort((a, b) => b.score - a.score).map((t, index) => (
    <div 
      key={t.id} 
      className={`flex justify-between items-center p-5 rounded-2xl border transition-all duration-500 ${
        index === 0 
        ? 'bg-yellow-500/10 border-yellow-500/50 shadow-[0_0_25px_rgba(234,179,8,0.15)] scale-[1.01]' 
        : 'bg-white/5 border-white/5 hover:bg-white/10'
      }`}
    >
      {/* Левая часть: Место и Имя */}
      <div className="flex items-center gap-4">
        <span className={`text-2xl font-black min-w-[40px] ${
          index === 0 ? 'text-yellow-400 animate-pulse' : 
          index === 1 ? 'text-slate-300' : 
          index === 2 ? 'text-orange-400' : 'text-white/20'
        }`}>
          #{index + 1}
        </span>
        <span className={`text-xl font-light tracking-wide ${index === 0 ? 'font-bold text-yellow-50' : 'text-white'}`}>
          {t.name}
        </span>
      </div>

      {/* Правая часть: Кнопки и Очки */}
      <div className="flex items-center gap-4">
        {(user.role === 'admin' || user.role === 'judge') && (
          <div className="flex gap-1 mr-2 items-center">
            <button 
              onClick={() => changeScore(t.id, -10)} 
              className="bg-white/10 hover:bg-red-500/40 w-9 h-9 rounded-lg border border-white/10 text-white transition-all flex items-center justify-center font-bold"
            >-</button>
            <button 
              onClick={() => changeScore(t.id, 10)} 
              className="bg-white/10 hover:bg-green-500/40 w-9 h-9 rounded-lg border border-white/10 text-white transition-all flex items-center justify-center font-bold"
            >+</button>

            {/* УМНАЯ КНОПКА УДАЛЕНИЯ */}
            {/* УМНАЯ КНОПКА УДАЛЕНИЯ */}
{user.role === 'admin' && (
  <div className="flex items-center ml-2">
    {deletingId === t.id ? (
      <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
        <button 
          onClick={() => {
            deleteTeam(t.id);
            setDeletingId(null);
          }} 
          className="bg-red-600 px-3 h-9 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(220,38,38,0.5)] border border-red-400"
        >
          Удалить?
        </button>
        <button 
          onClick={() => setDeletingId(null)}
          className="text-[10px] text-white/40 hover:text-white uppercase font-bold tracking-widest transition-colors p-2"
        >
          Отмена
        </button>
      </div>
    ) : (
      <button 
        onClick={() => setDeletingId(t.id)} 
        className="bg-red-600/20 hover:bg-red-600 w-9 h-9 rounded-lg border border-red-600/50 text-white transition-all flex items-center justify-center shadow-lg hover:scale-110 active:scale-95"
        title="Удалить команду"
      >
        🗑️
      </button>
    )}
 
                {/* Кнопка отмены, если уже нажали "Удалить?" */}
                {deletingId === t.id && (
                  <button 
                    onClick={() => setDeletingId(null)}
                    className="absolute -top-8 left-0 text-[10px] text-white/40 hover:text-white underline"
                  >
                    
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        
        <span className={`px-5 py-1.5 rounded-full text-sm font-black border transition-all duration-500 ${
          index === 0 
          ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.3)]' 
          : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
        }`}>
          {t.score} PTS
        </span>
      </div>
    </div>
  ))}


            {/* Заглушка если пусто */}
            {teams.length === 0 && (
              <div className="text-center py-20 opacity-30 italic">
                <p className="text-4xl mb-2">📁</p>
                <p>Команд пока нет...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
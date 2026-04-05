import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000' 
  : 'https://hackathon-2026-4g0h.onrender.com';

function App() {
  const { t, i18n } = useTranslation();
  
  // --- СОСТОЯНИЯ ---
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('hack_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [teams, setTeams] = useState([]);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });
  const [ratingData, setRatingData] = useState({ tech: 0, design: 0, idea: 0, comment: '' });
  const [ratingId, setRatingId] = useState(null);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [tempUrl, setTempUrl] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [newInviteCode, setNewInviteCode] = useState('');
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [isRegistering, setIsRegistering] = useState(false);

  // --- ЛОГИКА ---
  const fetchTeams = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/teams`);
      setTeams(res.data.sort((a, b) => b.score - a.score));
    } catch (err) { console.error(err); }
  };

  useEffect(() => { if (user) fetchTeams(); }, [user]);

  const showNotify = (text, type = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage({ text: '', type: '' }), 4000);
  };

  const changeLanguage = (lng) => i18n.changeLanguage(lng);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (isRegistering && form.password !== form.confirmPassword) {
      setAuthError("Пароли не совпадают!");
      return;
    }
    const path = isRegistering ? 'register' : 'login';
    try {
      const res = await axios.post(`${API_URL}/api/${path}`, form);
      setUser(res.data);
      localStorage.setItem('hack_user', JSON.stringify(res.data));
    } catch (err) { setAuthError(err.response?.data?.error || "Ошибка сервера"); }
  };

  const handleLogout = () => {
    localStorage.removeItem('hack_user');
    setUser(null);
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    setNewInviteCode(result);
  };

  const addTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim() || !newInviteCode.trim()) return showNotify("Заполните поля!", "error");
    try {
      await axios.post(`${API_URL}/api/teams`, { name: newTeamName, invite_code: newInviteCode });
      showNotify("Команда создана!");
      setNewTeamName(''); setNewInviteCode('');
      fetchTeams();
    } catch (err) { showNotify("Ошибка создания", "error"); }
  };

  const joinTeam = async (code) => {
    if (!code) return showNotify("Введите код!", "error");
    try {
      await axios.patch(`${API_URL}/api/teams/join`, { invite_code: code, username: user.username });
      showNotify("Успешно!");
      fetchTeams();
    } catch (err) { showNotify("Ошибка", "error"); }
  };

  const updateProjectUrl = async (id, url) => {
    try {
      await axios.patch(`${API_URL}/api/teams/${id}/project`, { project_url: url });
      showNotify("Проект сохранен!");
      setEditingProjectId(null);
      fetchTeams();
    } catch (err) { showNotify("Ошибка", "error"); }
  };

  const submitRating = async (id) => {
    try {
      await axios.patch(`${API_URL}/api/teams/${id}/rate`, ratingData);
      showNotify("Оценки сохранены!");
      setRatingId(null);
      fetchTeams();
    } catch (err) { showNotify("Ошибка", "error"); }
  };

  const deleteTeam = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/teams/${id}`);
      showNotify("Удалено", "error");
      fetchTeams();
    } catch (err) { showNotify("Ошибка", "error"); }
  };

  // --- ЭКРАН ВХОДА ---
  if (!user) {
    return (
      <div className="min-h-screen bg-indigo-950 flex items-center justify-center p-4">
        {/* КНОПКИ ЯЗЫКА (ВЕРНУЛ) */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button onClick={() => changeLanguage('kk')} className="text-white/50 hover:text-cyan-400 font-bold px-2 transition-colors">KZ</button>
          <button onClick={() => changeLanguage('ru')} className="text-white/50 hover:text-cyan-400 font-bold px-2 transition-colors">RU</button>
          <button onClick={() => changeLanguage('en')} className="text-white/50 hover:text-cyan-400 font-bold px-2 transition-colors">EN</button>
        </div>

        <div className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl border border-white/20 w-full max-w-md shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">{isRegistering ? t('registration') : t('login_title')}</h2>
          <form onSubmit={handleAuth} className="space-y-4">
            <input className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-cyan-500/50" placeholder={t('username_placeholder')} onChange={e => setForm({...form, username: e.target.value})} />
            <div className="relative">
              <input className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none pr-12 focus:border-cyan-500/50" type={showPassword ? "text" : "password"} placeholder={t('password')} onChange={e => setForm({...form, password: e.target.value})} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-cyan-400 transition-colors">
                {showPassword ? "👁️‍🗨️" : "👁️"}
              </button>
            </div>
            {isRegistering && <input className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none animate-in fade-in slide-in-from-top-2" type={showPassword ? "text" : "password"} placeholder={t('confirm_password')} onChange={e => setForm({...form, confirmPassword: e.target.value})} />}
            {authError && <p className="text-red-400 text-sm font-medium animate-pulse">⚠️ {authError}</p>}
            <button className="w-full bg-cyan-500 py-3 rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-cyan-500/20 uppercase tracking-widest mt-2">{isRegistering ? t('create_account') : t('login_btn')}</button>
          </form>
          <button onClick={() => setIsRegistering(!isRegistering)} className="w-full text-cyan-400 mt-4 text-sm underline opacity-70 hover:opacity-100">
            {isRegistering ? t('have_account') : t('no_account')}
          </button>
        </div>
      </div>
    );
  }

  // --- ГЛАВНЫЙ ЭКРАН ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white p-6 sm:p-10 relative overflow-x-hidden">
      <div className="max-w-4xl mx-auto">
        
        {/* УВЕДОМЛЕНИЯ */}
        {statusMessage.text && (
          <div className={`fixed top-5 right-5 z-[210] px-6 py-3 rounded-xl border animate-in fade-in slide-in-from-top-4 duration-300 shadow-2xl ${statusMessage.type === 'error' ? 'bg-red-500/30 border-red-500 text-red-100' : 'bg-green-500/30 border-green-500 text-green-100'}`}>
            {statusMessage.text}
          </div>
        )}

        {/* ХЕДЕР */}
        <div className="flex justify-between items-center mb-10 bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase">Hackathon <span className="text-cyan-400">2026</span></h1>
              <p className="text-[10px] text-cyan-400 font-mono opacity-50 uppercase tracking-widest">Connected to Cloud DB</p>
            </div>
            {/* КНОПКИ ЯЗЫКА В ХЕДЕРЕ (ВЕРНУЛ) */}
            <div className="flex gap-2 bg-black/20 p-1 rounded-lg">
              <button onClick={() => changeLanguage('kk')} className="text-[10px] font-bold px-2 py-1 hover:text-cyan-400 transition-colors">KZ</button>
              <button onClick={() => changeLanguage('ru')} className="text-[10px] font-bold px-2 py-1 hover:text-cyan-400 transition-colors">RU</button>
              <button onClick={() => changeLanguage('en')} className="text-[10px] font-bold px-2 py-1 hover:text-cyan-400 transition-colors">EN</button>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-50">{t('user_label')}:</p>
            <p className="font-bold text-white">{user.username} <span className="text-cyan-400 text-xs">[{user.role}]</span></p>
            <button onClick={handleLogout} className="text-xs text-red-400 underline hover:text-red-300 transition-colors">{t('logout')}</button>
          </div>
        </div>

        {/* АДМИН-ПАНЕЛЬ */}
        {user.role === 'admin' && (
          <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
            <h3 className="text-sm font-semibold mb-3 ml-2 text-white/50 uppercase tracking-widest">{t('manage_teams')}</h3>
            <form onSubmit={addTeam} className="flex flex-col gap-3 bg-white/10 p-4 rounded-3xl border border-white/20 shadow-xl">
              <input value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder={t('new_team_placeholder')} className="bg-black/20 px-4 py-3 rounded-xl border border-white/5 outline-none focus:border-cyan-500/50 transition-all" />
              <div className="flex gap-2">
                <input value={newInviteCode} onChange={(e) => setNewInviteCode(e.target.value)} placeholder="Код приглашения" className="bg-black/20 px-4 py-3 rounded-xl flex-grow font-mono uppercase outline-none focus:border-purple-500/50 transition-all" />
                <button type="button" onClick={generateRandomCode} className="bg-purple-600/20 hover:bg-purple-600/40 px-4 rounded-xl border border-purple-500/30 transition-all active:scale-90">🎲</button>
                <button type="submit" className="bg-cyan-500 hover:bg-cyan-400 px-8 rounded-xl font-bold text-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-cyan-500/20">{t('create_btn')}</button>
              </div>
            </form>
          </div>
        )}

        {/* ПАНЕЛЬ УЧАСТНИКА */}
        {user.role === 'user' && (
          <div className="mb-8 bg-white/5 p-4 rounded-3xl border border-white/10 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
            <p className="text-sm font-bold text-white/50 ml-2">🔑 Вступить:</p>
            <input id="inviteField" placeholder="Введите код..." className="bg-black/30 border border-white/10 px-4 py-2 rounded-xl flex-grow outline-none focus:border-cyan-500 font-mono uppercase transition-all" />
            <button onClick={() => joinTeam(document.getElementById('inviteField').value.toUpperCase())} className="bg-cyan-500 hover:bg-cyan-400 px-6 py-2 rounded-xl font-bold text-black hover:scale-105 active:scale-95 transition-all">ОК</button>
          </div>
        )}

        {/* ТАБЛИЦА */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">🏆 {t('leaderboard_title')}</h2>
          <div className="space-y-4">
            {teams.map((t_team, index) => (
              <div key={t_team.id} className={`flex justify-between items-center p-5 rounded-2xl border transition-all duration-300 ${index === 0 ? 'bg-yellow-500/10 border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.1)] scale-[1.01]' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                <div className="flex items-center gap-5 flex-grow">
                  <span className="text-3xl font-black opacity-10 w-8">{index + 1}</span>
                  <div>
                    <h3 className="font-bold text-xl">{t_team.name || "Команда"}</h3>
                    {user.role === 'admin' && <p className="text-[10px] font-mono text-cyan-400 mt-1">ID: {t_team.id} | CODE: {t_team.invite_code}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {t_team.project_url && <a href={t_team.project_url} target="_blank" rel="noreferrer" className="bg-white/5 hover:bg-cyan-500/20 w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-lg">🔗</a>}
                  
                  {user.username === t_team.owner_username && (
                    editingProjectId === t_team.id ? (
                      <div className="flex gap-1 animate-in zoom-in duration-200">
                        <input autoFocus value={tempUrl} onChange={(e) => setTempUrl(e.target.value)} className="bg-black/60 border border-purple-500 px-3 py-1.5 rounded-lg text-xs w-32 outline-none" />
                        <button onClick={() => updateProjectUrl(t_team.id, tempUrl)} className="bg-green-600 px-3 rounded-lg text-[10px] font-bold">ОК</button>
                        <button onClick={() => setEditingProjectId(null)} className="bg-white/10 px-2 rounded-lg text-[10px]">✖</button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingProjectId(t_team.id); setTempUrl(t_team.project_url || ""); }} className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:scale-105 active:scale-95 transition-all shadow-lg shadow-purple-500/20">
                        {t_team.project_url ? '📝 Обновить' : '🚀 Сдать'}
                      </button>
                    )
                  )}

                  {(user.role === 'admin' || user.role === 'judge') && (
                    <div className="flex gap-2">
                      <button onClick={() => { 
                        setRatingId(t_team.id); 
                        setRatingData({ tech: t_team.score_tech || 0, design: t_team.score_design || 0, idea: t_team.score_idea || 0, comment: t_team.judge_comment || '' });
                      }} className="bg-white/10 hover:bg-cyan-500/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-white/5 hover:border-cyan-500/30 transition-all hover:scale-105 active:scale-95">⭐ Оценить</button>
                      
                      {user.role === 'admin' && (
                        deletingId === t_team.id ? (
                          <button onClick={() => { deleteTeam(t_team.id); setDeletingId(null); }} className="bg-red-600 px-4 rounded-xl text-[10px] font-black animate-pulse">Да, удалить</button>
                        ) : (
                          <button onClick={() => setDeletingId(t_team.id)} className="bg-red-600/10 hover:bg-red-600 w-10 h-10 rounded-xl border border-red-600/30 flex items-center justify-center hover:scale-110 active:scale-90 transition-all">🗑️</button>
                        )
                      )}
                    </div>
                  )}
                  <div className={`px-5 py-2 rounded-2xl font-black text-sm border whitespace-nowrap ${index === 0 ? 'bg-yellow-400 text-black border-yellow-300 shadow-lg' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'}`}>
                    {t_team.score} PTS
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* МОДАЛЬНОЕ ОКНО ОЦЕНКИ */}
      {ratingId && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl"></div>
          <div className="relative bg-[#1a1625] border border-white/10 p-10 rounded-[3rem] w-full max-w-md shadow-2xl animate-modal">
            <h2 className="text-2xl font-black mb-8 flex items-center gap-2">⭐ Оценка: <span className="text-cyan-400">{teams.find(t => t.id === ratingId)?.name}</span></h2>
            <div className="space-y-8">
              {[{k:'tech', l:'Технологии'}, {k:'design', l:'Дизайн'}, {k:'idea', l:'Идея'}].map(c => (
                <div key={c.k} className="group">
                  <div className="flex justify-between text-[11px] uppercase font-black text-white/40 mb-3 group-hover:text-cyan-400 transition-colors">
                    <span>{c.l}</span>
                    <span className="bg-white/5 px-2 py-1 rounded text-white">{ratingData[c.k]}/10</span>
                  </div>
                  <input type="range" min="0" max="10" value={ratingData[c.k]} onChange={(e) => setRatingData({...ratingData, [c.k]: parseInt(e.target.value)})} className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
                </div>
              ))}
              <textarea placeholder="Фидбек судьи..." value={ratingData.comment} onChange={(e) => setRatingData({...ratingData, comment: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-cyan-500/50 h-32 resize-none transition-all" />
              <div className="flex gap-4">
                <button onClick={() => submitRating(ratingId)} className="flex-grow bg-cyan-500 hover:bg-cyan-400 py-5 rounded-[1.5rem] font-black uppercase text-xs text-black hover:scale-105 active:scale-95 transition-all shadow-xl shadow-cyan-500/20">Сохранить</button>
                <button onClick={() => setRatingId(null)} className="bg-white/5 hover:bg-white/10 px-7 rounded-[1.5rem] border border-white/10 transition-all text-xl">✖</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
 // Замени блок resources в твоем i18n.js на этот:
resources: {
  ru: {
    translation: {
      "login_title": "Вход в систему",
      "registration": "Регистрация",
      "username_placeholder": "Логин",
      "password": "Пароль",
      "confirm_password": "Повторите пароль",
      "login_btn": "Войти",
      "create_account": "Создать аккаунт",
      "have_account": "Уже есть аккаунт? Войти",
      "no_account": "Нет аккаунта? Регистрация",
      "user_label": "Пользователь",
      "logout": "Выйти",
      "manage_teams": "Управление командами",
      "new_team_placeholder": "Название новой команды...",
      "create_btn": "Создать",
      "leaderboard_title": "Таблица лидеров",
      "delete_confirm": "Удалить?",
      "cancel": "Отмена",
      "no_teams": "Команд пока нет..."
    }
  },
  kk: {
    translation: {
      "login_title": "Жүйеге кіру",
      "registration": "Тіркелу",
      "username_placeholder": "Логин",
      "password": "Құпия сөз",
      "confirm_password": "Құпия сөзді қайталаңыз",
      "login_btn": "Кіру",
      "create_account": "Аккаунт жасау",
      "have_account": "Аккаунт бар ма? Кіру",
      "no_account": "Аккаунт жоқ па? Тіркелу",
      "user_label": "Пайдаланушы",
      "logout": "Шығу",
      "manage_teams": "Командаларды басқару",
      "new_team_placeholder": "Жаңа команда атауы...",
      "create_btn": "Жасау",
      "leaderboard_title": "Көшбасшылар кестесі",
      "delete_confirm": "Жою керек пе?",
      "cancel": "Бас тарту",
      "no_teams": "Командалар әлі жоқ..."
    }
  },
  en: {
    translation: {
      "login_title": "Login",
      "registration": "Registration",
      "username_placeholder": "Username",
      "password": "Password",
      "confirm_password": "Confirm Password",
      "login_btn": "Sign In",
      "create_account": "Create Account",
      "have_account": "Already have an account? Login",
      "no_account": "No account? Register",
      "user_label": "User",
      "logout": "Logout",
      "manage_teams": "Manage Teams",
      "new_team_placeholder": "New team name...",
      "create_btn": "Create",
      "leaderboard_title": "Leaderboard",
      "delete_confirm": "Delete?",
      "cancel": "Cancel",
      "no_teams": "No teams yet..."
    }
  }
},
    fallbackLng: "ru",
    interpolation: { escapeValue: false }
  });

export default i18n;
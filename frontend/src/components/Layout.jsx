import { Link, NavLink, Outlet } from 'react-router-dom';

import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import BaseButton from './base/BaseButton';
import { Moon } from './icons/Moon';
import { Sun } from './icons/Sun';

const navClass = ({ isActive }) =>
  `transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'}`;

const Layout = () => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const isDark = theme === 'dark';

  return (
    <div className="min-h-screen bg-slate-100 transition-colors dark:bg-slate-900">
      <header className="border-b border-slate-200 bg-white transition-colors dark:border-slate-700 dark:bg-slate-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-black text-slate-800 dark:text-slate-100"
          >
            <img
              src="/images/logo.png"
              alt="Thinky Games"
              className="h-8 w-8"
            />
            Thinky Games
          </Link>
          <nav className="flex items-center gap-4 text-sm font-semibold">
            <BaseButton
              variant="secondary"
              text
              onClick={toggleTheme}
              aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
              // tooltip={isDark ? 'Modo claro' : 'Modo oscuro'}
              className="rounded-lg p-1.5"
            >
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </BaseButton>
            <NavLink to="/" className={navClass} end>
              Inicio
            </NavLink>
            {token && (
              <NavLink to="/rankings" className={navClass}>
                Rankings
              </NavLink>
            )}
            {token ? (
              <div className="flex items-center gap-3">
                <span className="text-slate-400 dark:text-primary-active">
                  {user?.username}
                </span>
                <BaseButton
                  variant="secondary"
                  text
                  onClick={logout}
                  className="rounded-lg px-3 py-1.5 text-sm font-semibold"
                >
                  Salir
                </BaseButton>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <NavLink to="/login" className={navClass}>
                  Entrar
                </NavLink>
                <NavLink
                  to="/register"
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-white transition-colors hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                >
                  Registrarse
                </NavLink>
              </div>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

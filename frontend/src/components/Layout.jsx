import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet } from 'react-router-dom';

import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import BaseButton from './base/BaseButton';
import { Close } from './icons/Close';
import { Menu } from './icons/Menu';
import { Moon } from './icons/Moon';
import { Sun } from './icons/Sun';

const navClass = ({ isActive }) =>
  `transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'}`;

const mobileNavClass = ({ isActive }) =>
  `block rounded-lg px-3 py-2 transition-colors ${isActive ? 'bg-indigo-50 text-indigo-600 dark:bg-slate-700 dark:text-indigo-400' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'}`;

const LanguageSwitch = () => {
  const { i18n, t } = useTranslation();
  return (
    <select
      value={i18n.language}
      onChange={(event) => i18n.changeLanguage(event.target.value)}
      aria-label={t('shared.language')}
      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
    >
      <option value="es">ES</option>
      <option value="en">EN</option>
      <option value="de">DE</option>
    </select>
  );
};

const Layout = () => {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);
  const checkSession = useAuthStore((state) => state.checkSession);
  const logout = useAuthStore((state) => state.logout);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const isDark = theme === 'dark';
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="min-h-screen bg-slate-100 transition-colors dark:bg-slate-900">
      <header className="border-b border-slate-200 bg-white transition-colors dark:border-slate-700 dark:bg-slate-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-black text-slate-800 dark:text-slate-100"
            onClick={closeMenu}
          >
            <img
              src="/images/logo.png"
              alt="Thinky Games"
              className="h-8 w-8"
            />
            Thinky Games
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-4 text-sm font-semibold md:flex">
            <BaseButton
              variant="secondary"
              text
              onClick={toggleTheme}
              aria-label={
                isDark ? t('layout.theme.light') : t('layout.theme.dark')
              }
              className="rounded-lg p-1.5"
            >
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </BaseButton>
            <LanguageSwitch />
            <NavLink to="/" className={navClass} end>
              {t('layout.nav.home')}
            </NavLink>
            {initialized && user && (
              <NavLink to="/rankings" className={navClass}>
                {t('layout.nav.rankings')}
              </NavLink>
            )}
            {initialized && user ? (
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
                  {t('layout.nav.logout')}
                </BaseButton>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <NavLink to="/login" className={navClass}>
                  {t('layout.nav.login')}
                </NavLink>
                <NavLink
                  to="/register"
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-white transition-colors hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                >
                  {t('layout.nav.register')}
                </NavLink>
              </div>
            )}
          </nav>

          {/* Mobile controls */}
          <div className="flex items-center gap-2 md:hidden">
            <BaseButton
              variant="secondary"
              text
              onClick={toggleTheme}
              aria-label={
                isDark ? t('layout.theme.light') : t('layout.theme.dark')
              }
              className="rounded-lg p-1.5"
            >
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </BaseButton>
            <LanguageSwitch />
            <BaseButton
              variant="secondary"
              text
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-label={
                isMenuOpen ? t('layout.menu.close') : t('layout.menu.open')
              }
              aria-expanded={isMenuOpen}
              className="rounded-lg p-1.5"
            >
              {isMenuOpen ? (
                <Close className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </BaseButton>
          </div>
        </div>

        {/* Mobile menu panel */}
        {isMenuOpen && (
          <nav className="border-t border-slate-200 px-4 py-3 text-sm font-semibold md:hidden dark:border-slate-700">
            <div className="flex flex-col gap-1">
              <NavLink
                to="/"
                className={mobileNavClass}
                end
                onClick={closeMenu}
              >
                {t('layout.nav.home')}
              </NavLink>
              {user && (
                <NavLink
                  to="/rankings"
                  className={mobileNavClass}
                  onClick={closeMenu}
                >
                  {t('layout.nav.rankings')}
                </NavLink>
              )}
              {user ? (
                <>
                  <span className="px-3 py-2 text-slate-400 dark:text-primary-active">
                    {user?.username}
                  </span>
                  <BaseButton
                    variant="secondary"
                    text
                    onClick={() => {
                      closeMenu();
                      logout();
                    }}
                    className="rounded-lg px-3 py-2 text-left text-sm font-semibold"
                  >
                    {t('layout.nav.logout')}
                  </BaseButton>
                </>
              ) : (
                <>
                  <NavLink
                    to="/login"
                    className={mobileNavClass}
                    onClick={closeMenu}
                  >
                    {t('layout.nav.login')}
                  </NavLink>
                  <NavLink
                    to="/register"
                    className="block rounded-lg bg-slate-800 px-3 py-2 text-white transition-colors hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                    onClick={closeMenu}
                  >
                    {t('layout.nav.register')}
                  </NavLink>
                </>
              )}
            </div>
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

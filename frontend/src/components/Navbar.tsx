'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/lib/theme-context';
import { useI18n } from '@/lib/i18n-context';

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { href: '/dashboard', label: t('nav.dashboard'), icon: '📊' },
    { href: '/tasks', label: t('nav.tasks'), icon: '⚡' },
    { href: '/logs', label: t('nav.logs'), icon: '📋' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/85 dark:bg-stone-900/85 backdrop-blur-md border-b border-amber-200/40 dark:border-amber-800/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-amber-600 rounded-xl flex items-center justify-center shadow-md shadow-amber-600/20 group-hover:shadow-amber-600/40 transition-all duration-300 group-hover:scale-110">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-lg text-amber-800 dark:text-amber-200 hidden sm:block">
              Task Scheduler
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  pathname === item.href
                    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 shadow-sm'
                    : 'text-gray-600 dark:text-stone-400 hover:bg-amber-50 dark:hover:bg-stone-800 hover:text-amber-800 dark:hover:text-amber-200'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="p-2 rounded-xl bg-amber-50 dark:bg-stone-800 border border-amber-200/50 dark:border-amber-800/30 hover:bg-amber-100 dark:hover:bg-stone-700 active:scale-95 transition-all duration-300"
                title={t('nav.settings')}
              >
                <span className="text-lg">⚙️</span>
              </button>

              {settingsOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-stone-800 rounded-xl shadow-xl border border-amber-200/40 dark:border-amber-800/30 py-2 animate-slide-down z-50">
                  <div className="px-4 py-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    {t('nav.settings')}
                  </div>

                  <div className="px-4 py-2">
                    <p className="text-xs text-gray-500 dark:text-stone-400 mb-2">{t('settings.language')}</p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setLang('th')}
                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          lang === 'th'
                            ? 'bg-amber-600 text-white'
                            : 'bg-amber-50 dark:bg-stone-700 text-gray-600 dark:text-stone-300 hover:bg-amber-100 dark:hover:bg-stone-600'
                        }`}
                      >
                        🇹🇭 ไทย
                      </button>
                      <button
                        onClick={() => setLang('en')}
                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          lang === 'en'
                            ? 'bg-amber-600 text-white'
                            : 'bg-amber-50 dark:bg-stone-700 text-gray-600 dark:text-stone-300 hover:bg-amber-100 dark:hover:bg-stone-600'
                        }`}
                      >
                        🇬🇧 English
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-amber-100 dark:border-stone-700 my-1" />

                  <div className="px-4 py-2">
                    <p className="text-xs text-gray-500 dark:text-stone-400 mb-2">{t('settings.theme')}</p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => theme !== 'light' && toggleTheme()}
                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          theme === 'light'
                            ? 'bg-amber-600 text-white'
                            : 'bg-amber-50 dark:bg-stone-700 text-gray-600 dark:text-stone-300 hover:bg-amber-100 dark:hover:bg-stone-600'
                        }`}
                      >
                        ☀️ {t('settings.light')}
                      </button>
                      <button
                        onClick={() => theme !== 'dark' && toggleTheme()}
                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          theme === 'dark'
                            ? 'bg-amber-600 text-white'
                            : 'bg-amber-50 dark:bg-stone-700 text-gray-600 dark:text-stone-300 hover:bg-amber-100 dark:hover:bg-stone-600'
                        }`}
                      >
                        🌙 {t('settings.dark')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-xl bg-amber-50 dark:bg-stone-800 border border-amber-200/50 dark:border-amber-800/30"
            >
              <div className="w-5 h-5 flex flex-col justify-center gap-1">
                <span className={`block h-0.5 w-5 bg-gray-600 dark:bg-stone-300 transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
                <span className={`block h-0.5 w-5 bg-gray-600 dark:bg-stone-300 transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
                <span className={`block h-0.5 w-5 bg-gray-600 dark:bg-stone-300 transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
              </div>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 animate-slide-down">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  pathname === item.href
                    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200'
                    : 'text-gray-600 dark:text-stone-400 hover:bg-amber-50 dark:hover:bg-stone-800'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}

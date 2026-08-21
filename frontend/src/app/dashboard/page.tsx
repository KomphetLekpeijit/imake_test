'use client';

import Link from 'next/link';
import DashboardStats from '@/components/DashboardStats';
import { useI18n } from '@/lib/i18n-context';

export default function DashboardPage() {
  const { t } = useI18n();

  const actions = [
    {
      href: '/tasks/create',
      icon: '➕',
      title: t('dashboard.createTask'),
      desc: t('dashboard.createTaskDesc'),
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      href: '/tasks',
      icon: '⚡',
      title: t('dashboard.manageTasks'),
      desc: t('dashboard.manageTasksDesc'),
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      href: '/logs',
      icon: '📋',
      title: t('dashboard.viewLogs'),
      desc: t('dashboard.viewLogsDesc'),
      gradient: 'from-cyan-500 to-blue-500',
    },
  ];

  const archItems = [
    { icon: '⚛️', label: t('dashboard.arch1'), gradient: 'from-cyan-400 to-blue-500' },
    { icon: '🚀', label: t('dashboard.arch2'), gradient: 'from-red-400 to-rose-500' },
    { icon: '🔧', label: t('dashboard.arch3'), gradient: 'from-green-400 to-emerald-500' },
    { icon: '🗄️', label: t('dashboard.arch4'), gradient: 'from-amber-400 to-orange-500' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h1 className="heading-text text-3xl sm:text-4xl">{t('dashboard.title')}</h1>
        <p className="sub-text text-lg">{t('dashboard.subtitle')}</p>
      </div>

      <DashboardStats />

      <div className="glass-card-static">
        <h2 className="heading-text text-xl mb-6">{t('dashboard.quickActions')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {actions.map((action) => (
            <Link key={action.href} href={action.href} className="group">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-50/50 dark:bg-stone-800/50 border border-amber-100/60 dark:border-amber-900/30 hover:bg-amber-100/50 dark:hover:bg-stone-800 transition-all duration-300 hover:shadow-md">
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${action.gradient} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 transition-all duration-300`}
                >
                  <span className="text-xl">{action.icon}</span>
                </div>
                <div>
                  <p className="font-bold text-gray-800 dark:text-stone-200">{action.title}</p>
                  <p className="text-sm text-gray-500 dark:text-stone-400">{action.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="glass-card-static">
        <h2 className="heading-text text-xl mb-6">{t('dashboard.architecture')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {archItems.map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-3 p-4 rounded-xl bg-amber-50/50 dark:bg-stone-800/50 border border-amber-100/60 dark:border-amber-900/30 text-center"
            >
              <div
                className={`w-12 h-12 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center shadow-lg`}
              >
                <span className="text-xl">{item.icon}</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-stone-300">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

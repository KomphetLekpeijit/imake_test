'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n-context';

interface Stats {
  total: number;
  success: number;
  failed: number;
  timeout: number;
  activeTasks: number;
  totalTasks: number;
  successRate: string;
}

export default function DashboardStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, []);

  async function loadStats() {
    try {
      const data = await api.logs.stats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass-card animate-pulse">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: t('stats.totalTasks'),
      value: stats.totalTasks,
      icon: '🎯',
      gradient: 'from-amber-500 to-orange-500',
      shadow: 'shadow-amber-500/25',
    },
    {
      label: t('stats.activeTasks'),
      value: stats.activeTasks,
      icon: '⚡',
      gradient: 'from-emerald-400 to-teal-500',
      shadow: 'shadow-emerald-500/25',
    },
    {
      label: t('stats.totalRuns'),
      value: stats.total,
      icon: '🔄',
      gradient: 'from-cyan-400 to-blue-500',
      shadow: 'shadow-cyan-500/25',
    },
    {
      label: t('stats.successRate'),
      value: `${stats.successRate}%`,
      icon: '✅',
      gradient: 'from-green-400 to-emerald-500',
      shadow: 'shadow-green-500/25',
    },
    {
      label: t('stats.failed'),
      value: stats.failed,
      icon: '❌',
      gradient: 'from-red-400 to-rose-500',
      shadow: 'shadow-red-500/25',
    },
    {
      label: t('stats.timeout'),
      value: stats.timeout,
      icon: '⏰',
      gradient: 'from-amber-400 to-yellow-500',
      shadow: 'shadow-amber-400/25',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((card, i) => (
        <div
          key={card.label}
          className="glass-card flex items-center gap-3 p-3 sm:p-4 hover:scale-105 transition-all duration-300 animate-slide-up"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center shadow-lg ${card.shadow} flex-shrink-0`}
          >
            <span className="text-lg sm:text-xl">{card.icon}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
              {card.value}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{card.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

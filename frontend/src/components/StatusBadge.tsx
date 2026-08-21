'use client';

import { useI18n } from '@/lib/i18n-context';

interface Props {
  status: string;
}

export default function StatusBadge({ status }: Props) {
  const { t } = useI18n();

  const styles: Record<string, string> = {
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    timeout: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    running: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    skipped: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  };

  const icons: Record<string, string> = {
    success: '✅',
    failed: '❌',
    timeout: '⏰',
    running: '🔄',
    skipped: '⏭️',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
        styles[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
      }`}
    >
      <span>{icons[status] || '❓'}</span>
      <span>{t(`status.${status}`)}</span>
    </span>
  );
}

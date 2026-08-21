'use client';

import LogTable from '@/components/LogTable';
import { useI18n } from '@/lib/i18n-context';

export default function LogsPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-text text-2xl sm:text-3xl">📋 {t('logs.title')}</h1>
          <p className="sub-text mt-1 text-sm sm:text-base">{t('logs.subtitle')}</p>
        </div>
      </div>

      <LogTable />
    </div>
  );
}

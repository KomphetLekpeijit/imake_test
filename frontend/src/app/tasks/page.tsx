'use client';

import { useRouter } from 'next/navigation';
import TaskTable from '@/components/TaskTable';
import { useI18n } from '@/lib/i18n-context';

export default function TasksPage() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-text text-2xl sm:text-3xl">⚡ {t('tasks.title')}</h1>
          <p className="sub-text mt-1 text-sm sm:text-base">{t('tasks.subtitle')}</p>
        </div>
        <button
          onClick={() => router.push('/tasks/create')}
          className="btn-primary flex items-center gap-2 text-sm sm:text-base"
        >
          <span>+</span>
          <span>{t('tasks.createNew')}</span>
        </button>
      </div>

      <TaskTable />
    </div>
  );
}

'use client';

import TaskForm from '@/components/TaskForm';
import { useI18n } from '@/lib/i18n-context';

export default function CreateTaskPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="heading-text text-2xl sm:text-3xl">✨ {t('taskForm.createTitle')}</h1>
        <p className="sub-text mt-1 text-sm sm:text-base">{t('taskForm.createSubtitle')}</p>
      </div>
      <TaskForm />
    </div>
  );
}

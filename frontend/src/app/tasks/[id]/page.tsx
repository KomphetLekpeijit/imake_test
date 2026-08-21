'use client';

import { useParams } from 'next/navigation';
import TaskForm from '@/components/TaskForm';
import { useI18n } from '@/lib/i18n-context';

export default function EditTaskPage() {
  const params = useParams();
  const id = params.id as string;
  const { t } = useI18n();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="heading-text text-2xl sm:text-3xl">✏️ {t('taskForm.editTitle')}</h1>
        <p className="sub-text mt-1 text-sm sm:text-base">{t('taskForm.editSubtitle')}</p>
      </div>
      <TaskForm taskId={id} />
    </div>
  );
}

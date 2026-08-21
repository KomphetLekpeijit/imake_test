'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n-context';
import { humanizeCron, getNextRunCountdown } from '@/lib/cron-utils';

interface Task {
  id: string;
  name: string;
  cronExpression: string;
  targetUrl: string;
  httpMethod: string;
  isActive: boolean;
  nextRunAt: string | null;
  createdAt: string;
}

export default function TaskTable() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [countdowns, setCountdowns] = useState<Record<string, string>>({});
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const newCountdowns: Record<string, string> = {};
      tasks.forEach((task) => {
        newCountdowns[task.id] = getNextRunCountdown(task.nextRunAt);
      });
      setCountdowns(newCountdowns);
    }, 1000);
    return () => clearInterval(interval);
  }, [tasks]);

  async function loadTasks() {
    try {
      const data = await api.tasks.list();
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  }

  async function runNow(id: string, name: string) {
    if (!confirm(`${t('tasks.run')} "${name}"?`)) return;
    try {
      await api.scheduler.trigger(id);
      setTimeout(loadTasks, 1000);
    } catch (err) {
      console.error('Failed to run task:', err);
    }
  }

  async function toggleTask(id: string) {
    try {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      await api.tasks.update(id, { isActive: !task.isActive });
      await loadTasks();
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  }

  async function deleteTask(id: string, name: string) {
    if (!confirm(`${t('tasks.confirmDelete')} "${name}" ${t('tasks.confirmDeleteMsg')}`)) return;
    try {
      await api.tasks.delete(id);
      await loadTasks();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-card animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2 w-1/3" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="heading-text text-xl mb-2">{t('tasks.empty')}</h3>
        <p className="sub-text mb-6">{t('tasks.emptyHint')}</p>
        <Link href="/tasks/create" className="btn-primary inline-block">
          {t('tasks.createNew')}
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-card-static overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3 text-left text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">{t('tasks.name')}</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider hidden md:table-cell">{t('tasks.schedule')}</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider hidden lg:table-cell">{t('tasks.method')}</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">{t('tasks.status')}</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider hidden xl:table-cell">{t('tasks.nextRun')}</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">{t('tasks.actions')}</th>
                </tr>
              </thead>
          <tbody className="divide-y divide-amber-100/50 dark:divide-stone-800">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-amber-50/50 dark:hover:bg-stone-800/50 transition-colors duration-200">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-stone-200">{task.name}</p>
                        <p className="text-sm text-gray-500 dark:text-stone-400 truncate max-w-xs md:max-w-md">{task.targetUrl}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <div>
                        <code className="text-xs bg-amber-100/60 dark:bg-stone-800 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-lg font-mono block mb-1">
                          {task.cronExpression}
                        </code>
                        <span className="text-xs text-amber-600 dark:text-amber-400">
                          {humanizeCron(task.cronExpression)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                        task.httpMethod === 'GET'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : task.httpMethod === 'POST'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      }`}>
                        {task.httpMethod}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => toggleTask(task.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
                          task.isActive
                            ? 'bg-amber-500'
                            : 'bg-gray-300 dark:bg-stone-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300 ${
                            task.isActive ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-4 hidden xl:table-cell">
                      <div className="text-xs">
                        <p className="text-amber-600 dark:text-amber-400 font-medium">
                          {countdowns[task.id] || getNextRunCountdown(task.nextRunAt)}
                        </p>
                        {task.nextRunAt && (
                          <p className="text-gray-500 dark:text-stone-500 mt-0.5">
                            {new Date(task.nextRunAt).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => runNow(task.id, task.name)}
                          className="btn-green text-xs px-3 py-1.5"
                        >
                          ▶ {t('tasks.run')}
                        </button>
                        <button
                          onClick={() => router.push(`/tasks/${task.id}`)}
                          className="btn-glass text-xs px-3 py-1.5"
                        >
                          ✏️ {t('tasks.edit')}
                        </button>
                        <button
                          onClick={() => deleteTask(task.id, task.name)}
                          className="btn-red text-xs px-3 py-1.5"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

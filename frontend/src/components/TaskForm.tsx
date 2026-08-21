'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n-context';
import CronBuilder from './CronBuilder';

interface TaskFormProps {
  taskId?: string;
  initialData?: {
    name: string;
    description: string;
    cronExpression: string;
    targetUrl: string;
    httpMethod: string;
    timeoutSeconds: number;
    maxRetries: number;
    webhookUrl: string;
    webhookType: string;
    headers: string;
    payload: string;
    isActive: boolean;
  };
}

export default function TaskForm({ taskId, initialData }: TaskFormProps) {
  const router = useRouter();
  const { t } = useI18n();
  const isEditing = !!taskId;

  const [form, setForm] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    cronExpression: initialData?.cronExpression || '',
    targetUrl: initialData?.targetUrl || '',
    httpMethod: initialData?.httpMethod || 'POST',
    timeoutSeconds: initialData?.timeoutSeconds || 30,
    maxRetries: initialData?.maxRetries ?? 3,
    webhookUrl: initialData?.webhookUrl || '',
    webhookType: initialData?.webhookType || 'discord',
    lineAccessToken: '',
    lineUserId: '',
    headers: initialData?.headers || '',
    payload: initialData?.payload || '',
    isActive: initialData?.isActive ?? true,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (taskId) {
      api.tasks.get(taskId).then((data) => {
        const webhookType = data.webhookType || 'discord';
        const webhookUrl = data.webhookUrl || '';
        let lineAccessToken = '';
        let lineUserId = '';

        if (webhookType === 'line-messaging' && webhookUrl.includes(':')) {
          const sep = webhookUrl.indexOf(':');
          lineAccessToken = webhookUrl.substring(0, sep);
          lineUserId = webhookUrl.substring(sep + 1);
        }

        setForm({
          name: data.name || '',
          description: data.description || '',
          cronExpression: data.cronExpression || '',
          targetUrl: data.targetUrl || '',
          httpMethod: data.httpMethod || 'POST',
          timeoutSeconds: data.timeoutSeconds || 30,
          maxRetries: data.maxRetries ?? 3,
          webhookUrl,
          webhookType,
          lineAccessToken,
          lineUserId,
          headers: typeof data.headers === 'object' && data.headers !== null
            ? JSON.stringify(data.headers, null, 2)
            : data.headers || '',
          payload: typeof data.payload === 'object' && data.payload !== null
            ? JSON.stringify(data.payload, null, 2)
            : data.payload || '',
          isActive: data.isActive ?? true,
        });
      });
    }
  }, [taskId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const submitData = { ...form };

      if (form.webhookType === 'line-messaging') {
        submitData.webhookUrl = `${form.lineAccessToken}:${form.lineUserId}`;
      }

      if (isEditing) {
        await api.tasks.update(taskId!, submitData);
      } else {
        await api.tasks.create(submitData);
      }
      router.push('/tasks');
    } catch (err) {
      console.error('Failed to save task:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="glass-card-static">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="heading-text text-2xl">{isEditing ? t('taskForm.editTitle') : t('taskForm.createTitle')}</h1>
            <p className="sub-text text-sm">{isEditing ? t('taskForm.editSubtitle') : t('taskForm.createSubtitle')}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="input-label">{t('taskForm.name')}</label>
            <input
              type="text"
              className="input-field"
              placeholder={t('taskForm.namePlaceholder')}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="input-label">{t('taskForm.description')}</label>
            <textarea
              className="textarea-field"
              rows={2}
              placeholder={t('taskForm.descPlaceholder')}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <CronBuilder
            value={form.cronExpression}
            onChange={(cron) => setForm({ ...form, cronExpression: cron })}
          />

          <div>
            <label className="input-label">{t('taskForm.targetUrl')}</label>
            <input
              type="text"
              className="input-field"
              placeholder={t('taskForm.targetUrlPlaceholder')}
              value={form.targetUrl}
              onChange={(e) => setForm({ ...form, targetUrl: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="input-label">{t('taskForm.httpMethod')}</label>
              <select
                className="select-field"
                value={form.httpMethod}
                onChange={(e) => setForm({ ...form, httpMethod: e.target.value })}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div>
              <label className="input-label">{t('taskForm.timeout')}</label>
              <input
                type="number"
                className="input-field"
                min={5}
                max={300}
                value={form.timeoutSeconds}
                onChange={(e) => setForm({ ...form, timeoutSeconds: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="input-label">{t('taskForm.maxRetries')}</label>
              <input
                type="number"
                className="input-field"
                min={0}
                max={10}
                value={form.maxRetries}
                onChange={(e) => setForm({ ...form, maxRetries: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className="input-label">{t('taskForm.headers')}</label>
            <textarea
              className="textarea-field font-mono"
              rows={3}
              placeholder='{"Authorization": "Bearer xxx"}'
              value={form.headers}
              onChange={(e) => setForm({ ...form, headers: e.target.value })}
            />
          </div>

          <div>
            <label className="input-label">{t('taskForm.payload')}</label>
            <textarea
              className="textarea-field font-mono"
              rows={3}
              placeholder='{"key": "value"}'
              value={form.payload}
              onChange={(e) => setForm({ ...form, payload: e.target.value })}
            />
          </div>

          <div className="border-t border-amber-200/40 dark:border-amber-800/20 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-stone-300 mb-3">{t('taskForm.webhookConfig')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="input-label">{t('taskForm.webhookType')}</label>
                <select
                  className="select-field"
                  value={form.webhookType}
                  onChange={(e) => setForm({ ...form, webhookType: e.target.value })}
                >
                  <option value="discord">Discord</option>
                  <option value="slack">Slack</option>
                  <option value="line-messaging">LINE Messaging API</option>
                </select>
              </div>
              {form.webhookType === 'line-messaging' ? (
                <>
                  <div>
                    <label className="input-label">{t('taskForm.lineAccessToken')}</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Channel Access Token"
                      value={form.lineAccessToken}
                      onChange={(e) => setForm({ ...form, lineAccessToken: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="input-label">{t('taskForm.lineUserId')}</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={form.lineUserId}
                      onChange={(e) => setForm({ ...form, lineUserId: e.target.value })}
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="input-label">{t('taskForm.webhookUrl')}</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder={
                      form.webhookType === 'slack'
                        ? 'https://hooks.slack.com/services/...'
                        : 'https://discord.com/api/webhooks/...'
                    }
                    value={form.webhookUrl}
                    onChange={(e) => setForm({ ...form, webhookUrl: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              <div className="w-11 h-6 bg-gray-300 dark:bg-stone-600 peer-focus:ring-2 peer-focus:ring-amber-500/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
            </label>
            <span className="text-sm font-medium text-gray-700 dark:text-stone-300">{t('taskForm.active')}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? t('taskForm.saving') : isEditing ? t('taskForm.update') : t('taskForm.save')}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-glass">
          {t('taskForm.cancel')}
        </button>
      </div>
    </form>
  );
}

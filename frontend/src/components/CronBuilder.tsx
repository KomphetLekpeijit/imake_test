'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { CronConfig, parseCronToConfig, generateCron, humanizeCron } from '@/lib/cron-utils';
import { useI18n } from '@/lib/i18n-context';

interface CronBuilderProps {
  value: string;
  onChange: (cron: string) => void;
}

const MODES = [
  { value: 'every-minute', label: 'cronBuilder.everyMinute' },
  { value: 'every-hour', label: 'cronBuilder.everyHour' },
  { value: 'every-day', label: 'cronBuilder.everyDay' },
  { value: 'every-weekday', label: 'cronBuilder.everyWeekday' },
  { value: 'every-month', label: 'cronBuilder.everyMonth' },
  { value: 'custom', label: 'cronBuilder.custom' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const DAYS_OF_MONTH = Array.from({ length: 31 }, (_, i) => i + 1);
const PRESETS = [
  { label: 'taskForm.everyMin', value: '* * * * *' },
  { label: 'taskForm.every5Min', value: '*/5 * * * *' },
  { label: 'taskForm.everyHour', value: '0 * * * *' },
  { label: 'taskForm.weekdays9am', value: '0 9 * * 1-5' },
  { label: 'taskForm.firstDayMonth', value: '0 0 1 * *' },
  { label: 'cronBuilder.everyDay9am', value: '0 9 * * *' },
];

export default function CronBuilder({ value, onChange }: CronBuilderProps) {
  const { t } = useI18n();

  const [activeMode, setActiveMode] = useState<CronConfig['mode']>(() => parseCronToConfig(value).mode);

  const config = useMemo(() => {
    const parsed = parseCronToConfig(value);
    return { ...parsed, mode: activeMode };
  }, [value, activeMode]);

  const updateConfig = useCallback((partial: Partial<CronConfig>) => {
    const newConfig = { ...config, ...partial };
    if (partial.mode) setActiveMode(partial.mode);
    onChange(generateCron(newConfig));
  }, [config, onChange]);

  const cronExpression = generateCron(config);
  const description = humanizeCron(cronExpression);

  const handleCustomFieldChange = useCallback((fieldIndex: number, raw: string) => {
    const parts = generateCron(config).split(' ');
    parts[fieldIndex] = raw || '*';
    onChange(parts.join(' '));
  }, [config, onChange]);

  return (
    <div className="space-y-3">
      <label className="input-label">{t('taskForm.cron')}</label>

      <input
        type="text"
        className="input-field font-mono text-sm"
        value={cronExpression}
        readOnly
      />

      <div className="bg-amber-50/80 dark:bg-stone-800/80 border border-amber-200/60 dark:border-amber-800/30 rounded-xl px-4 py-2.5">
        <p className="text-sm text-amber-700 dark:text-amber-300 font-medium flex items-center gap-2">
          <span className="text-base">📝</span>
          {description}
        </p>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 dark:text-stone-400 mb-2 block">{t('cronBuilder.selectMode')}</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {MODES.map((mode) => (
            <button
              key={mode.value}
              type="button"
              onClick={() => {
                const modeConfig = { ...config, mode: mode.value as CronConfig['mode'] };
                setActiveMode(mode.value as CronConfig['mode']);
                onChange(generateCron(modeConfig));
              }}
              className={`text-xs px-3 py-2 rounded-xl border transition-all duration-200 font-medium ${
                config.mode === mode.value
                  ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20'
                  : 'bg-white dark:bg-stone-800 text-gray-600 dark:text-stone-300 border-amber-200/50 dark:border-amber-800/30 hover:bg-amber-50 dark:hover:bg-stone-700'
              }`}
            >
              {t(mode.label)}
            </button>
          ))}
        </div>
      </div>

      {config.mode === 'every-minute' && (
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-stone-400 mb-1 block">{t('cronBuilder.interval')}</label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-stone-300">{t('cronBuilder.every')}</span>
            <input
              type="number"
              className="input-field w-20 text-center"
              min={1}
              max={59}
              value={config.interval}
              onChange={(e) => updateConfig({ interval: Math.max(1, Math.min(59, Number(e.target.value))) })}
            />
            <span className="text-sm text-gray-600 dark:text-stone-300">{t('cronBuilder.minutes')}</span>
          </div>
        </div>
      )}

      {config.mode === 'every-hour' && (
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-stone-400 mb-1 block">{t('cronBuilder.everyNHour')}</label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-stone-300">{t('cronBuilder.every')}</span>
            <input
              type="number"
              className="input-field w-20 text-center"
              min={1}
              max={23}
              value={config.interval}
              onChange={(e) => updateConfig({ interval: Math.max(1, Math.min(23, Number(e.target.value))) })}
            />
            <span className="text-sm text-gray-600 dark:text-stone-300">{t('cronBuilder.hours')}</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-gray-600 dark:text-stone-300">{t('cronBuilder.atMinute')}</span>
            <select
              className="select-field w-24"
              value={config.minute}
              onChange={(e) => updateConfig({ minute: Number(e.target.value) })}
            >
              {MINUTES.filter((m) => m % 5 === 0).map((m) => (
                <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
              ))}
            </select>
            <span className="text-sm text-gray-600 dark:text-stone-300">{t('cronBuilder.minute')}</span>
          </div>
        </div>
      )}

      {config.mode === 'every-day' && (
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-stone-400 mb-1 block">{t('cronBuilder.time')}</label>
          <div className="flex items-center gap-2">
            <select
              className="select-field w-24"
              value={config.hour}
              onChange={(e) => updateConfig({ hour: Number(e.target.value) })}
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>{h.toString().padStart(2, '0')}</option>
              ))}
            </select>
            <span className="text-lg font-bold text-gray-400">:</span>
            <select
              className="select-field w-24"
              value={config.minute}
              onChange={(e) => updateConfig({ minute: Number(e.target.value) })}
            >
              {MINUTES.filter((m) => m % 5 === 0).map((m) => (
                <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
              ))}
            </select>
            <span className="text-sm text-gray-600 dark:text-stone-300">น.</span>
          </div>
        </div>
      )}

      {config.mode === 'every-weekday' && (
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-stone-400 mb-1 block">{t('cronBuilder.time')}</label>
          <div className="flex items-center gap-2">
            <select
              className="select-field w-24"
              value={config.hour}
              onChange={(e) => updateConfig({ hour: Number(e.target.value) })}
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>{h.toString().padStart(2, '0')}</option>
              ))}
            </select>
            <span className="text-lg font-bold text-gray-400">:</span>
            <select
              className="select-field w-24"
              value={config.minute}
              onChange={(e) => updateConfig({ minute: Number(e.target.value) })}
            >
              {MINUTES.filter((m) => m % 5 === 0).map((m) => (
                <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
              ))}
            </select>
            <span className="text-sm text-gray-600 dark:text-stone-300">น.</span>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{t('cronBuilder.weekdayNote')}</p>
        </div>
      )}

      {config.mode === 'every-month' && (
        <div>
          <div className="flex items-center gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-stone-400 mb-1 block">{t('cronBuilder.dayOfMonth')}</label>
              <select
                className="select-field w-24"
                value={config.dayOfMonth}
                onChange={(e) => updateConfig({ dayOfMonth: Number(e.target.value) })}
              >
                {DAYS_OF_MONTH.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-stone-400 mb-1 block">{t('cronBuilder.time')}</label>
              <div className="flex items-center gap-2">
                <select
                  className="select-field w-24"
                  value={config.hour}
                  onChange={(e) => updateConfig({ hour: Number(e.target.value) })}
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>{h.toString().padStart(2, '0')}</option>
                  ))}
                </select>
                <span className="text-lg font-bold text-gray-400">:</span>
                <select
                  className="select-field w-24"
                  value={config.minute}
                  onChange={(e) => updateConfig({ minute: Number(e.target.value) })}
                >
                  {MINUTES.filter((m) => m % 5 === 0).map((m) => (
                    <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                  ))}
                </select>
                <span className="text-sm text-gray-600 dark:text-stone-300">น.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {config.mode === 'custom' && (
        <div className="grid grid-cols-5 gap-2">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-stone-400 mb-1 block">{t('cronBuilder.minuteLabel')}</label>
            <input
              type="text"
              className="input-field text-center font-mono text-sm"
              placeholder="*"
              value={cronExpression.split(' ')[0]}
              onChange={(e) => handleCustomFieldChange(0, e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-stone-400 mb-1 block">{t('cronBuilder.hourLabel')}</label>
            <input
              type="text"
              className="input-field text-center font-mono text-sm"
              placeholder="*"
              value={cronExpression.split(' ')[1]}
              onChange={(e) => handleCustomFieldChange(1, e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-stone-400 mb-1 block">{t('cronBuilder.dayLabel')}</label>
            <input
              type="text"
              className="input-field text-center font-mono text-sm"
              placeholder="*"
              value={cronExpression.split(' ')[2]}
              onChange={(e) => handleCustomFieldChange(2, e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-stone-400 mb-1 block">{t('cronBuilder.monthLabel')}</label>
            <input
              type="text"
              className="input-field text-center font-mono text-sm"
              placeholder="*"
              value={cronExpression.split(' ')[3]}
              onChange={(e) => handleCustomFieldChange(3, e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-stone-400 mb-1 block">{t('cronBuilder.dowLabel')}</label>
            <input
              type="text"
              className="input-field text-center font-mono text-sm"
              placeholder="*"
              value={cronExpression.split(' ')[4]}
              onChange={(e) => handleCustomFieldChange(4, e.target.value)}
            />
          </div>
        </div>
      )}

      <div>
        <label className="text-xs font-medium text-gray-500 dark:text-stone-400 mb-2 block">{t('cronBuilder.quickPresets')}</label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => {
                const parsed = parseCronToConfig(preset.value);
                setActiveMode(parsed.mode);
                onChange(preset.value);
              }}
              className={`text-xs px-3 py-1.5 rounded-xl border transition-all duration-200 ${
                cronExpression === preset.value
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-amber-50 dark:bg-stone-800 text-gray-600 dark:text-stone-300 border-amber-200/50 dark:border-amber-800/30 hover:bg-amber-100 dark:hover:bg-stone-700'
              }`}
            >
              {t(preset.label)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

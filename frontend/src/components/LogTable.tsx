'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n-context';

interface LogEntry {
  id: string;
  task: { id: string; name: string };
  triggerType: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number;
  httpStatusCode: number | null;
  requestPayload: any;
  responseBody: any;
}

function safeStringify(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function LogTable() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 10000);

    let eventSource: EventSource | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;
    let retryDelay = 1000;
    let stopped = false;

    function connectSSE() {
      if (stopped) return;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      eventSource = new EventSource(`${apiUrl}/api/sse/events`);
      eventSource.onmessage = () => {
        retryDelay = 1000;
        loadLogs();
      };
      eventSource.onerror = () => {
        eventSource?.close();
        if (!stopped) {
          retryTimeout = setTimeout(() => {
            retryDelay = Math.min(retryDelay * 2, 30000);
            connectSSE();
          }, retryDelay);
        }
      };
    }

    connectSSE();

    return () => {
      stopped = true;
      clearInterval(interval);
      if (retryTimeout) clearTimeout(retryTimeout);
      eventSource?.close();
    };
  }, []);

  async function loadLogs() {
    try {
      const data = await api.logs.list();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = filterStatus === 'all'
    ? logs
    : logs.filter((l) => l.status === filterStatus);

  function getStatusColor(status: string) {
    switch (status) {
      case 'success': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'failed': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'timeout': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'running': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'skipped': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'success': return '✅';
      case 'failed': return '❌';
      case 'timeout': return '⏰';
      case 'running': return '🔄';
      case 'skipped': return '⏭️';
      default: return '❓';
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'success': return t('logs.success');
      case 'failed': return t('logs.failed');
      case 'timeout': return t('logs.timeoutStatus');
      case 'running': return t('logs.runningStatus');
      case 'skipped': return t('logs.skippedStatus');
      default: return status;
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

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'success', 'failed', 'timeout', 'running', 'skipped'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all ${
                filterStatus === status
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 dark:bg-stone-800 text-gray-600 dark:text-stone-300 hover:bg-amber-100 dark:hover:bg-stone-700'
              }`}
            >
              {status === 'all' ? t('logs.allStatuses') : `${getStatusIcon(status)} ${getStatusLabel(status)}`}
            </button>
          ))}
        </div>
        <button onClick={loadLogs} className="btn-glass text-sm">
          🔄 {t('logs.refresh')}
        </button>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="heading-text text-xl mb-2">{t('logs.empty')}</h3>
          <p className="sub-text">{t('logs.emptyHint')}</p>
        </div>
      ) : (
        <div className="glass-card-static overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3 text-left text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">{t('logs.task')}</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">{t('logs.trigger')}</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider hidden md:table-cell">{t('logs.startedAt')}</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider hidden md:table-cell">{t('logs.finishedAt')}</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">{t('logs.duration')}</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">{t('logs.http')}</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">{t('logs.status')}</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">{t('logs.details')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100/50 dark:divide-stone-800">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-amber-50/50 dark:hover:bg-stone-800/50 transition-colors duration-200">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-800 dark:text-stone-200">{log.task?.name || log.id}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                        log.triggerType === 'scheduled'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      }`}>
                        {log.triggerType === 'scheduled' ? `🤖 ${t('logs.scheduled')}` : `👤 ${t('logs.manual')}`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-stone-400 hidden md:table-cell">
                      {new Date(log.startedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-stone-400 hidden md:table-cell">
                      {log.finishedAt ? new Date(log.finishedAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-stone-300">
                      {log.durationMs ? `${log.durationMs}ms` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {log.httpStatusCode ? (
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                          log.httpStatusCode >= 200 && log.httpStatusCode < 300
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : log.httpStatusCode >= 400
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {log.httpStatusCode}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${getStatusColor(log.status)}`}>
                        <span>{getStatusIcon(log.status)}</span>
                        <span>{getStatusLabel(log.status)}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="btn-glass text-xs px-3 py-1.5"
                      >
                        👁️ {t('logs.viewDetails')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedLog(null)}>
          <div className="glass-card-static max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="heading-text text-lg">{t('logs.detailTitle')}</h3>
              <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-semibold text-gray-600 dark:text-stone-400">{t('logs.task')}:</span>
                <span className="ml-2 text-gray-800 dark:text-stone-200">{selectedLog.task?.name || selectedLog.id}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-600 dark:text-stone-400">{t('logs.triggerType')}:</span>
                <span className="ml-2 text-gray-800 dark:text-stone-200">
                  {selectedLog.triggerType === 'scheduled' ? `🤖 ${t('logs.scheduled')}` : `👤 ${t('logs.manual')}`}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-600 dark:text-stone-400">{t('logs.startedAt')}:</span>
                <span className="ml-2 text-gray-800 dark:text-stone-200">{new Date(selectedLog.startedAt).toLocaleString()}</span>
              </div>
              {selectedLog.finishedAt && (
                <div>
                  <span className="font-semibold text-gray-600 dark:text-stone-400">{t('logs.finishedAt')}:</span>
                  <span className="ml-2 text-gray-800 dark:text-stone-200">{new Date(selectedLog.finishedAt).toLocaleString()}</span>
                </div>
              )}
              <div>
                <span className="font-semibold text-gray-600 dark:text-stone-400">{t('logs.duration')}:</span>
                <span className="ml-2 text-gray-800 dark:text-stone-200">{selectedLog.durationMs ? `${selectedLog.durationMs}ms` : '-'}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-600 dark:text-stone-400">{t('logs.status')}:</span>
                <span className={`ml-2 inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded ${getStatusColor(selectedLog.status)}`}>
                  <span>{getStatusIcon(selectedLog.status)}</span>
                  <span>{getStatusLabel(selectedLog.status)}</span>
                </span>
              </div>
              {selectedLog.httpStatusCode && (
                <div>
                  <span className="font-semibold text-gray-600 dark:text-stone-400">{t('logs.http')}:</span>
                  <span className="ml-2 text-gray-800 dark:text-stone-200">{selectedLog.httpStatusCode}</span>
                </div>
              )}
              {selectedLog.requestPayload && (
                <div>
                  <span className="font-semibold text-gray-600 dark:text-stone-400">{t('logs.requestPayload')}:</span>
                  <pre className="mt-1 text-xs bg-amber-50 dark:bg-stone-800 p-3 rounded-xl overflow-x-auto text-gray-700 dark:text-stone-300">
                    {safeStringify(selectedLog.requestPayload)}
                  </pre>
                </div>
              )}
              {selectedLog.responseBody && (
                <div>
                  <span className="font-semibold text-gray-600 dark:text-stone-400">{t('logs.response')}:</span>
                  <pre className="mt-1 text-xs bg-amber-50 dark:bg-stone-800 p-3 rounded-xl overflow-x-auto text-gray-700 dark:text-stone-300">
                    {safeStringify(selectedLog.responseBody)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

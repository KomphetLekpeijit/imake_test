import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface NotificationPayload {
  taskName: string;
  taskDescription?: string;
  taskId: string;
  status: string;
  errorMessage?: string;
  responseBody?: string;
  httpStatusCode?: number;
  durationMs?: number;
  timestamp: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly httpService: HttpService) {}

  async sendWebhook(
    webhookUrl: string,
    webhookType: string,
    payload: NotificationPayload,
  ): Promise<boolean> {
    try {
      if (webhookType === 'line-messaging') {
        const sep = webhookUrl.indexOf(':');
        const accessToken = webhookUrl.substring(0, sep);
        const userId = webhookUrl.substring(sep + 1);
        const message = this.buildLineMessage(payload);

        await firstValueFrom(
          this.httpService.post(
            'https://api.line.me/v2/bot/message/push',
            {
              to: userId,
              messages: [{ type: 'text', text: message }],
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
              },
              timeout: 10000,
            },
          ),
        );

        this.logger.log(`Webhook sent successfully to line-messaging`);
        return true;
      }

      const body = this.formatPayload(webhookType, payload);

      await firstValueFrom(
        this.httpService.post(webhookUrl, body, {
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          timeout: 10000,
        }),
      );

      this.logger.log(`Webhook sent successfully to ${webhookType}: ${webhookUrl}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to send webhook to ${webhookType}: ${error.message}`);
      return false;
    }
  }

  private buildLineMessage(payload: NotificationPayload): string {
    let statusEmoji: string;
    let statusText: string;

    if (payload.status === 'success') {
      statusEmoji = '✅';
      statusText = 'SUCCESS';
    } else if (payload.status === 'timeout') {
      statusEmoji = '⏰';
      statusText = 'TIMEOUT';
    } else {
      statusEmoji = '❌';
      statusText = 'FAILED';
    }

    const time = new Date(payload.timestamp).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });

    let detail = '';
    if (payload.status === 'success') {
      try {
        const parsed = JSON.parse(payload.responseBody || '{}');
        detail = parsed.message || parsed.status || 'OK';
      } catch {
        detail = payload.responseBody || 'OK';
      }
    } else {
      detail = payload.errorMessage || payload.responseBody || 'Unknown error';
    }

    return [
      `${statusEmoji} ${statusText}: ${payload.taskName}`,
      '',
      `📋 ${payload.taskDescription || '-'}`,
      `⏰ ${time}`,
      `🔢 HTTP ${payload.httpStatusCode || 'N/A'}`,
      `⏱ ${payload.durationMs ?? '-'}ms`,
      `💬 ${detail}`,
    ].join('\n');
  }

  private formatPayload(webhookType: string, payload: NotificationPayload) {
    let statusEmoji: string;
    let statusText: string;
    let color: number;

    if (payload.status === 'success') {
      statusEmoji = '✅';
      statusText = 'SUCCESS';
      color = 65280;
    } else if (payload.status === 'timeout') {
      statusEmoji = '⏰';
      statusText = 'TIMEOUT';
      color = 16776960;
    } else {
      statusEmoji = '❌';
      statusText = 'FAILED';
      color = 16711680;
    }

    const time = new Date(payload.timestamp).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
    const descLine = payload.taskDescription ? `\n**Detail:** ${payload.taskDescription}` : '';
    const durationLine = payload.durationMs != null ? `\n**Duration:** ${payload.durationMs}ms` : '';
    const httpLine = `\n**HTTP Status:** ${payload.httpStatusCode || 'N/A'}`;

    switch (webhookType) {
      case 'discord': {
        const fields: any[] = [
          { name: 'Task ID', value: `\`${payload.taskId}\``, inline: true },
          { name: 'HTTP Status', value: String(payload.httpStatusCode || 'N/A'), inline: true },
        ];

        if (payload.status === 'success') {
          let responseText = '';
          try {
            const parsed = JSON.parse(payload.responseBody || '{}');
            responseText = parsed.message || parsed.status || payload.responseBody || 'OK';
          } catch {
            responseText = payload.responseBody || 'OK';
          }
          fields.push({ name: 'Response', value: responseText.substring(0, 1000) });
        } else {
          const errorMsg = payload.errorMessage || payload.responseBody || 'Unknown error';
          fields.push({ name: 'Error', value: errorMsg.substring(0, 1000) });
        }

        return {
          embeds: [
            {
              title: `${statusEmoji} Task ${statusText}`,
              description: `**Task:** ${payload.taskName}${descLine}\n**Status:** ${statusText}\n**Time:** ${time}${durationLine}${httpLine}`,
              color,
              fields,
            },
          ],
        };
      }

      case 'slack': {
        const slackFields: any[] = [
          { title: 'Task ID', value: payload.taskId, short: true },
          { title: 'HTTP Status', value: String(payload.httpStatusCode || 'N/A'), short: true },
        ];

        if (payload.status === 'success') {
          let responseText = '';
          try {
            const parsed = JSON.parse(payload.responseBody || '{}');
            responseText = parsed.message || parsed.status || payload.responseBody || 'OK';
          } catch {
            responseText = payload.responseBody || 'OK';
          }
          slackFields.push({ title: 'Response', value: responseText.substring(0, 1000), short: false });
        } else {
          slackFields.push({ title: 'Error', value: (payload.errorMessage || payload.responseBody || 'Unknown error').substring(0, 1000), short: false });
        }

        return {
          attachments: [
            {
              color: payload.status === 'success' ? '#00ff00' : payload.status === 'failed' ? '#ff0000' : '#ffcc00',
              title: `${statusEmoji} Task ${statusText}`,
              text: `*Task:* ${payload.taskName}${descLine}\n*Status:* ${statusText}\n*Time:* ${time}${durationLine}${httpLine}`,
              fields: slackFields,
            },
          ],
        };
      }

      case 'line': {
        let detail = '';
        if (payload.status === 'success') {
          try {
            const parsed = JSON.parse(payload.responseBody || '{}');
            detail = parsed.message || parsed.status || 'OK';
          } catch {
            detail = payload.responseBody || 'OK';
          }
        } else {
          detail = payload.errorMessage || payload.responseBody || 'Unknown error';
        }
        return {
          message: `${statusEmoji} ${statusText}: ${payload.taskName}\n\n📋 ${payload.taskDescription || '-'}\n⏰ ${time}\n🔢 HTTP ${payload.httpStatusCode || 'N/A'}\n⏱ ${payload.durationMs ?? '-'}ms\n💬 ${detail}`,
        };
      }

      default:
        return {
          text: `${statusEmoji} Task ${statusText}: ${payload.taskName} at ${time}`,
          taskName: payload.taskName,
          status: payload.status,
          timestamp: payload.timestamp,
        };
    }
  }
}

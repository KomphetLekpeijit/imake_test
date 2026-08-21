import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class HttpClientService {
  private readonly logger = new Logger(HttpClientService.name);

  constructor(private readonly httpService: HttpService) {}

  async dispatch(config: {
    url: string;
    method: string;
    headers?: Record<string, string>;
    payload?: any;
    timeout: number;
  }): Promise<{ statusCode: number; body: string; durationMs: number; isTimeout: boolean }> {
    const startTime = Date.now();

    try {
      const response = await firstValueFrom(
        this.httpService.request({
          url: config.url,
          method: config.method.toUpperCase() as any,
          headers: {
            'Content-Type': 'application/json',
            ...config.headers,
          },
          data: config.payload,
          timeout: config.timeout * 1000,
        }),
      );

      const durationMs = Date.now() - startTime;
      return {
        statusCode: response.status,
        body: typeof response.data === 'string'
          ? response.data
          : JSON.stringify(response.data),
        durationMs,
        isTimeout: false,
      };
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      const statusCode = error.response?.status || 0;
      const body = error.message || 'Unknown error';

      const isTimeout =
        error.code === 'ECONNABORTED' ||
        body.toLowerCase().includes('timeout') ||
        body.toLowerCase().includes('exceeded');

      if (isTimeout) {
        this.logger.warn(`Dispatch timeout after ${durationMs}ms: ${config.url}`);
      } else {
        this.logger.error(`Dispatch failed: ${body}`);
      }

      return { statusCode, body, durationMs, isTimeout };
    }
  }
}

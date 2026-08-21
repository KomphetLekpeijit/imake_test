import { Injectable, Logger } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

export interface SseEvent {
  type: 'task_started' | 'task_completed' | 'task_failed' | 'task_timeout' | 'task_skipped';
  data: {
    taskId: string;
    taskName: string;
    logId: string;
    status?: string;
    durationMs?: number;
    httpStatusCode?: number;
    triggerType?: string;
    timestamp: string;
  };
}

@Injectable()
export class SseService {
  private readonly logger = new Logger(SseService.name);
  private eventSubject = new Subject<SseEvent>();

  emit(event: SseEvent) {
    this.logger.log(`SSE event: ${event.type} - ${event.data.taskName}`);
    this.eventSubject.next(event);
  }

  getEventStream(): Observable<SseEvent> {
    return this.eventSubject.asObservable();
  }
}

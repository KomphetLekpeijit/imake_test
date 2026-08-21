import { Controller, Sse, MessageEvent } from '@nestjs/common';
import { SseService } from './sse.service';
import { map } from 'rxjs/operators';

@Controller('api/sse')
export class SseController {
  constructor(private readonly sseService: SseService) {}

  @Sse('events')
  getEvents() {
    return this.sseService.getEventStream().pipe(
      map((event) => ({
        data: event,
      } as MessageEvent)),
    );
  }
}

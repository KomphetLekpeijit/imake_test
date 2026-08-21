import { IsString, IsOptional, IsBoolean, IsInt, Min, Max } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  cronExpression: string;

  @IsString()
  targetUrl: string;

  @IsOptional()
  @IsString()
  httpMethod?: string;

  @IsOptional()
  headers?: Record<string, string>;

  @IsOptional()
  payload?: Record<string, any>;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(300)
  timeoutSeconds?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  maxRetries?: number;

  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @IsOptional()
  @IsString()
  webhookType?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

import { IsString, IsOptional, IsBoolean, IsInt, Min, Max } from 'class-validator';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  cronExpression?: string;

  @IsOptional()
  @IsString()
  targetUrl?: string;

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
  @IsBoolean()
  isActive?: boolean;
}

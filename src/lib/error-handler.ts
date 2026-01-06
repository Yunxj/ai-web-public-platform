/**
 * 统一错误处理工具
 */

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = '资源未找到') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = '未授权') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = '请求过于频繁，请稍后再试') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

/**
 * 处理错误并返回标准化的错误响应
 */
export function handleError(error: unknown): {
  message: string;
  statusCode: number;
  code?: string;
  details?: unknown;
} {
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message || '服务器内部错误',
      statusCode: 500,
      code: 'INTERNAL_ERROR',
    };
  }

  return {
    message: '未知错误',
    statusCode: 500,
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * 错误日志记录
 */
export function logError(error: unknown, context?: Record<string, unknown>): void {
  const errorInfo = handleError(error);
  console.error('错误详情:', {
    ...errorInfo,
    context,
    timestamp: new Date().toISOString(),
  });
}

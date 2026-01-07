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

/**
 * 判断是否为账户相关错误（如欠费、账户状态异常等）
 * 这类错误不应该重试，应该直接提示用户
 */
export function isAccountError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const errorMessage = error.message.toLowerCase();
  const accountErrorKeywords = [
    'access denied',
    'account',
    'account is in good standing',
    'overdue payment',
    '欠费',
    '账户',
    '账户状态',
    '账户异常',
    '余额不足',
    'insufficient',
    'payment',
    'billing',
  ];

  return accountErrorKeywords.some(keyword => errorMessage.includes(keyword));
}

/**
 * 判断是否为可重试的错误
 * 账户错误、认证错误等不应该重试
 */
export function isRetryableError(error: unknown): boolean {
  if (isAccountError(error)) {
    return false;
  }

  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    // 认证错误不应该重试
    if (errorMessage.includes('unauthorized') || errorMessage.includes('forbidden')) {
      return false;
    }
  }

  return true;
}

/**
 * 获取友好的错误提示信息
 */
export function getFriendlyErrorMessage(error: unknown): string {
  if (isAccountError(error)) {
    return 'AI服务账户异常，请检查账户状态或联系管理员。错误详情：账户可能欠费或状态异常，请访问阿里云控制台检查账户状态。';
  }

  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('timeout') || errorMessage.includes('超时')) {
      return '请求超时，请稍后重试。';
    }
    
    if (errorMessage.includes('network') || errorMessage.includes('网络')) {
      return '网络连接失败，请检查网络后重试。';
    }
    
    if (errorMessage.includes('rate limit') || errorMessage.includes('限流')) {
      return '请求过于频繁，请稍后再试。';
    }
  }

  return error instanceof Error ? error.message : '未知错误，请稍后重试。';
}
import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  NotFoundError,
  handleError,
} from '@/lib/error-handler';

describe('错误处理', () => {
  it('应该正确创建AppError', () => {
    const error = new AppError('测试错误', 400, 'TEST_ERROR');
    expect(error.message).toBe('测试错误');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('TEST_ERROR');
  });

  it('应该正确创建ValidationError', () => {
    const error = new ValidationError('验证失败');
    expect(error.message).toBe('验证失败');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  it('应该正确创建NotFoundError', () => {
    const error = new NotFoundError();
    expect(error.message).toBe('资源未找到');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
  });

  it('应该正确处理AppError', () => {
    const error = new AppError('自定义错误', 500);
    const result = handleError(error);
    expect(result.message).toBe('自定义错误');
    expect(result.statusCode).toBe(500);
  });

  it('应该正确处理普通Error', () => {
    const error = new Error('普通错误');
    const result = handleError(error);
    expect(result.message).toBe('普通错误');
    expect(result.statusCode).toBe(500);
    expect(result.code).toBe('INTERNAL_ERROR');
  });

  it('应该正确处理未知错误', () => {
    const result = handleError('字符串错误');
    expect(result.message).toBe('未知错误');
    expect(result.statusCode).toBe(500);
    expect(result.code).toBe('UNKNOWN_ERROR');
  });
});

import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limiter';

export async function middleware(request: NextRequest) {
  // 只对API路由进行限流
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const limitCheck = rateLimit(100, 60000); // 每分钟100个请求
    const result = limitCheck(request);

    if (!result.allowed) {
      return NextResponse.json(
        {
          error: '请求过于频繁，请稍后再试',
          retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': String(result.remaining),
            'X-RateLimit-Reset': String(result.resetAt),
          },
        }
      );
    }

    // 添加限流头部
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', '100');
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', String(result.resetAt));
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};

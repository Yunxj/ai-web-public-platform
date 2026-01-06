import { NextRequest, NextResponse } from 'next/server';
import { generateArticle } from '@/lib/ai-service';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('开始测试AI服务...');

    const content = await generateArticle({
      prompt: '简单介绍一下人工智能',
      contentType: 'article',
      context: [],
    });

    console.log('测试完成，内容长度:', content.length);

    return NextResponse.json({
      success: true,
      contentLength: content.length,
      preview: content.slice(0, 200),
    });
  } catch (error) {
    console.error('测试失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

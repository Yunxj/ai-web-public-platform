import { NextRequest } from 'next/server';
import { generateArticle } from '@/lib/ai-service';
import { GenerateArticleRequest, StreamChunk } from '@/types/api';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body: GenerateArticleRequest = await request.json();
    const { message, contentType, context } = body;

    console.log('收到请求:', { message, contentType, contextLength: context?.length });

    if (!message) {
      return new Response(JSON.stringify({ error: '消息不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 创建流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('开始调用AI服务...');

          // 使用超时控制
          const timeoutPromise = new Promise<string>((_, reject) => {
            setTimeout(() => reject(new Error('AI生成超时')), 180000); // 增加到180秒（3分钟）
          });

          const generatePromise = generateArticle({
            prompt: message,
            contentType: contentType || 'article',
            context: context || [],
          });

          // 使用Promise.race实现超时控制
          const content = await Promise.race([generatePromise, timeoutPromise]);

          console.log('AI生成完成，内容长度:', content.length);

          // 流式输出内容 - 优化chunk大小
          const chunkSize = 50; // 增大到50个字符，提升性能
          for (let i = 0; i < content.length; i += chunkSize) {
            const chunk = content.slice(i, i + chunkSize);
            const data: StreamChunk = { content: chunk };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          }

          console.log('流式输出完成');
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (error) {
          console.error('生成错误:', error);
          const errorMessage = error instanceof Error ? error.message : '未知错误';
          const errorChunk: StreamChunk = { error: '生成失败: ' + errorMessage };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('API错误:', error);
    return new Response(JSON.stringify({ error: '服务器错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

import { NextRequest } from 'next/server';
import { generateArticle } from '@/lib/ai-service';
import { GenerateArticleRequest, StreamChunk } from '@/types/api';
import { isAccountError, isRetryableError, getFriendlyErrorMessage } from '@/lib/error-handler';
import { getApiKeysConfig } from '@/config/llm-config';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body: GenerateArticleRequest = await request.json();
    const { message, contentType, context, integratedData } = body;

    console.log('收到请求:', { message, contentType, contextLength: context?.length, hasIntegratedData: !!integratedData });

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

          let content: string;
          let lastError: Error | null = null;
          const maxRetries = 2;

          // 获取用户配置的API Key
          const apiKeysConfig = await getApiKeysConfig();

          // 多模型重试机制
          for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
              console.log(`[尝试 ${attempt + 1}/${maxRetries + 1}] 调用生成服务...`);
              
              const generatePromise = generateArticle({
                prompt: message,
                contentType: contentType || 'article',
                context: context || [],
                integratedData: integratedData,
                apiKeysConfig,
              });

              // 使用Promise.race实现超时控制
              content = await Promise.race([generatePromise, timeoutPromise]);

              if (content && content.trim().length > 0) {
                console.log(`[成功] AI生成完成，内容长度:`, content.length);
                break; // 成功，跳出重试循环
              } else {
                throw new Error('生成的内容为空');
              }
            } catch (error) {
              lastError = error instanceof Error ? error : new Error(String(error));
              console.error(`[尝试 ${attempt + 1}/${maxRetries + 1}] 生成错误:`, {
                error: lastError.message,
                attempt: attempt + 1,
              });

              // 如果是账户错误，不应该重试，直接抛出友好错误
              if (isAccountError(error)) {
                const friendlyError = new Error(getFriendlyErrorMessage(error));
                throw friendlyError;
              }

              // 如果是不可重试的错误，直接抛出
              if (!isRetryableError(error)) {
                throw lastError;
              }

              // 如果不是最后一次尝试，等待后重试
              if (attempt < maxRetries) {
                const waitTime = (attempt + 1) * 1000; // 递增等待时间
                console.log(`等待 ${waitTime}ms 后重试...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
              } else {
                // 最后一次尝试也失败，抛出友好错误信息
                const friendlyError = new Error(getFriendlyErrorMessage(lastError));
                throw friendlyError;
              }
            }
          }

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
          console.error('生成错误（所有重试都失败）:', error);
          const errorMessage = error instanceof Error ? error.message : '未知错误';
          const friendlyMessage = getFriendlyErrorMessage(error);
          const errorChunk: StreamChunk = { error: friendlyMessage };
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

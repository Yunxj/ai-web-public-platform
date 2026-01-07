import { NextRequest, NextResponse } from 'next/server';
import { getImageLLMService } from '@/lib/llm-fallback';
import { getApiKeysConfig } from '@/config/llm-config';

export const runtime = 'nodejs';

/**
 * 图片生成API - 集成文生图功能
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, size = '2K', count = 1 } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: '提示词不能为空' },
        { status: 400 }
      );
    }

    console.log('生成图片:', prompt, '尺寸:', size, '数量:', count);

    // 获取用户配置的API Key
    const apiKeysConfig = await getApiKeysConfig();
    
    // 使用fallback机制获取图片生成服务
    const imageService = getImageLLMService(apiKeysConfig);

    const response = await imageService.generate({
      prompt,
      size,
      watermark: false,
      responseFormat: 'url',
    });

    const helper = imageService.getResponseHelper(response);

    if (!helper.success) {
      throw new Error(helper.errorMessages.join(', '));
    }

    console.log('图片生成完成，数量:', helper.imageUrls.length);

    return NextResponse.json({
      success: true,
      images: helper.imageUrls.slice(0, count),
    });
  } catch (error) {
    console.error('图片生成错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '图片生成失败',
      },
      { status: 500 }
    );
  }
}

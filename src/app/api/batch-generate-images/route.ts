import { NextRequest, NextResponse } from 'next/server';
import { getImageLLMService } from '@/lib/llm-fallback';
import { getApiKeysConfig } from '@/config/llm-config';
import { BatchGenerateImagesRequest, BatchGenerateImagesResponse, ImageRequest } from '@/types/api';

export const runtime = 'nodejs';

/**
 * 批量生成配图API
 *
 * 根据内容分析的结果，批量生成多张图片
 * 每张图片都有对应的插入位置信息
 */
export async function POST(request: NextRequest) {
  try {
    const body: BatchGenerateImagesRequest = await request.json();
    const { images, size, isCover = false } = body;

    // 根据公众号规范设置尺寸
    // SDK支持的尺寸范围：[2560x1440, 4096x4096]
    // 微信公众号推荐比例：16:9
    // 使用 '2560x1440' (16:9比例) 确保最佳展示效果
    const imageSize = size || '2560x1440';
    console.log(`图片尺寸: ${imageSize} (16:9比例，适合公众号，封面: ${isCover})`);

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: '图片请求列表不能为空' },
        { status: 400 }
      );
    }

    console.log(`开始批量生成 ${images.length} 张图片`);

    // 获取用户配置的API Key
    const apiKeysConfig = await getApiKeysConfig();
    
    // 使用豆包图片生成服务
    const imageService = getImageLLMService(apiKeysConfig);
    console.log('图片生成服务: 豆包');

    // 并发生成所有图片，使用 Promise.allSettled 确保所有请求都完成
    const imagePromises = images.map(async (imgRequest, index) => {
      try {
        console.log(`生成第 ${index + 1}/${images.length} 张图片，提示词:`, imgRequest.prompt.substring(0, 50));

        // 设置超时机制（每张图片最多等待60秒）
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('图片生成超时')), 60000)
        );

        const generationPromise = imageService.generate({
          prompt: imgRequest.prompt,
          size: imageSize,
          watermark: false, // 确保无水印
          responseFormat: 'url',
        });

        // 使用 Promise.race 实现超时控制
        const response = await Promise.race([generationPromise, timeoutPromise]);

        const helper = imageService.getResponseHelper(response);

        if (!helper.success || helper.imageUrls.length === 0) {
          const errorMsg = helper.errorMessages.length > 0
            ? helper.errorMessages.join(', ')
            : '未知错误';
          console.error(`第 ${index + 1} 张图片生成失败:`, errorMsg);
          throw new Error(errorMsg);
        }

        console.log(`第 ${index + 1}/${images.length} 张图片生成成功`);
        return {
          success: true,
          position: imgRequest.position,
          url: helper.imageUrls[0],
          index,
        };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '生成失败';
        console.error(`第 ${index + 1} 张图片生成失败:`, errorMsg);
        return {
          success: false,
          position: imgRequest.position,
          error: errorMsg,
          index,
        };
      }
    });

    const results = await Promise.all(imagePromises);

    // 统计成功和失败数量
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    console.log(`批量生成完成：成功 ${successCount} 张，失败 ${failedCount} 张`);

    // 提取成功的图片URL和位置信息
    const successfulImages = results
      .filter((r): r is { success: true; position: string; url: string; index: number } => r.success)
      .map(r => ({
        position: r.position,
        url: r.url,
      }));

    const response: BatchGenerateImagesResponse = {
      success: true,
      images: successfulImages,
      totalRequested: images.length,
      successCount,
      failedCount,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('批量生成图片错误:', error);
    const errorResponse: BatchGenerateImagesResponse = {
      success: false,
      error: error instanceof Error ? error.message : '批量生成失败',
      images: [],
      totalRequested: 0,
      successCount: 0,
      failedCount: 0,
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

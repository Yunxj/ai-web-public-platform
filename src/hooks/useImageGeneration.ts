import { useState, useCallback } from 'react';
import { fetchWithTimeout } from '@/lib/fetch-utils';

interface ImagePosition {
  position: string;
  url: string;
}

export function useImageGeneration() {
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [imagePositions, setImagePositions] = useState<ImagePosition[]>([]);

  const generateImages = useCallback(async (
    content: string,
    onStepUpdate: (stepId: string, status: 'running' | 'completed' | 'error', result?: string) => void
  ): Promise<void> => {
    onStepUpdate('image', 'running');
    
    try {
      console.log('开始智能配图流程...');

      // 5.1 使用LLM分析文章内容，决定图片数量、提示词和位置
      console.log('步骤5.1: 分析文章内容...');
      const analyzeResponse = await fetchWithTimeout(
        '/api/analyze-content-for-images',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content,
          }),
        },
        60000 // 内容分析超时设置为1分钟
      );

      if (!analyzeResponse.ok) {
        throw new Error('内容分析失败');
      }

      const analyzeData = await analyzeResponse.json();
      console.log('内容分析结果:', analyzeData);

      let plan: { count: number; images: Array<{ prompt: string; position: string }> };

      if (!analyzeData.success || !analyzeData.plan) {
        console.warn('分析失败，使用fallback方案');
        plan = {
          count: 1,
          images: [
            {
              position: 'FIRST_PARAGRAPH',
              prompt: `微信公众号文章配图，抽象概念图，简洁现代风格，专业摄影，适合文章开头插图，高质量，16:9比例`,
            },
          ],
        };
      } else {
        plan = analyzeData.plan;
      }

      console.log(`配图方案：需要生成 ${plan.count} 张图片`);

      // 检查是否有有效的图片计划
      if (!plan.images || plan.images.length === 0) {
        console.warn('没有生成配图计划，使用fallback方案');
        plan = {
          count: 1,
          images: [
            {
              position: 'FIRST_PARAGRAPH',
              prompt: `微信公众号文章配图，抽象概念图，简洁现代风格，专业摄影，适合文章开头插图，高质量，16:9比例`,
            },
          ],
        };
      }

      // 5.2 根据分析结果批量生成图片
      console.log('步骤5.2: 批量生成图片...');
      console.log('图片请求数量:', plan.images.length);

      const batchRequestBody = {
        images: plan.images.map((img: { prompt: string; position: string }) => ({
          prompt: img.prompt,
          position: img.position,
        })),
        size: '2560x1440',
      };

      const batchResponse = await fetchWithTimeout(
        '/api/batch-generate-images',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(batchRequestBody),
        },
        180000
      );

      if (!batchResponse.ok) {
        const errorData = await batchResponse.json().catch(() => ({}));
        console.error('批量生成图片失败:', {
          status: batchResponse.status,
          statusText: batchResponse.statusText,
          errorData,
        });
        throw new Error(`批量生成图片失败: HTTP ${batchResponse.status} - ${errorData.error || batchResponse.statusText}`);
      }

      const batchData = await batchResponse.json();
      console.log('批量生成结果:', {
        success: batchData.success,
        totalRequested: batchData.totalRequested,
        successCount: batchData.successCount,
        failedCount: batchData.failedCount,
        imagesCount: batchData.images?.length,
      });

      if (!batchData.success || batchData.images.length === 0) {
        throw new Error('未能生成图片，可能所有图片都生成失败');
      }

      // 5.3 保存生成的图片和位置信息
      const imageUrls = batchData.images.map((img: { position: string; url: string }) => img.url);
      setGeneratedImages(imageUrls);
      setImagePositions(batchData.images);

      onStepUpdate('image', 'completed', `智能生成 ${batchData.images.length} 张配图`);
    } catch (error) {
      console.error('智能配图失败:', error);
      onStepUpdate('image', 'error');
      throw error;
    }
  }, []);

  const resetImages = useCallback(() => {
    setGeneratedImages([]);
    setImagePositions([]);
  }, []);

  return {
    generatedImages,
    imagePositions,
    generateImages,
    resetImages,
  };
}

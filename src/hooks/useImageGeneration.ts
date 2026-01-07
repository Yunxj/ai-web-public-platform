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
    onStepUpdate: (stepId: string, status: 'running' | 'completed' | 'error', result?: string) => void,
    searchData?: {
      results: Array<{ title: string; url: string; snippet?: string }>;
      summary?: string;
    },
    analysisData?: string,
    integratedData?: string
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
            searchData,
            analysisData,
            integratedData,
          }),
        },
        60000 // 内容分析超时设置为1分钟
      );

      let analyzeData: any = null;
      
      if (!analyzeResponse.ok) {
        // 尝试解析错误响应以获取详细错误信息
        let errorMessage = `HTTP ${analyzeResponse.status}: ${analyzeResponse.statusText || '未知错误'}`;
        try {
          // 先尝试读取响应文本
          const responseText = await analyzeResponse.text();
          
          if (responseText) {
            try {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData.error || errorData.message || errorMessage;
            } catch (parseError) {
              // 如果不是JSON，直接使用文本内容
              errorMessage = responseText.length > 200 
                ? `${responseText.substring(0, 200)}...` 
                : responseText;
            }
          }
        } catch (e) {
          // 忽略读取错误
        }
        
        console.warn('内容分析API错误，使用fallback方案:', JSON.stringify({
          status: analyzeResponse.status,
          statusText: analyzeResponse.statusText,
          error: errorMessage,
        }, null, 2));
        
        // 内容分析失败不影响主流程，使用fallback方案继续
        analyzeData = { success: false };
      } else {
        analyzeData = await analyzeResponse.json();
        console.log('内容分析结果:', JSON.stringify(analyzeData, null, 2));
      }

      let plan: { count: number; images: Array<{ prompt: string; position: string }> };

      if (!analyzeData || !analyzeData.success || !analyzeData.plan) {
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
        let errorMessage = `HTTP ${batchResponse.status}: ${batchResponse.statusText || '未知错误'}`;
        try {
          const errorData = await batchResponse.json();
          if (errorData.error) {
            errorMessage = typeof errorData.error === 'string' 
              ? errorData.error 
              : JSON.stringify(errorData.error, null, 2);
          }
        } catch (parseError) {
          // 忽略解析错误
        }
        
        console.warn('批量生成图片API错误，跳过配图:', JSON.stringify({
          status: batchResponse.status,
          statusText: batchResponse.statusText,
          error: errorMessage,
        }, null, 2));
        
        // 图片生成失败不影响主流程，只记录警告
        onStepUpdate('image', 'completed', '跳过配图（图片生成服务不可用）');
        return;
      }

      const batchData = await batchResponse.json();
      console.log('批量生成结果:', JSON.stringify({
        success: batchData.success,
        totalRequested: batchData.totalRequested,
        successCount: batchData.successCount,
        failedCount: batchData.failedCount,
        imagesCount: batchData.images?.length,
        images: batchData.images?.map((img: { position: string; url: string }) => ({
          position: img.position,
          url: img.url ? `${img.url.substring(0, 50)}...` : 'N/A',
        })),
      }, null, 2));

      // 检查是否有成功生成的图片
      if (!batchData.success || !batchData.images || batchData.images.length === 0) {
        const errorDetails = {
          success: batchData.success,
          totalRequested: batchData.totalRequested,
          successCount: batchData.successCount,
          failedCount: batchData.failedCount,
          imagesCount: batchData.images?.length || 0,
        };
        
        console.warn('图片生成失败，跳过配图:', JSON.stringify(errorDetails, null, 2));
        
        // 图片生成失败不影响主流程，只记录警告
        onStepUpdate('image', 'completed', '跳过配图（图片生成失败）');
        return;
      }

      // 5.3 保存生成的图片和位置信息
      const imageUrls = batchData.images.map((img: { position: string; url: string }) => img.url);
      setGeneratedImages(imageUrls);
      setImagePositions(batchData.images);

      onStepUpdate('image', 'completed', `智能生成 ${batchData.images.length} 张配图`);
    } catch (error) {
      // 图片生成过程中的任何错误都不应该中断主流程
      const errorDetails = error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack?.split('\n').slice(0, 3).join('\n'),
          }
        : { error: String(error) };
      
      console.warn('智能配图过程出错，跳过配图:', JSON.stringify(errorDetails, null, 2));
      
      // 不抛出错误，只更新步骤状态为完成（跳过配图）
      onStepUpdate('image', 'completed', '跳过配图（配图过程出错）');
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

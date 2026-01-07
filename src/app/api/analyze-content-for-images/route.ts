import { NextRequest, NextResponse } from 'next/server';
import { AnalyzeContentRequest, AnalyzeContentResponse } from '@/types/api';
import { ImagePlan } from '@/types/index';
import { getTextLLMService, type LLMMessage } from '@/lib/llm-fallback';
import { models, serviceConfig, apiKeys, getActiveService, getTextModel, getApiKeysConfig } from '@/config/llm-config';

export const runtime = 'nodejs';

/**
 * 内容分析API - 分析文章内容并智能规划配图
 *
 * 使用DeepSeek等强大模型分析文章结构、主题、长度，
 * 智能决定：
 * 1. 需要几张图片（1-6张）
 * 2. 每张图片的提示词
 * 3. 插入位置（基于H2标题）
 */
export async function POST(request: NextRequest) {
  try {
    let body: AnalyzeContentRequest;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('请求体解析失败:', parseError);
      return NextResponse.json(
        { success: false, error: '请求体格式错误' },
        { status: 400 }
      );
    }

    const { content, searchData, analysisData, integratedData } = body;

    if (!content) {
      return NextResponse.json(
        { success: false, error: '文章内容不能为空' },
        { status: 400 }
      );
    }

    console.log('开始分析文章内容，长度:', content.length);
    console.log('前置步骤数据:', {
      hasSearchData: !!searchData,
      hasAnalysisData: !!analysisData,
      hasIntegratedData: !!integratedData,
    });

    // 获取用户配置的API Key
    const apiKeysConfig = await getApiKeysConfig();
    
    // 使用fallback机制获取文本生成服务
    const textService = getTextLLMService(apiKeysConfig);

    // 构建分析提示词
    let analysisPrompt = `请分析以下公众号文章内容，为文章智能规划配图方案。

【文章内容】
${content}`;

    // 如果有前置步骤的数据，添加到提示词中
    if (searchData && searchData.results && searchData.results.length > 0) {
      analysisPrompt += `\n\n【搜索资料】\n${searchData.results.map((r, i) => `${i + 1}. ${r.title}: ${r.snippet || ''}`).join('\n')}`;
      if (searchData.summary) {
        analysisPrompt += `\n搜索摘要：${searchData.summary}`;
      }
    }

    if (analysisData) {
      analysisPrompt += `\n\n【分析结果】\n${analysisData}`;
    }

    if (integratedData) {
      analysisPrompt += `\n\n【整合资料】\n${integratedData}`;
    }

    analysisPrompt += `

【任务要求】
1. 分析文章结构，识别所有H2标题（## 标题）
2. 根据以下规则决定配图数量（1-6张）：
   - 短文章（<800字）：0-1张图片
   - 中等文章（800-1500字）：2-3张图片
   - 长文章（1500-2500字）：3-4张图片
   - 超长文章（>2500字）：4-6张图片
   - 如果文章主题适合视觉化（如美食、旅游、科技评测），可以适当增加图片数量

3. 为每张图片生成精准的提示词（prompt）：
   - 结合对应章节的内容主题
   - 使用简洁、画面感强的描述
   - 适合公众号文章风格（清晰、专业、美观）
   - 中英文混合描述效果更好

4. 决定每张图片的插入位置：
   - 选择最合适的H2标题（## 后面）
   - 避免在文章开头立即插入第一张图片（保留给开头文字）
   - 图片应该均匀分布在文章中
   - 最后一张图片可以放在结尾或倒数第二个H2后

5. 输出格式要求：
   必须以JSON格式返回，格式如下：
   \`\`\`json
   {
     "count": 3,
     "images": [
       {
         "position": "第一个H2标题的完整文本",
         "prompt": "详细的图片生成提示词"
       }
     ]
   }
   \`\`\`

   注意：position必须精确匹配文章中的H2标题文本（包含##前缀后的内容）

【重要提示】
- 你必须严格基于上述提供的文章内容生成配图方案
- 不要使用下方示例中的具体内容（如"适合的食材"、"制作步骤"等），那些只是格式参考
- 图片的position必须精确匹配文章中的实际H2标题
- 图片的prompt必须基于对应章节的实际内容主题生成
- 如果文章中没有H2标题，请使用"FIRST_PARAGRAPH"作为position

【格式示例（仅作格式参考，不要使用示例中的具体内容）】
\`\`\`json
{
  "count": 2,
  "images": [
    {
      "position": "H2标题文本",
      "prompt": "基于该章节内容生成的图片提示词"
    }
  ]
}
\`\`\`

请现在分析上面的文章内容，并以JSON格式返回配图方案。`;

    try {
      const messages: LLMMessage[] = [
        {
          role: 'system',
          content: '你是一个专业的文章配图策划师，擅长分析文章内容并规划合适的配图方案。',
        },
        {
          role: 'user',
          content: analysisPrompt,
        },
      ];

      // 使用LLM进行分析
      // 对于图片规划这种需要强逻辑推理的任务，使用较低的temperature确保准确
      const invokeOptions: any = {
        temperature: serviceConfig.defaults.temperature.analyze, // 降低temperature以确保JSON格式准确
      };

      // 根据当前配置的服务选择模型（优先使用DeepSeek）
      const activeService = getActiveService();
      invokeOptions.model = getTextModel(activeService.text);

      const response = await textService.invoke(messages, invokeOptions);

      // 提取JSON响应
      let jsonContent = response.content;

      // 清理可能的前后缀内容
      const jsonMatch = jsonContent.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1];
      }

      const jsonMatch2 = jsonContent.match(/\{[\s\S]*\}/);
      if (jsonMatch2) {
        jsonContent = jsonMatch2[0];
      }

      // 解析JSON
      let plan: ImagePlan;
      try {
        plan = JSON.parse(jsonContent) as ImagePlan;
      } catch (parseError) {
        console.error('JSON解析失败:', parseError);
        console.error('原始响应内容:', jsonContent.substring(0, 500));
        throw new Error(`JSON解析失败: ${parseError instanceof Error ? parseError.message : '未知错误'}`);
      }

      // 验证和修正 - 确保至少有一张图片
      if (!plan.count || plan.count < 1) {
        console.warn('LLM返回的图片数量为0或未定义，修正为1');
        plan.count = 1;
      }
      if (plan.count > 6) {
        plan.count = 6;
      }
      if (!plan.images || plan.images.length === 0) {
        console.warn('LLM未能生成有效的图片数组，使用fallback');
        throw new Error('未能生成配图方案');
      }

      // 确保images数量与count一致
      if (plan.images.length > plan.count) {
        plan.images = plan.images.slice(0, plan.count);
      } else if (plan.images.length < plan.count) {
        console.warn(`LLM只生成了${plan.images.length}张图片的方案，但声明需要${plan.count}张，使用实际数量`);
        plan.count = plan.images.length;
      }

      // 再次确保至少有一张图片
      if (plan.images.length === 0) {
        console.warn('最终验证图片数量为0，使用fallback');
        throw new Error('未能生成配图方案');
      }

      console.log('配图分析完成，图片数量:', plan.count);
      console.log('配图方案:', plan.images.map((img: { position: string; prompt: string }) => ({ position: img.position, prompt: img.prompt.substring(0, 50) + '...' })));

      const analyzeResponse: AnalyzeContentResponse = {
        success: true,
        plan,
      };

      return NextResponse.json(analyzeResponse);
    } catch (error) {
      console.error('LLM分析失败:', error);

      // 降级方案：基于H2标题数量简单的分配
      const h2Matches = content.match(/##\s+[^\n]+/g) || [];
      const h2Count = h2Matches.length;

      const images = [];

      if (h2Count > 0) {
        // 有 H2 标题的情况：每2-3个H2标题配一张图
        let imageCount = Math.ceil(h2Count / 2);
        if (imageCount > 6) imageCount = 6;

        for (let i = 0; i < imageCount && i < h2Count; i++) {
          const h2Title = h2Matches[i * 2].replace(/^##\s+/, '').trim();
          images.push({
            position: h2Title,
            prompt: `微信公众号文章配图，主题：${h2Title}，专业摄影风格，高清，适合文章插图`,
          });
        }
      } else {
        // 没有 H2 标题的情况：在开头插入一张图片
        // 使用特殊标记，前端会处理
        images.push({
          position: 'FIRST_PARAGRAPH',
          prompt: `微信公众号文章配图，抽象概念图，简洁现代风格，专业摄影，适合文章开头插图，高质量`,
        });
      }

      // 确保至少有一张图片
      if (images.length === 0) {
        images.push({
          position: 'FIRST_PARAGRAPH',
          prompt: `微信公众号文章配图，抽象概念图，简洁现代风格，专业摄影，适合文章开头插图，高质量`,
        });
      }

      const fallbackPlan: ImagePlan = {
        count: images.length,
        images,
      };

      console.log('使用降级方案，图片数量:', fallbackPlan.count);

      const fallbackAnalyzeResponse: AnalyzeContentResponse = {
        success: true,
        plan: fallbackPlan,
      };

      return NextResponse.json(fallbackAnalyzeResponse);
    }
  } catch (error) {
    console.error('内容分析错误:', error);
    const errorResponse: AnalyzeContentResponse = {
      success: false,
      error: error instanceof Error ? error.message : '内容分析失败',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

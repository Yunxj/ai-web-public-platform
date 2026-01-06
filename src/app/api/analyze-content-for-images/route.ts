import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';
import { AnalyzeContentRequest, AnalyzeContentResponse } from '@/types/api';
import { ImagePlan } from '@/types/index';

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
    const body: AnalyzeContentRequest = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: '文章内容不能为空' },
        { status: 400 }
      );
    }

    console.log('开始分析文章内容，长度:', content.length);

    const config = new Config();
    const client = new LLMClient(config);

    // 构建分析提示词
    const analysisPrompt = `请分析以下公众号文章内容，为文章智能规划配图方案。

【文章内容】
${content}

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

【示例输出】
如果文章H2标题是"## 适合的食材"和"## 制作步骤"，输出可能是：
\`\`\`json
{
  "count": 2,
  "images": [
    {
      "position": "适合的食材",
      "prompt": "新鲜蔬菜和水果摆放在木桌上，自然光线，清新风格，高质量摄影，适合健康美食文章"
    },
    {
      "position": "制作步骤",
      "prompt": "厨房场景，厨师正在切菜，刀工精湛，专业厨房设备，温馨灯光，美食制作过程"
    }
  ]
}
\`\`\`

请现在分析上面的文章内容，并以JSON格式返回配图方案。`;

    try {
      const messages = [
        {
          role: 'system' as const,
          content: '你是一个专业的文章配图策划师，擅长分析文章内容并规划合适的配图方案。',
        },
        {
          role: 'user' as const,
          content: analysisPrompt,
        },
      ];

      // 使用DeepSeek模型进行分析（更强大的推理能力）
      // 对于图片规划这种需要强逻辑推理的任务，使用较低的temperature确保准确
      const response = await client.invoke(messages, {
        model: 'deepseek-r1-250528', // 使用正确的DeepSeek R1模型名称
        temperature: 0.3, // 降低temperature以确保JSON格式准确
      });

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
      const plan = JSON.parse(jsonContent) as ImagePlan;

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

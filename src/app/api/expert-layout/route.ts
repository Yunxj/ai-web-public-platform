import { NextRequest, NextResponse } from 'next/server';
import { ExpertLayoutRequest, ExpertLayoutResponse } from '@/types/api';
import { getTextLLMService, type LLMMessage } from '@/lib/llm-fallback';
import { models, serviceConfig, getActiveService, getTextModel } from '@/config/llm-config';

export const runtime = 'nodejs';

/**
 * 专家排版API - 应用公众号文章专业排版
 * 
 * 步骤6：等待步骤5（内容配图）完成，接收生成的文章内容
 * 使用LLM或规则引擎进行专业排版优化，应用公众号文章排版规范
 */
export async function POST(request: NextRequest) {
  try {
    const body: ExpertLayoutRequest = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { success: false, error: '文章内容不能为空' },
        { status: 400 }
      );
    }

    console.log('开始专家排版，文章长度:', content.length);

    // 获取用户配置的API Key
    const apiKeysConfig = await getApiKeysConfig();
    
    // 使用fallback机制获取文本生成服务
    const textService = getTextLLMService(apiKeysConfig);

    // 构建排版提示词
    const layoutPrompt = `请对以下公众号文章进行专业排版优化，应用公众号文章排版规范。

【文章内容】
${content}

【排版要求】
1. **段落格式**：
   - 段落首行缩进使用两个全角空格（　　）
   - 段落之间保持空行
   - 避免过长的段落，适当分段

2. **标题格式**：
   - 一级标题使用 # 开头
   - 二级标题使用 ## 开头
   - 小标题使用 ### 01、### 02、### 03 格式
   - 标题前后保持空行

3. **列表格式**：
   - 无序列表使用 - 或 • 符号
   - 有序列表使用 1. 2. 3. 格式
   - 列表项之间保持适当间距

4. **引用格式**：
   - 使用 > 符号进行引用
   - 引用内容前后保持空行

5. **强调格式**：
   - 重要信息使用 **粗体** 强调
   - 避免过度使用粗体

6. **分隔线**：
   - 使用 --- 作为模块分隔线
   - 分隔线前后保持空行

7. **图片格式**：
   - 图片使用 ![图片描述](文件名) 格式
   - 图片前后保持空行

8. **整体优化**：
   - 确保文章结构清晰
   - 保持一致的格式风格
   - 优化可读性
   - 符合公众号文章阅读习惯

请输出排版优化后的文章内容，保持原有内容不变，只优化格式和排版。`;

    try {
      const messages: LLMMessage[] = [
        {
          role: 'system',
          content: '你是一个专业的公众号文章排版专家，擅长应用公众号文章排版规范，优化文章格式和可读性。',
        },
        {
          role: 'user',
          content: layoutPrompt,
        },
      ];

      const invokeOptions: any = {
        temperature: serviceConfig.defaults.temperature.analyze, // 使用较低的temperature确保格式准确
      };

      // 根据当前配置的服务选择模型（优先使用DeepSeek）
      const activeService = getActiveService();
      invokeOptions.model = getTextModel(activeService.text);

      const response = await textService.invoke(messages, invokeOptions);

      const formattedContent = response.content;

      console.log('专家排版完成，排版后长度:', formattedContent.length);

      const layoutResponse: ExpertLayoutResponse = {
        success: true,
        formattedContent,
      };

      return NextResponse.json(layoutResponse);
    } catch (error) {
      console.error('LLM排版失败:', error);
      
      // 降级方案：使用简单的规则引擎进行基础排版
      let formattedContent = content;

      // 基础排版规则
      // 1. 确保标题前后有空行
      formattedContent = formattedContent.replace(/(\n)(##+[^\n]+)(\n)(?=[^\n#])/g, '$1$2$3\n');
      
      // 2. 确保段落之间有空行（但不要过多空行）
      formattedContent = formattedContent.replace(/\n{3,}/g, '\n\n');
      
      // 3. 确保列表前后有空行
      formattedContent = formattedContent.replace(/(\n)([-*•]\s)/g, '\n\n$2');
      formattedContent = formattedContent.replace(/(\n)(\d+\.\s)/g, '\n\n$2');

      console.log('使用降级排版方案');

      const fallbackResponse: ExpertLayoutResponse = {
        success: true,
        formattedContent,
      };

      return NextResponse.json(fallbackResponse);
    }
  } catch (error) {
    console.error('专家排版错误:', error);
    const errorResponse: ExpertLayoutResponse = {
      success: false,
      error: error instanceof Error ? error.message : '专家排版失败',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

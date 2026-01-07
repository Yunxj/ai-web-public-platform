import { NextRequest, NextResponse } from 'next/server';
import { AnalyzeSearchResultsRequest, AnalyzeSearchResultsResponse } from '@/types/api';
import { getTextLLMService, type LLMMessage } from '@/lib/llm-fallback';
import { models, serviceConfig, getActiveService, getTextModel, getApiKeysConfig } from '@/config/llm-config';

export const runtime = 'nodejs';

/**
 * 分析资料信息API - 深度分析搜索到的资料内容和价值
 * 
 * 步骤2：等待步骤1（资料搜索）完成，接收搜索结果
 * 使用LLM深度分析搜索到的资料，提取关键信息、价值点、相关性等
 */
export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeSearchResultsRequest = await request.json();
    const { query, searchResults, searchSummary } = body;

    if (!query) {
      return NextResponse.json(
        { success: false, error: '查询内容不能为空' },
        { status: 400 }
      );
    }

    if (!searchResults || searchResults.length === 0) {
      return NextResponse.json(
        { success: false, error: '搜索结果不能为空' },
        { status: 400 }
      );
    }

    console.log('开始分析资料信息，搜索结果数量:', searchResults.length);

    // 获取用户配置的API Key
    const apiKeysConfig = await getApiKeysConfig();
    
    // 使用fallback机制获取文本生成服务
    const textService = getTextLLMService(apiKeysConfig);

    // 构建搜索结果文本
    const searchResultsText = searchResults
      .map((result, index) => {
        return `${index + 1}. 标题：${result.title}\n   链接：${result.url}\n   摘要：${result.snippet || '无摘要'}`;
      })
      .join('\n\n');

    // 构建分析提示词
    const analysisPrompt = `请深度分析以下搜索到的资料，提取关键信息、价值点和相关性。

【用户查询】
${query}

【搜索结果】
${searchResultsText}

${searchSummary ? `【搜索摘要】\n${searchSummary}\n` : ''}

【任务要求】
1. 分析每条搜索结果的核心内容和价值
2. 识别与用户查询最相关的关键信息
3. 提取可以用于文章写作的重要观点、数据、案例
4. 评估每条资料的质量和可信度
5. 总结整体资料的价值和可用性

请以结构化的方式输出分析结果，包括：
- 关键信息提取
- 价值点总结
- 相关性评估
- 可用性建议

输出格式要求：清晰、有条理，便于后续整合使用。`;

    try {
      const messages: LLMMessage[] = [
        {
          role: 'system',
          content: '你是一个专业的内容分析师，擅长深度分析资料内容并提取关键信息。',
        },
        {
          role: 'user',
          content: analysisPrompt,
        },
      ];

      const invokeOptions: any = {
        temperature: serviceConfig.defaults.temperature.analyze,
      };

      // 根据当前配置的服务选择模型（优先使用DeepSeek）
      const activeService = getActiveService();
      invokeOptions.model = getTextModel(activeService.text);

      const response = await textService.invoke(messages, invokeOptions);

      const analysis = response.content;

      console.log('资料分析完成，分析结果长度:', analysis.length);

      const analyzeResponse: AnalyzeSearchResultsResponse = {
        success: true,
        analysis,
      };

      return NextResponse.json(analyzeResponse);
    } catch (error) {
      console.error('LLM分析失败:', error);
      
      // 降级方案：简单提取搜索结果的关键信息
      const fallbackAnalysis = `搜索结果分析：
共找到 ${searchResults.length} 条相关资料。

关键信息：
${searchResults.slice(0, 5).map((r, i) => `${i + 1}. ${r.title}: ${r.snippet || '无摘要'}`).join('\n')}

${searchSummary ? `\n搜索摘要：${searchSummary}` : ''}

建议：以上资料可用于文章写作，建议重点关注前几条相关性较高的结果。`;

      const fallbackResponse: AnalyzeSearchResultsResponse = {
        success: true,
        analysis: fallbackAnalysis,
      };

      return NextResponse.json(fallbackResponse);
    }
  } catch (error) {
    console.error('分析资料信息错误:', error);
    const errorResponse: AnalyzeSearchResultsResponse = {
      success: false,
      error: error instanceof Error ? error.message : '分析资料信息失败',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

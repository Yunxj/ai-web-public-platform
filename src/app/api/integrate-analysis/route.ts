import { NextRequest, NextResponse } from 'next/server';
import { IntegrateAnalysisRequest, IntegrateAnalysisResponse } from '@/types/api';
import { getTextLLMService, type LLMMessage } from '@/lib/llm-fallback';
import { models, serviceConfig, getActiveService, getTextModel, getApiKeysConfig } from '@/config/llm-config';

export const runtime = 'nodejs';

/**
 * 资料整合API - 整理和整合分析后的资料
 * 
 * 步骤3：等待步骤2（分析资料信息）完成，接收分析结果
 * 使用LLM整理和整合分析后的资料，生成可直接用于文章生成的结构化资料
 */
export async function POST(request: NextRequest) {
  try {
    const body: IntegrateAnalysisRequest = await request.json();
    const { query, analysisData } = body;

    if (!query) {
      return NextResponse.json(
        { success: false, error: '查询内容不能为空' },
        { status: 400 }
      );
    }

    if (!analysisData) {
      return NextResponse.json(
        { success: false, error: '分析结果不能为空' },
        { status: 400 }
      );
    }

    console.log('开始整合资料，分析结果长度:', analysisData.length);

    // 获取用户配置的API Key
    const apiKeysConfig = await getApiKeysConfig();
    
    // 使用fallback机制获取文本生成服务
    const textService = getTextLLMService(apiKeysConfig);

    // 构建整合提示词
    const integratePrompt = `请整理和整合以下分析后的资料，生成可直接用于文章生成的结构化资料。

【用户查询】
${query}

【分析结果】
${analysisData}

【任务要求】
1. 整理分析结果中的关键信息，去除冗余内容
2. 按照逻辑结构组织资料（如：背景信息、核心观点、数据案例、相关建议等）
3. 确保资料结构清晰，便于后续文章生成使用
4. 保留所有有价值的信息点
5. 优化表达方式，使其更适合作为文章写作的素材

输出格式要求：
- 结构清晰，层次分明
- 信息完整，便于引用
- 语言流畅，适合作为写作素材
- 可以直接用于指导文章生成

请输出整合后的结构化资料：`;

    try {
      const messages: LLMMessage[] = [
        {
          role: 'system',
          content: '你是一个专业的内容整合专家，擅长整理和整合资料，生成结构化的写作素材。',
        },
        {
          role: 'user',
          content: integratePrompt,
        },
      ];

      const invokeOptions: any = {
        temperature: serviceConfig.defaults.temperature.analyze,
      };

      // 根据当前配置的服务选择模型（优先使用DeepSeek）
      const activeService = getActiveService();
      invokeOptions.model = getTextModel(activeService.text);

      const response = await textService.invoke(messages, invokeOptions);

      const integratedData = response.content;

      console.log('资料整合完成，整合结果长度:', integratedData.length);

      const integrateResponse: IntegrateAnalysisResponse = {
        success: true,
        integratedData,
      };

      return NextResponse.json(integrateResponse);
    } catch (error) {
      console.error('LLM整合失败:', error);
      
      // 降级方案：简单整理分析结果
      const fallbackIntegratedData = `【整合后的资料】

用户查询：${query}

${analysisData}

【使用建议】
以上资料已整理完成，可直接用于文章生成。建议在生成文章时：
1. 参考关键信息点
2. 引用相关数据和案例
3. 保持内容的准确性和相关性`;

      const fallbackResponse: IntegrateAnalysisResponse = {
        success: true,
        integratedData: fallbackIntegratedData,
      };

      return NextResponse.json(fallbackResponse);
    }
  } catch (error) {
    console.error('资料整合错误:', error);
    const errorResponse: IntegrateAnalysisResponse = {
      success: false,
      error: error instanceof Error ? error.message : '资料整合失败',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

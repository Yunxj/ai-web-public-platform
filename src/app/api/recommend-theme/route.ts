/**
 * 主题推荐 API - 根据文章内容智能推荐主题
 * POST /api/recommend-theme
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTextLLMService, type LLMMessage } from '@/lib/llm-fallback';
import { 
  getAllThemes, 
  matchThemesByKeywords,
  type WenyanThemeId 
} from '@/config/wenyan-themes';
import { 
  getActiveService, 
  getTextModel,
  getApiKeysConfig, 
  serviceConfig 
} from '@/config/llm-config';

export const runtime = 'nodejs';

export interface RecommendThemeRequest {
  content: string; // Markdown格式的文章内容
}

export interface RecommendedTheme {
  themeId: WenyanThemeId;
  name: string;
  description: string;
  reason: string; // 推荐理由
  score: number; // 匹配度分数 (0-100)
}

export interface RecommendThemeResponse {
  success: boolean;
  recommendedThemes?: RecommendedTheme[];
  error?: string;
}

/**
 * 提取文章关键词
 */
function extractKeywords(content: string): string[] {
  // 移除Markdown语法
  const text = content
    .replace(/#{1,6}\s+/g, '') // 移除标题标记
    .replace(/\*\*([^*]+)\*\*/g, '$1') // 移除加粗
    .replace(/\*([^*]+)\*/g, '$1') // 移除斜体
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 移除链接
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // 移除图片
    .replace(/`([^`]+)`/g, '$1') // 移除代码
    .replace(/```[\s\S]*?```/g, '') // 移除代码块
    .replace(/>\s+/g, '') // 移除引用
    .replace(/[#*`\[\]()!]/g, ' ') // 移除其他Markdown符号
    .toLowerCase();

  // 提取中文关键词（2-4字）
  const chineseKeywords: string[] = [];
  const chinesePattern = /[\u4e00-\u9fa5]{2,4}/g;
  let match;
  while ((match = chinesePattern.exec(text)) !== null) {
    chineseKeywords.push(match[0]);
  }

  // 提取英文单词（3个字符以上）
  const englishKeywords: string[] = [];
  const englishPattern = /\b[a-z]{3,}\b/g;
  while ((match = englishPattern.exec(text)) !== null) {
    englishKeywords.push(match[0]);
  }

  // 合并并去重
  const allKeywords = [...chineseKeywords, ...englishKeywords];
  const uniqueKeywords = Array.from(new Set(allKeywords));

  // 返回前30个关键词
  return uniqueKeywords.slice(0, 30);
}

/**
 * 分析文章特征
 */
async function analyzeContentFeatures(
  content: string,
  apiKeysConfig?: { deepseek?: string; qwen?: string }
): Promise<{
  length: 'short' | 'medium' | 'long';
  type: 'technical' | 'emotional' | 'creative' | 'life' | 'knowledge' | 'other';
  style: 'serious' | 'casual' | 'fresh' | 'artistic';
  keywords: string[];
}> {
  const textService = getTextLLMService(apiKeysConfig);
  const keywords = extractKeywords(content);
  const contentLength = content.replace(/[#*`\[\]()!>\s]/g, '').length;

  // 判断文章长度
  let length: 'short' | 'medium' | 'long' = 'medium';
  if (contentLength < 800) {
    length = 'short';
  } else if (contentLength > 2500) {
    length = 'long';
  }

  // 构建分析提示词
  const analysisPrompt = `请分析以下文章内容，识别文章的类型、风格和主题特征。

【文章内容】（前1000字）
${content.substring(0, 1000)}

【提取的关键词】
${keywords.slice(0, 20).join('、')}

【任务要求】
1. 分析文章类型（technical/技术类、emotional/情感类、creative/创意类、life/生活类、knowledge/知识类、other/其他）
2. 分析文章风格（serious/严肃、casual/轻松、fresh/清新、artistic/文艺）
3. 提取3-5个最能代表文章主题的关键词

请以JSON格式返回，格式如下：
\`\`\`json
{
  "type": "technical",
  "style": "serious",
  "themeKeywords": ["技术", "编程", "开发"]
}
\`\`\``;

  try {
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: '你是一个专业的内容分析师，擅长分析文章特征并推荐合适的排版主题。',
      },
      {
        role: 'user',
        content: analysisPrompt,
      },
    ];

    const invokeOptions: any = {
      temperature: serviceConfig.defaults.temperature.analyze || 0.3,
    };

    const activeService = getActiveService();
    invokeOptions.model = getTextModel(activeService.text);

    const response = await textService.invoke(messages, invokeOptions);
    const analysisText = response.content;

    // 尝试从响应中提取JSON
    let analysisResult: any = {
      type: 'other',
      style: 'casual',
      themeKeywords: keywords.slice(0, 5),
    };

    try {
      const jsonMatch = analysisText.match(/```json\s*([\s\S]*?)\s*```/) || 
                       analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        analysisResult = JSON.parse(jsonStr);
      }
    } catch (parseError) {
      console.warn('JSON解析失败，使用默认值:', parseError);
    }

    return {
      length,
      type: analysisResult.type || 'other',
      style: analysisResult.style || 'casual',
      keywords: analysisResult.themeKeywords || keywords.slice(0, 5),
    };
  } catch (error) {
    console.error('内容分析失败:', error);
    // 使用默认值
    return {
      length,
      type: 'other',
      style: 'casual',
      keywords: keywords.slice(0, 5),
    };
  }
}

/**
 * 根据特征推荐主题
 */
function recommendThemesByFeatures(
  features: Awaited<ReturnType<typeof analyzeContentFeatures>>
): Array<{ themeId: WenyanThemeId; score: number; reason: string }> {
  const allThemes = getAllThemes();
  const recommendations: Array<{ themeId: WenyanThemeId; score: number; reason: string }> = [];

  // 基于关键词匹配
  const keywordMatches = matchThemesByKeywords(features.keywords);
  const keywordScores = new Map<WenyanThemeId, number>();
  keywordMatches.forEach(({ themeId, score }) => {
    keywordScores.set(themeId, score);
  });

  // 基于类型和风格匹配
  allThemes.forEach(theme => {
    let score = keywordScores.get(theme.id) || 0;
    let reason = '';

    // 根据文章类型匹配
    if (features.type === 'technical') {
      if (theme.id === 'lapis' || theme.id === 'pie') {
        score += 30;
        reason += '技术类文章，';
      }
    } else if (features.type === 'emotional') {
      if (theme.id === 'orangeheart') {
        score += 30;
        reason += '情感类文章，';
      }
    } else if (features.type === 'creative') {
      if (theme.id === 'rainbow') {
        score += 30;
        reason += '创意类内容，';
      }
    } else if (features.type === 'life') {
      if (theme.id === 'orangeheart' || theme.id === 'maize') {
        score += 30;
        reason += '生活类内容，';
      }
    } else if (features.type === 'knowledge') {
      if (theme.id === 'phycat' || theme.id === 'lapis') {
        score += 30;
        reason += '知识类内容，';
      }
    }

    // 根据文章风格匹配
    if (features.style === 'serious') {
      if (theme.id === 'default' || theme.id === 'purple') {
        score += 20;
        reason += '严肃风格，';
      }
    } else if (features.style === 'casual') {
      if (theme.id === 'rainbow' || theme.id === 'maize') {
        score += 20;
        reason += '轻松风格，';
      }
    } else if (features.style === 'fresh') {
      if (theme.id === 'lapis' || theme.id === 'phycat') {
        score += 20;
        reason += '清新风格，';
      }
    } else if (features.style === 'artistic') {
      if (theme.id === 'purple' || theme.id === 'rainbow') {
        score += 20;
        reason += '文艺风格，';
      }
    }

    // 根据文章长度匹配
    if (features.length === 'long') {
      if (theme.id === 'default') {
        score += 15;
        reason += '适合长文阅读，';
      }
    } else if (features.length === 'short') {
      if (theme.id === 'rainbow' || theme.id === 'maize') {
        score += 15;
        reason += '适合短文展示，';
      }
    }

    // 添加主题特征匹配
    theme.features.scenarios.forEach(scenario => {
      if (
        (features.type === 'technical' && scenario === '技术文章') ||
        (features.type === 'emotional' && scenario === '情感类') ||
        (features.type === 'creative' && scenario === '创意内容') ||
        (features.type === 'life' && scenario === '生活类') ||
        (features.type === 'knowledge' && scenario === '知识类')
      ) {
        score += 10;
      }
    });

    if (score > 0) {
      // 生成推荐理由
      if (!reason) {
        reason = '根据内容特征匹配，';
      }
      reason += `推荐使用${theme.name}主题`;

      recommendations.push({
        themeId: theme.id,
        score: Math.min(score, 100), // 限制在0-100
        reason,
      });
    }
  });

  // 按分数降序排序，返回前3个
  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

/**
 * 主题推荐API处理函数
 */
export async function POST(request: NextRequest) {
  try {
    const body: RecommendThemeRequest = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { success: false, error: '文章内容不能为空' },
        { status: 400 }
      );
    }

    console.log('开始分析文章内容并推荐主题，内容长度:', content.length);

    // 获取用户配置的API Key
    const apiKeysConfig = await getApiKeysConfig();

    // 分析文章特征
    const features = await analyzeContentFeatures(content, apiKeysConfig);

    // 推荐主题
    const themeRecommendations = recommendThemesByFeatures(features);

    // 获取所有主题信息
    const allThemes = getAllThemes();
    const recommendedThemes: RecommendedTheme[] = themeRecommendations.map(
      ({ themeId, score, reason }) => {
        const theme = allThemes.find(t => t.id === themeId);
        return {
          themeId,
          name: theme?.name || themeId,
          description: theme?.description || '',
          reason,
          score,
        };
      }
    );

    // 如果没有推荐结果，返回默认主题
    if (recommendedThemes.length === 0) {
      const defaultTheme = allThemes.find(t => t.id === 'default');
      recommendedThemes.push({
        themeId: 'default',
        name: defaultTheme?.name || '默认',
        description: defaultTheme?.description || '',
        reason: '未找到特别匹配的主题，使用默认主题',
        score: 50,
      });
    }

    console.log('主题推荐完成，推荐数量:', recommendedThemes.length);

    const response: RecommendThemeResponse = {
      success: true,
      recommendedThemes,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('主题推荐失败:', error);
    const errorResponse: RecommendThemeResponse = {
      success: false,
      error: error instanceof Error ? error.message : '主题推荐失败',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

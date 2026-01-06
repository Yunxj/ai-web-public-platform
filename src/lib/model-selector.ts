import { LLMClient, Config } from 'coze-coding-dev-sdk';

/**
 * 内容类型枚举
 */
export enum ContentType {
  TECHNICAL = 'technical',      // 技术型：需要准确性、结构化
  CREATIVE = 'creative',        // 创意型：需要情感、故事性
  GENERAL = 'general',          // 通用型：平衡要求
}

/**
 * 模型配置
 */
interface ModelConfig {
  model?: string; // 模型名称，undefined 表示使用默认模型
  temperature: number;
  maxTokens?: number;
}

/**
 * 内容类型识别结果
 */
interface RecognitionResult {
  type: ContentType;
  confidence: number;
  reason: string;
}

/**
 * 模型选择器
 */
export class ModelSelector {
  private static instance: ModelSelector;
  private config = new Config();

  private constructor() {}

  public static getInstance(): ModelSelector {
    if (!ModelSelector.instance) {
      ModelSelector.instance = new ModelSelector();
    }
    return ModelSelector.instance;
  }

  /**
   * 识别内容类型
   */
  public recognizeContentType(prompt: string, contentType: string): RecognitionResult {
    const lowerPrompt = prompt.toLowerCase();
    const lowerContentType = contentType.toLowerCase();

    // 技术型内容关键词
    const technicalKeywords = [
      '技术', '开发', '编程', '代码', '架构', '设计模式', '算法',
      'technical', 'development', 'programming', 'code', 'architecture',
      '教程', '指南', '分析', '评测', '原理', '实现', '教程',
      'word', '文档', '报告', '说明', '介绍', '讲解'
    ];

    // 创意型内容关键词
    const creativeKeywords = [
      '故事', '小说', '情感', '感悟', '随笔', '心得', '经历',
      'story', 'emotional', 'creative', 'writing', 'narrative',
      '小红书', 'xhs', '朋友圈', '分享', '日记', '游记',
      '海报', '宣传', '广告', '营销', '推广', '种草'
    ];

    // 计算技术型得分
    let technicalScore = 0;
    technicalKeywords.forEach(keyword => {
      if (lowerPrompt.includes(keyword) || lowerContentType.includes(keyword)) {
        technicalScore++;
      }
    });

    // 计算创意型得分
    let creativeScore = 0;
    creativeKeywords.forEach(keyword => {
      if (lowerPrompt.includes(keyword) || lowerContentType.includes(keyword)) {
        creativeScore++;
      }
    });

    // 特殊内容类型处理
    if (lowerContentType === 'xiaohongshu') {
      return {
        type: ContentType.CREATIVE,
        confidence: 0.9,
        reason: '小红书内容属于创意型'
      };
    }

    if (lowerContentType === 'word' || lowerContentType === 'article') {
      // Word和Article默认为技术型（除非明确是创意内容）
      if (creativeScore > technicalScore && creativeScore >= 2) {
        return {
          type: ContentType.CREATIVE,
          confidence: 0.75,
          reason: '检测到较多创意关键词'
        };
      }
      return {
        type: ContentType.TECHNICAL,
        confidence: 0.85,
        reason: '文档和文章通常需要准确性'
      };
    }

    if (lowerContentType === 'ecommerce' || lowerContentType === 'poster') {
      return {
        type: ContentType.CREATIVE,
        confidence: 0.8,
        reason: '电商和海报内容需要创意和营销性'
      };
    }

    // 根据得分判断
    if (technicalScore > creativeScore && technicalScore >= 2) {
      return {
        type: ContentType.TECHNICAL,
        confidence: Math.min(0.5 + technicalScore * 0.1, 0.95),
        reason: `检测到${technicalScore}个技术相关关键词`
      };
    }

    if (creativeScore > technicalScore && creativeScore >= 2) {
      return {
        type: ContentType.CREATIVE,
        confidence: Math.min(0.5 + creativeScore * 0.1, 0.95),
        reason: `检测到${creativeScore}个创意相关关键词`
      };
    }

    // 默认为通用型
    return {
      type: ContentType.GENERAL,
      confidence: 0.6,
      reason: '未明确识别为技术型或创意型，使用通用配置'
    };
  }

  /**
   * 获取模型配置
   */
  public getModelConfig(contentType: ContentType): ModelConfig {
    // 使用Kimi-K2模型作为统一文本生成模型（完整模型名称）
    const kimiModel = 'kimi-k2-250905';

    switch (contentType) {
      case ContentType.TECHNICAL:
        // 技术型内容：使用Kimi-K2，temperature较低以确保准确性
        return {
          model: kimiModel,
          temperature: 0.4,
          maxTokens: 2000,
        };

      case ContentType.CREATIVE:
        // 创意型内容：使用Kimi-K2，temperature较高以增加多样性
        return {
          model: kimiModel,
          temperature: 0.7,
          maxTokens: 2000,
        };

      case ContentType.GENERAL:
        // 通用型内容：使用Kimi-K2，平衡准确性和创意
        return {
          model: kimiModel,
          temperature: 0.6,
          maxTokens: 2000,
        };

      default:
        return {
          model: kimiModel,
          temperature: 0.6,
          maxTokens: 2000,
        };
    }
  }

  /**
   * 创建LLM客户端
   */
  public createClient(contentType: ContentType): LLMClient {
    const config = new Config();
    return new LLMClient(config);
  }
}

/**
 * 便捷函数：识别内容类型并获取模型配置
 */
export function getModelConfigForPrompt(prompt: string, contentType: string): {
  recognition: RecognitionResult;
  config: ModelConfig;
} {
  const selector = ModelSelector.getInstance();
  const recognition = selector.recognizeContentType(prompt, contentType);
  const config = selector.getModelConfig(recognition.type);

  return { recognition, config };
}

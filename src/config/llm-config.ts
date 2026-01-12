/**
 * LLM服务配置
 * 集中管理所有API keys、模型配置和服务配置
 */

import { getApiKeys } from '@/lib/api-key-storage';

/**
 * API Keys配置（环境变量）
 * 从环境变量读取，作为降级方案
 */
const envApiKeys = {
  /** DeepSeek API Key（文本生成，推荐） */
  deepseek: process.env.DEEPSEEK_API_KEY || undefined,
  
  /** 通义千问 API Key（已废弃，保留以兼容旧配置） */
  qwen: process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY || undefined,
  
  /** 豆包 API Key（图片生成） */
  /** 支持 ARK_API_KEY 或 DOUBAO_API_KEY */
  doubao: process.env.ARK_API_KEY || process.env.DOUBAO_API_KEY || undefined,
} as const;

/**
 * 获取 API Keys（优先使用用户配置，降级到环境变量）
 * 服务端函数，在 API 路由中使用
 */
export async function getApiKeysConfig(): Promise<{
  deepseek?: string;
  qwen?: string;
  doubao?: string;
}> {
  try {
    // 优先从用户配置读取
    const userConfig = await getApiKeys();
    
    // 合并用户配置和环境变量，用户配置优先
    return {
      deepseek: userConfig.deepseek || envApiKeys.deepseek,
      qwen: userConfig.qwen || envApiKeys.qwen,
      doubao: userConfig.doubao || userConfig.ark || envApiKeys.doubao,
    };
  } catch (error) {
    console.warn('获取用户配置的 API Key 失败，使用环境变量:', error);
    // 降级到环境变量
    return envApiKeys;
  }
}

/**
 * API Keys配置（向后兼容，使用环境变量）
 * @deprecated 建议使用 getApiKeysConfig() 获取包含用户配置的 API Keys
 */
export const apiKeys = envApiKeys;

/**
 * 模型配置
 */
export const models = {
  /** 文本生成模型 */
  text: {
    /** DeepSeek模型 */
    deepseek: 'deepseek-chat',
    /** 通义千问模型（已废弃，保留以兼容旧配置） */
    qwen: 'qwen-plus',
    /** 内容分析专用模型 */
    analyze: 'deepseek-r1-250528',
  },
  
  /** 图片生成模型 */
  image: {
    /** 豆包图片模型 */
    doubao: 'doubao-seedream-4-5-251128',
  },
} as const;

/**
 * 服务配置
 */
export const serviceConfig = {
  /** DeepSeek服务配置 */
  deepseek: {
    baseUrl: 'https://api.deepseek.com',
    defaultTemperature: 0.7,
    // defaultMaxTokens 已移除，不再设置默认限制，让模型根据上下文自动决定
    articleMaxTokens: 6000, // 文章生成专用，支持1500-2500字的完整文章
  },
  /** 通义千问服务配置（已废弃，保留以兼容旧配置） */
  qwen: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultTemperature: 0.7,
    // defaultMaxTokens 已移除，不再设置默认限制，让模型根据上下文自动决定
    articleMaxTokens: 6000, // 文章生成专用，支持1500-2500字的完整文章
  },
  
  /** 豆包图片生成服务配置 */
  doubao: {
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
  },
  
  /** 默认参数配置 */
  defaults: {
    temperature: {
      technical: 0.4,    // 技术型内容
      creative: 0.7,     // 创意型内容
      general: 0.6,      // 通用型内容
      analyze: 0.3,      // 内容分析
    },
    maxTokens: 2000,
    timeout: {
      text: 180000,      // 文本生成超时（3分钟）
      image: 60000,      // 图片生成超时（1分钟）
      analyze: 60000,    // 内容分析超时（1分钟）
    },
  },
} as const;

/**
 * 检查API Key是否配置
 */
export function hasApiKey(service: 'deepseek' | 'qwen' | 'doubao'): boolean {
  return !!apiKeys[service];
}

/**
 * 获取当前使用的服务类型
 */
export function getActiveService(): {
  text: 'deepseek' | 'qwen';
  image: 'doubao';
} {
  // 优先使用 DeepSeek，如果没有则使用 Qwen（兼容旧配置）
  return {
    text: hasApiKey('deepseek') ? 'deepseek' : 'qwen',
    image: 'doubao',
  };
}

/**
 * 获取文本生成模型名称
 */
export function getTextModel(service: 'deepseek' | 'qwen' = 'deepseek'): string {
  return models.text[service];
}

/**
 * 获取图片生成模型名称
 */
export function getImageModel(service: 'doubao' = 'doubao'): string {
  return models.image[service];
}

/**
 * LLM服务实现
 * - 文本生成：DeepSeek（优先）或通义千问（Qwen，已废弃）
 * - 图片生成：豆包（Doubao）
 */

import OpenAI from 'openai';
import { apiKeys, serviceConfig, getTextModel, getImageModel } from '@/config/llm-config';

// 消息类型定义
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// 文本生成服务接口
export interface TextLLMService {
  invoke(
    messages: LLMMessage[],
    options?: { model?: string; temperature?: number; max_tokens?: number }
  ): Promise<{ content: string }>;
}

// 图片生成服务接口
export interface ImageLLMService {
  generate(options: {
    prompt: string;
    size?: string;
    watermark?: boolean;
    responseFormat?: string;
  }): Promise<any>;
  getResponseHelper(response: any): {
    success: boolean;
    imageUrls: string[];
    errorMessages: string[];
  };
}

/**
 * DeepSeek服务实现（使用OpenAI兼容客户端）
 */
class DeepSeekService implements TextLLMService {
  private client: OpenAI;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || apiKeys.deepseek || '';
    if (!this.apiKey) {
      console.warn('DeepSeek API Key未配置，将尝试使用默认配置');
    }

    // 初始化OpenAI兼容客户端
    this.client = new OpenAI({
      baseURL: serviceConfig.deepseek.baseUrl,
      apiKey: this.apiKey,
    });
  }

  async invoke(
    messages: LLMMessage[],
    options?: { model?: string; temperature?: number; max_tokens?: number }
  ): Promise<{ content: string }> {
    if (!this.apiKey) {
      throw new Error('DeepSeek API Key未配置，请设置 DEEPSEEK_API_KEY 环境变量');
    }

    try {
      // 转换消息格式为OpenAI格式
      const openaiMessages = messages.map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content,
      }));

      // 使用OpenAI兼容的chat.completions.create方法
      const requestOptions: any = {
        model: options?.model || getTextModel('deepseek'),
        messages: openaiMessages,
        temperature: options?.temperature || serviceConfig.deepseek.defaultTemperature,
      };

      // 只有在明确指定 max_tokens 时才设置，否则让模型自动决定
      if (options?.max_tokens !== undefined) {
        requestOptions.max_tokens = options.max_tokens;
      }

      const completion = await this.client.chat.completions.create(requestOptions);

      // 解析响应 - OpenAI兼容格式
      const content = completion.choices[0]?.message?.content;
      if (!content) {
        console.error('DeepSeek响应数据:', JSON.stringify(completion, null, 2));
        throw new Error('DeepSeek API响应格式异常：未找到内容');
      }

      return { content };
    } catch (error) {
      console.error('DeepSeek调用失败:', error);
      throw error;
    }
  }
}

/**
 * 通义千问服务实现（已废弃，保留以兼容旧配置）
 */
class QwenService implements TextLLMService {
  private client: OpenAI;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || apiKeys.qwen || '';
    if (!this.apiKey) {
      console.warn('通义千问API Key未配置，将尝试使用默认配置');
    }

    // 初始化OpenAI兼容客户端
    this.client = new OpenAI({
      baseURL: serviceConfig.qwen.baseUrl,
      apiKey: this.apiKey,
    });
  }

  async invoke(
    messages: LLMMessage[],
    options?: { model?: string; temperature?: number; max_tokens?: number }
  ): Promise<{ content: string }> {
    if (!this.apiKey) {
      throw new Error('通义千问API Key未配置，请设置 DASHSCOPE_API_KEY 或 QWEN_API_KEY 环境变量');
    }

    try {
      // 转换消息格式为OpenAI格式
      const openaiMessages = messages.map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content,
      }));

      // 使用OpenAI兼容的chat.completions.create方法
      const requestOptions: any = {
        model: options?.model || getTextModel('qwen'),
        messages: openaiMessages,
        temperature: options?.temperature || serviceConfig.qwen.defaultTemperature,
      };

      // 只有在明确指定 max_tokens 时才设置，否则让模型自动决定
      if (options?.max_tokens !== undefined) {
        requestOptions.max_tokens = options.max_tokens;
      }

      const completion = await this.client.chat.completions.create(requestOptions);

      // 解析响应 - OpenAI兼容格式
      const content = completion.choices[0]?.message?.content;
      if (!content) {
        console.error('通义千问响应数据:', JSON.stringify(completion, null, 2));
        throw new Error('通义千问API响应格式异常：未找到内容');
      }

      return { content };
    } catch (error) {
      console.error('通义千问调用失败:', error);
      throw error;
    }
  }
}

/**
 * 豆包图片生成服务实现（使用OpenAI兼容API）
 */
class DoubaoImageService implements ImageLLMService {
  private baseUrl: string;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || apiKeys.doubao || '';
    this.baseUrl = serviceConfig.doubao.baseUrl;
    if (!this.apiKey) {
      console.warn('豆包API Key未配置，图片生成功能可能不可用');
    }
  }

  async generate(options: {
    prompt: string;
    size?: string;
    watermark?: boolean;
    responseFormat?: string;
  }): Promise<any> {
    if (!this.apiKey) {
      throw new Error('豆包API Key未配置，请设置 ARK_API_KEY 或 DOUBAO_API_KEY 环境变量');
    }

    try {
      // 使用OpenAI兼容的API端点
      const response = await fetch(`${this.baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: getImageModel('doubao'),
          prompt: options.prompt,
          size: options.size || '2K',
          response_format: options.responseFormat || 'url',
          watermark: options.watermark !== undefined ? options.watermark : false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`豆包图片生成API调用失败: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('豆包图片生成失败:', error);
      throw error;
    }
  }

  getResponseHelper(response: any): {
    success: boolean;
    imageUrls: string[];
    errorMessages: string[];
  } {
    try {
      if (response.data && Array.isArray(response.data)) {
        const imageUrls = response.data
          .map((item: any) => item.url || item.b64_json)
          .filter(Boolean);
        return {
          success: imageUrls.length > 0,
          imageUrls,
          errorMessages: [],
        };
      }
      return {
        success: false,
        imageUrls: [],
        errorMessages: ['响应格式异常'],
      };
    } catch (error) {
      return {
        success: false,
        imageUrls: [],
        errorMessages: [error instanceof Error ? error.message : '未知错误'],
      };
    }
  }
}

/**
 * 获取文本生成服务（优先使用DeepSeek，如果没有则使用Qwen以兼容旧配置）
 * @param apiKeysConfig 可选的API Key配置，如果提供则优先使用
 */
export function getTextLLMService(apiKeysConfig?: {
  deepseek?: string;
  qwen?: string;
}): TextLLMService {
  // 优先使用传入的配置
  const deepseekKey = apiKeysConfig?.deepseek || apiKeys.deepseek;
  const qwenKey = apiKeysConfig?.qwen || apiKeys.qwen;
  
  // 优先使用 DeepSeek
  if (deepseekKey) {
    return new DeepSeekService(deepseekKey);
  }
  
  // 如果没有 DeepSeek，尝试使用 Qwen（兼容旧配置）
  if (qwenKey) {
    console.warn('使用通义千问服务（已废弃），建议配置 DEEPSEEK_API_KEY 使用 DeepSeek');
    return new QwenService(qwenKey);
  }
  
  throw new Error('文本生成服务未配置，请设置 DEEPSEEK_API_KEY 环境变量（推荐）或 DASHSCOPE_API_KEY/QWEN_API_KEY（已废弃），或在设置中配置 API Key');
}

/**
 * 获取图片生成服务（使用豆包）
 * @param apiKeysConfig 可选的API Key配置，如果提供则优先使用
 */
export function getImageLLMService(apiKeysConfig?: {
  doubao?: string;
  ark?: string;
}): ImageLLMService {
  const doubaoKey = apiKeysConfig?.doubao || apiKeysConfig?.ark || apiKeys.doubao;
  
  if (!doubaoKey) {
    throw new Error('豆包API Key未配置，请设置 ARK_API_KEY 或 DOUBAO_API_KEY 环境变量，或在设置中配置 API Key');
  }
  
  return new DoubaoImageService(doubaoKey);
}

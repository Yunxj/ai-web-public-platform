/**
 * API请求和响应类型定义
 */

import { Message, Conversation, ImagePosition } from './index';
import type { ImagePlan } from './index';

// ========== 对话相关 API ==========

export interface CreateConversationRequest {
  title: string;
  contentType: string;
  metadata?: Record<string, unknown>;
}

export interface CreateConversationResponse {
  conversation: Conversation;
}

export interface GetConversationsResponse {
  conversations: Conversation[];
}

export interface AddMessageRequest {
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, unknown>;
}

export interface AddMessageResponse {
  message: {
    id: string;
    conversationId: string;
    role: string;
    content: string;
    createdAt: string;
  };
}

// ========== 搜索相关 API ==========

export interface SearchRequest {
  query: string;
  count?: number;
  searchType?: 'web' | 'image';
}

export interface SearchResult {
  title: string;
  url: string;
  snippet?: string;
}

export interface SearchResponse {
  success: boolean;
  results: SearchResult[];
  summary?: string;
  error?: string;
}

// ========== 文章生成相关 API ==========

export interface GenerateArticleRequest {
  message: string;
  contentType: string;
  context?: Message[];
}

export interface StreamChunk {
  content?: string;
  error?: string;
}

// ========== 图片生成相关 API ==========

export interface AnalyzeContentRequest {
  content: string;
}

export interface AnalyzeContentResponse {
  success: boolean;
  plan?: ImagePlan;
  error?: string;
}

export interface ImageRequest {
  prompt: string;
  position: string;
}

export interface BatchGenerateImagesRequest {
  images: ImageRequest[];
  size?: string;
  isCover?: boolean;
}

export interface BatchGenerateImagesResponse {
  success: boolean;
  images: ImagePosition[];
  totalRequested: number;
  successCount: number;
  failedCount: number;
  error?: string;
}

export interface GenerateImageRequest {
  prompt: string;
  size?: string;
  watermark?: boolean;
}

export interface GenerateImageResponse {
  success: boolean;
  url?: string;
  error?: string;
}

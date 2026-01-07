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
  integratedData?: string; // 整合后的资料
}

export interface StreamChunk {
  content?: string;
  error?: string;
}

// ========== 资料分析相关 API ==========

export interface AnalyzeSearchResultsRequest {
  query: string;
  searchResults: SearchResult[];
  searchSummary?: string;
}

export interface AnalyzeSearchResultsResponse {
  success: boolean;
  analysis?: string; // 分析结果（关键信息、价值点、相关性等）
  error?: string;
}

// ========== 资料整合相关 API ==========

export interface IntegrateAnalysisRequest {
  query: string;
  analysisData: string; // 分析结果
}

export interface IntegrateAnalysisResponse {
  success: boolean;
  integratedData?: string; // 整合后的结构化资料
  error?: string;
}

// ========== 专家排版相关 API ==========

export interface ExpertLayoutRequest {
  content: string; // 生成的文章内容
}

export interface ExpertLayoutResponse {
  success: boolean;
  formattedContent?: string; // 排版后的文章内容
  error?: string;
}

// ========== 图片生成相关 API ==========

export interface AnalyzeContentRequest {
  content: string;
  searchData?: {
    results: SearchResult[];
    summary?: string;
  };
  analysisData?: string; // 分析结果
  integratedData?: string; // 整合后的资料
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

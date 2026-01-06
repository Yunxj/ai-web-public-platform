/**
 * 通用类型定义
 */

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface Conversation {
  id: string;
  title: string;
  contentType: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ImagePosition {
  position: string;
  url: string;
}

export interface ImagePlan {
  count: number;
  images: Array<{
    position: string;
    prompt: string;
  }>;
}

export type { ImagePlan as ImagePlanType };

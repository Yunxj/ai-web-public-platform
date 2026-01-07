/**
 * 内容排版 API - 使用 Wenyan 进行排版
 * POST /api/format-content
 */

import { NextRequest, NextResponse } from 'next/server';
import { formatWithWenyan } from '@/lib/wenyan-wrapper';
import type { WenyanOptions } from '@/lib/wenyan-wrapper';

export const runtime = 'nodejs';

export interface FormatContentRequest {
  markdown: string;
  theme?: string;
  highlightTheme?: string;
  isMacStyle?: boolean;
}

export interface FormatContentResponse {
  success: boolean;
  html?: string;
  title?: string;
  cover?: string;
  description?: string;
  error?: string;
}

/**
 * 使用 Wenyan 格式化 Markdown 内容
 */
export async function POST(request: NextRequest) {
  try {
    const body: FormatContentRequest = await request.json();
    const { markdown, theme, highlightTheme, isMacStyle } = body;

    if (!markdown) {
      return NextResponse.json(
        { success: false, error: 'Markdown 内容不能为空' },
        { status: 400 }
      );
    }

    console.log('开始使用 Wenyan 排版，内容长度:', markdown.length);

    try {
      const options: WenyanOptions = {
        theme: theme || 'default',
        highlightTheme: highlightTheme || 'github',
        isMacStyle: isMacStyle ?? true,
      };

      const result = await formatWithWenyan(markdown, options);

      console.log('Wenyan 排版完成');

      const response: FormatContentResponse = {
        success: true,
        html: result.content,
        title: result.title,
        cover: result.cover,
        description: result.description,
      };

      return NextResponse.json(response);
    } catch (error) {
      console.error('Wenyan 排版失败:', error);
      
      const response: FormatContentResponse = {
        success: false,
        error: error instanceof Error ? error.message : '排版失败',
      };

      return NextResponse.json(response, { status: 500 });
    }
  } catch (error) {
    console.error('格式化内容错误:', error);
    const errorResponse: FormatContentResponse = {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

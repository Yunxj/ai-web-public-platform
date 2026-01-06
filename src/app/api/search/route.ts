import { NextRequest, NextResponse } from 'next/server';
import { SearchClient, Config } from 'coze-coding-dev-sdk';
import { SearchRequest, SearchResponse } from '@/types/api';

export const runtime = 'nodejs';

/**
 * 搜索API - 集成联网搜索功能
 */
export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json();
    const { query, count = 5, searchType = 'web' } = body;

    if (!query) {
      return NextResponse.json(
        { error: '搜索内容不能为空' },
        { status: 400 }
      );
    }

    console.log('执行搜索:', query, '类型:', searchType, '数量:', count);

    const config = new Config();
    const client = new SearchClient(config);

    let response;
    
    if (searchType === 'image') {
      response = await client.imageSearch(query, count);
    } else {
      response = await client.webSearch(query, count);
    }

    console.log('搜索完成，结果数量:', response.web_items?.length || response.image_items?.length);

    const searchResponse: SearchResponse = {
      success: true,
      results: response.web_items || response.image_items || [],
      summary: response.summary || '',
    };

    return NextResponse.json(searchResponse);
  } catch (error) {
    console.error('搜索错误:', error);
    const errorMessage = error instanceof Error ? error.message : '搜索失败';
    console.error('错误详情:', errorMessage);
    const errorResponse: SearchResponse = {
      success: false,
      error: errorMessage,
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

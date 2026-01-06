import { NextRequest, NextResponse } from 'next/server';
import { SearchClient, Config } from 'coze-coding-dev-sdk';

export const runtime = 'nodejs';

/**
 * 测试搜索API
 */
export async function GET(request: NextRequest) {
  try {
    console.log('开始测试搜索...');

    const config = new Config();
    const client = new SearchClient(config);

    const response = await client.webSearch('人工智能', 5);

    console.log('搜索成功，结果数量:', response.web_items?.length);

    return NextResponse.json({
      success: true,
      count: response.web_items?.length || 0,
      summary: response.summary,
      firstResult: response.web_items?.[0] || null,
    });
  } catch (error) {
    console.error('测试失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

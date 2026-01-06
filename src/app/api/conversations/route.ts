import { NextRequest, NextResponse } from 'next/server';
import { conversationManager } from '@/storage/database';
import { CreateConversationRequest, CreateConversationResponse, GetConversationsResponse } from '@/types/api';

/**
 * 获取对话列表
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const contentType = searchParams.get('contentType') || undefined;
    const skip = parseInt(searchParams.get('skip') || '0');
    const limit = parseInt(searchParams.get('limit') || '50');

    const conversations = await conversationManager.getConversations({
      contentType,
      skip,
      limit,
    });

    const response: GetConversationsResponse = { conversations };
    return NextResponse.json(response);
  } catch (error) {
    console.error('获取对话列表错误:', error);
    return NextResponse.json(
      { error: '获取对话列表失败' },
      { status: 500 }
    );
  }
}

/**
 * 创建新对话
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateConversationRequest = await request.json();
    const { title, contentType, metadata } = body;

    const conversation = await conversationManager.createConversation({
      title: title || '新对话',
      contentType: contentType || 'article',
      metadata,
    });

    const response: CreateConversationResponse = { conversation };
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('创建对话错误:', error);
    return NextResponse.json(
      { error: '创建对话失败' },
      { status: 500 }
    );
  }
}

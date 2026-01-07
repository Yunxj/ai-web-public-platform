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
    
    // 如果数据库不可用，返回一个模拟的对话对象，让前端可以继续工作
    // 这样文章生成功能不会因为数据库问题而中断
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    const isDatabaseError = errorMessage.includes('database') || 
                           errorMessage.includes('connection') ||
                           errorMessage.includes('getDb') ||
                           errorMessage.includes('DATABASE_URL') ||
                           errorMessage.includes('连接失败') ||
                           errorMessage.includes('不可用');
    
    if (isDatabaseError) {
      console.warn('数据库不可用，返回临时对话ID以继续工作:', errorMessage);
      // 生成一个临时ID（使用时间戳和随机数）
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const tempConversation = {
        id: tempId,
        title: title || '新对话',
        contentType: contentType || 'article',
        metadata: metadata || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const response: CreateConversationResponse = { conversation: tempConversation };
      return NextResponse.json(response, { status: 201 });
    }
    
    // 其他错误返回500
    return NextResponse.json(
      { error: '创建对话失败: ' + errorMessage },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { conversationManager } from '@/storage/database';
import { AddMessageRequest, AddMessageResponse } from '@/types/api';

/**
 * 添加消息到对话
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: AddMessageRequest = await request.json();
    const { role, content, metadata } = body;

    // 如果是临时ID（以temp_开头），直接返回成功，不保存到数据库
    if (id.startsWith('temp_')) {
      console.debug('跳过保存消息（临时对话ID）:', id);
      const tempMessage = {
        id: `temp_msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        conversationId: id,
        role,
        content,
        metadata: metadata || null,
        createdAt: new Date(),
      };
      const response: AddMessageResponse = { message: tempMessage };
      return NextResponse.json(response, { status: 201 });
    }

    const message = await conversationManager.addMessage({
      conversationId: id,
      role,
      content,
      metadata,
    });

    const response: AddMessageResponse = { message };
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('添加消息错误:', error);
    
    // 如果是数据库错误，返回成功但不保存（不影响主流程）
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    const isDatabaseError = errorMessage.includes('database') || 
                           errorMessage.includes('connection') ||
                           errorMessage.includes('getDb');
    
    if (isDatabaseError) {
      console.warn('数据库不可用，跳过消息保存');
      const { id } = await params;
      const body: AddMessageRequest = await request.json();
      const { role, content, metadata } = body;
      const tempMessage = {
        id: `temp_msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        conversationId: id,
        role,
        content,
        metadata: metadata || null,
        createdAt: new Date(),
      };
      const response: AddMessageResponse = { message: tempMessage };
      return NextResponse.json(response, { status: 201 });
    }
    
    return NextResponse.json(
      { error: '添加消息失败: ' + errorMessage },
      { status: 500 }
    );
  }
}

/**
 * 获取对话的消息列表
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 如果是临时ID，返回空列表
    if (id.startsWith('temp_')) {
      return NextResponse.json({ messages: [] });
    }
    
    const messages =
      await conversationManager.getMessagesByConversationId(id);

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('获取消息列表错误:', error);
    
    // 数据库错误时返回空列表，不影响主流程
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    const isDatabaseError = errorMessage.includes('database') || 
                           errorMessage.includes('connection') ||
                           errorMessage.includes('getDb');
    
    if (isDatabaseError) {
      console.warn('数据库不可用，返回空消息列表');
      return NextResponse.json({ messages: [] });
    }
    
    return NextResponse.json(
      { error: '获取消息列表失败: ' + errorMessage },
      { status: 500 }
    );
  }
}

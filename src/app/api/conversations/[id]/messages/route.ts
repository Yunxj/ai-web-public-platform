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
    return NextResponse.json(
      { error: '添加消息失败' },
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
    const messages =
      await conversationManager.getMessagesByConversationId(id);

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('获取消息列表错误:', error);
    return NextResponse.json(
      { error: '获取消息列表失败' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { conversationManager } from '@/storage/database';

/**
 * 获取对话详情（包含消息）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { conversation, messages } =
      await conversationManager.getConversationWithMessages(id);

    if (!conversation) {
      return NextResponse.json(
        { error: '对话不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ conversation, messages });
  } catch (error) {
    console.error('获取对话详情错误:', error);
    return NextResponse.json(
      { error: '获取对话详情失败' },
      { status: 500 }
    );
  }
}

/**
 * 更新对话
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, contentType, metadata } = body;

    const conversation = await conversationManager.updateConversation(id, {
      title,
      contentType,
      metadata,
    });

    if (!conversation) {
      return NextResponse.json(
        { error: '对话不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('更新对话错误:', error);
    return NextResponse.json(
      { error: '更新对话失败' },
      { status: 500 }
    );
  }
}

/**
 * 删除对话
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await conversationManager.deleteConversation(id);

    if (!success) {
      return NextResponse.json(
        { error: '对话不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除对话错误:', error);
    return NextResponse.json(
      { error: '删除对话失败' },
      { status: 500 }
    );
  }
}

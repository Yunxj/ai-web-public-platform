import { useState, useCallback } from 'react';

export function useConversation() {
  const [conversationId, setConversationId] = useState<string | null>(null);

  const createConversation = useCallback(async (
    title: string,
    contentType: string
  ): Promise<string | null> => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.slice(0, 50) + (title.length > 50 ? '...' : ''),
          contentType,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const id = data.conversation.id;
        setConversationId(id);
        return id;
      }
      return null;
    } catch (error) {
      console.error('创建对话失败:', error);
      return null;
    }
  }, []);

  const saveMessage = useCallback(async (
    role: 'user' | 'assistant',
    content: string
  ): Promise<void> => {
    if (!conversationId) return;

    try {
      await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role,
          content,
        }),
      });
    } catch (error) {
      console.error('保存消息失败:', error);
    }
  }, [conversationId]);

  return {
    conversationId,
    createConversation,
    saveMessage,
  };
}

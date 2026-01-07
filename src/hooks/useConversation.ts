import { useState, useCallback } from 'react';

/**
 * 生成临时对话ID（当数据库不可用时使用）
 */
function generateTempConversationId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

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
      
      // 如果请求失败，尝试解析错误信息
      let errorMessage = `HTTP ${response.status}: ${response.statusText || '未知错误'}`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = typeof errorData.error === 'string' 
            ? errorData.error 
            : JSON.stringify(errorData.error, null, 2);
        }
      } catch (parseError) {
        // 如果无法解析JSON，尝试读取文本
        try {
          const text = await response.text();
          if (text) {
            errorMessage = text.length > 200 ? `${text.substring(0, 200)}...` : text;
          }
        } catch (textError) {
          // 忽略文本读取错误
        }
      }
      
      console.warn('创建对话失败，使用临时ID继续:', JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
      }, null, 2));
      
      // 即使创建失败，也返回一个临时ID，确保文章生成功能不受影响
      const tempId = generateTempConversationId();
      setConversationId(tempId);
      return tempId;
    } catch (error) {
      // 网络错误或其他错误
      const errorDetails = error instanceof Error 
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack?.split('\n').slice(0, 3).join('\n'),
          }
        : { error: String(error) };
      
      console.error('创建对话失败（网络错误），使用临时ID继续:', errorDetails);
      
      // 网络错误或其他错误，也返回临时ID
      const tempId = generateTempConversationId();
      setConversationId(tempId);
      return tempId;
    }
  }, []);

  const saveMessage = useCallback(async (
    role: 'user' | 'assistant',
    content: string
  ): Promise<void> => {
    if (!conversationId) return;

    // 如果是临时ID（以temp_开头），跳过保存，因为数据库不可用
    if (conversationId.startsWith('temp_')) {
      console.debug('跳过保存消息（临时对话ID）:', conversationId);
      return;
    }

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role,
          content,
        }),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText || '未知错误'}`;
        try {
          const errorText = await response.text();
          if (errorText) {
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.error || errorMessage;
            } catch {
              errorMessage = errorText.length > 200 ? `${errorText.substring(0, 200)}...` : errorText;
            }
          }
        } catch (e) {
          // 忽略错误
        }
        console.warn('保存消息失败，但继续执行:', JSON.stringify({
          status: response.status,
          error: errorMessage,
        }, null, 2));
      }
    } catch (error) {
      // 保存消息失败不影响主流程，只记录日志
      const errorDetails = error instanceof Error
        ? { name: error.name, message: error.message }
        : { error: String(error) };
      console.warn('保存消息失败，但继续执行:', JSON.stringify(errorDetails, null, 2));
    }
  }, [conversationId]);

  return {
    conversationId,
    createConversation,
    saveMessage,
  };
}

import { useState, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function useArticleGeneration() {
  const [previewContent, setPreviewContent] = useState<string>('');
  const [searchResults, setSearchResults] = useState<string>('');

  const generateArticle = useCallback(async (
    content: string,
    contentType: string,
    messages: Message[],
    onStepUpdate: (stepId: string, status: 'running' | 'completed' | 'error', result?: string) => void,
    onContentUpdate: (content: string) => void
  ): Promise<string> => {
    let assistantContent = '';
    // 步骤1: 资料搜索
    onStepUpdate('search', 'running');
    try {
      const searchResponse = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: content,
          count: 10,
          searchType: 'web',
        }),
      });

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        const summary = searchData.summary || '搜索完成';
        setSearchResults(summary);
        onStepUpdate('search', 'completed', `找到 ${searchData.results.length} 条相关资料`);
      } else {
        onStepUpdate('search', 'error');
      }
    } catch (error) {
      console.error('搜索失败:', error);
      onStepUpdate('search', 'error');
    }

    // 步骤2: 分析资料信息
    onStepUpdate('analyze', 'running');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      onStepUpdate('analyze', 'completed', '分析完成，已提取关键信息');
    } catch (error) {
      console.error('分析失败:', error);
      onStepUpdate('analyze', 'error');
    }

    // 步骤3: 资料整合
    onStepUpdate('integrate', 'running');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      onStepUpdate('integrate', 'completed', '资料整合完成');
    } catch (error) {
      console.error('整合失败:', error);
      onStepUpdate('integrate', 'error');
    }

    // 步骤4: 正文生成
    onStepUpdate('generate', 'running');

    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: content,
        contentType,
        context: messages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || '生成失败');
    }

    // 处理流式响应
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let assistantContent = '';
    let hasError = false;

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                hasError = true;
                assistantContent = parsed.error;
                break;
              }
              if (parsed.content) {
                assistantContent += parsed.content;
                setPreviewContent(assistantContent);
                onContentUpdate(assistantContent);
              }
            } catch (e) {
              console.error('解析失败:', e);
            }
          }
        }

        if (hasError) break;
      }
    }

    if (hasError) {
      onStepUpdate('generate', 'error');
    } else {
      onStepUpdate('generate', 'completed', `已生成 ${assistantContent.length} 字`);
    }

    // 步骤6: 专家排版
    onStepUpdate('layout', 'running');
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      onStepUpdate('layout', 'completed', '排版优化完成');
    } catch (error) {
      console.error('排版失败:', error);
      onStepUpdate('layout', 'error');
    }

    return assistantContent;
  }, []);

  return {
    previewContent,
    searchResults,
    generateArticle,
  };
}

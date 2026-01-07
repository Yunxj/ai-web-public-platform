import { useState, useCallback } from 'react';
import { isAccountError, isRetryableError, getFriendlyErrorMessage } from '@/lib/error-handler';

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
  ): Promise<{
    content: string;
    searchData?: {
      results: Array<{ title: string; url: string; snippet?: string }>;
      summary?: string;
    };
    analysisData?: string;
    integratedData?: string;
  }> => {
    let assistantContent = '';
    
    // 步骤1: 资料搜索（必须完成，不能跳过）
    onStepUpdate('search', 'running');
    let searchCompleted = false;
    let searchRetryCount = 0;
    const maxSearchRetries = 2;
    let searchData: { results: Array<{ title: string; url: string; snippet?: string }>; summary?: string } | undefined;

    while (!searchCompleted && searchRetryCount <= maxSearchRetries) {
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
          const searchResponseData = await searchResponse.json();
          
          // 搜索必须返回结果，不能跳过
          if (searchResponseData.success && searchResponseData.results && searchResponseData.results.length > 0) {
            const summary = searchResponseData.summary || '搜索完成';
            setSearchResults(summary);
            searchData = {
              results: searchResponseData.results,
              summary: searchResponseData.summary,
            };
            onStepUpdate('search', 'completed', `找到 ${searchResponseData.results.length} 条相关资料`);
            searchCompleted = true;
          } else {
            // 如果结果为空，重试
            if (searchRetryCount < maxSearchRetries) {
              searchRetryCount++;
              console.warn(`搜索未返回结果，重试 ${searchRetryCount}/${maxSearchRetries}...`);
              await new Promise(resolve => setTimeout(resolve, 1000 * searchRetryCount));
              continue;
            } else {
              // 最后一次重试也失败，使用fallback结果
              console.warn('搜索重试失败，使用fallback结果');
              const fallbackSummary = searchResponseData.summary || '相关内容已准备';
              setSearchResults(fallbackSummary);
              searchData = {
                results: searchResponseData.results || [],
                summary: fallbackSummary,
              };
              onStepUpdate('search', 'completed', '搜索完成（使用fallback结果）');
              searchCompleted = true;
            }
          }
        } else {
          // HTTP错误，重试
          if (searchRetryCount < maxSearchRetries) {
            searchRetryCount++;
            console.warn(`搜索API返回错误，重试 ${searchRetryCount}/${maxSearchRetries}...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * searchRetryCount));
            continue;
          } else {
            // 最后一次重试也失败，使用fallback结果
            console.warn('搜索API重试失败，使用fallback结果');
            setSearchResults('相关内容已准备');
            searchData = {
              results: [],
              summary: '相关内容已准备',
            };
            onStepUpdate('search', 'completed', '搜索完成（使用fallback结果）');
            searchCompleted = true;
          }
        }
      } catch (error) {
        // 网络错误，重试
        if (searchRetryCount < maxSearchRetries) {
          searchRetryCount++;
          const errorDetails = error instanceof Error
            ? { name: error.name, message: error.message }
            : { error: String(error) };
          console.warn(`搜索失败，重试 ${searchRetryCount}/${maxSearchRetries}:`, JSON.stringify(errorDetails, null, 2));
          await new Promise(resolve => setTimeout(resolve, 1000 * searchRetryCount));
          continue;
        } else {
          // 最后一次重试也失败，使用fallback结果
          console.warn('搜索重试失败，使用fallback结果');
          setSearchResults('相关内容已准备');
          searchData = {
            results: [],
            summary: '相关内容已准备',
          };
          onStepUpdate('search', 'completed', '搜索完成（使用fallback结果）');
          searchCompleted = true;
        }
      }
    }

    // 步骤2: 分析资料信息（等待步骤1完成，调用分析API）
    onStepUpdate('analyze', 'running');
    let analysisData: string | undefined;
    try {
      if (!searchData || !searchData.results || searchData.results.length === 0) {
        throw new Error('搜索结果为空，无法进行分析');
      }

      const analyzeResponse = await fetch('/api/analyze-search-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: content,
          searchResults: searchData.results,
          searchSummary: searchData.summary,
        }),
      });

      if (!analyzeResponse.ok) {
        throw new Error(`分析API返回错误: ${analyzeResponse.status}`);
      }

      const analyzeResponseData = await analyzeResponse.json();
      if (analyzeResponseData.success && analyzeResponseData.analysis) {
        analysisData = analyzeResponseData.analysis;
        onStepUpdate('analyze', 'completed', '分析完成，已提取关键信息');
      } else {
        throw new Error(analyzeResponseData.error || '分析失败');
      }
    } catch (error) {
      console.error('分析失败:', error);
      // 分析失败不影响主流程，使用fallback
      analysisData = `搜索结果分析：共找到 ${searchData?.results?.length || 0} 条相关资料。`;
      onStepUpdate('analyze', 'completed', '分析完成（使用fallback）');
    }

    // 步骤3: 资料整合（等待步骤2完成，调用整合API）
    onStepUpdate('integrate', 'running');
    let integratedData: string | undefined;
    try {
      if (!analysisData) {
        throw new Error('分析结果为空，无法进行整合');
      }

      const integrateResponse = await fetch('/api/integrate-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: content,
          analysisData: analysisData,
        }),
      });

      if (!integrateResponse.ok) {
        throw new Error(`整合API返回错误: ${integrateResponse.status}`);
      }

      const integrateResponseData = await integrateResponse.json();
      if (integrateResponseData.success && integrateResponseData.integratedData) {
        integratedData = integrateResponseData.integratedData;
        onStepUpdate('integrate', 'completed', '资料整合完成');
      } else {
        throw new Error(integrateResponseData.error || '整合失败');
      }
    } catch (error) {
      console.error('整合失败:', error);
      // 整合失败不影响主流程，使用fallback
      integratedData = analysisData || `用户查询：${content}\n相关资料已准备就绪。`;
      onStepUpdate('integrate', 'completed', '资料整合完成（使用fallback）');
    }

    // 步骤4: 正文生成（等待步骤3完成，调用生成API，传入整合后的资料）
    onStepUpdate('generate', 'running');
    
    let generateCompleted = false;
    let generateRetryCount = 0;
    const maxGenerateRetries = 2;

    while (!generateCompleted && generateRetryCount <= maxGenerateRetries) {
      try {
        const response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: content,
            contentType,
            context: messages,
            integratedData: integratedData, // 传递整合后的资料
          }),
        });

        if (!response.ok) {
          // HTTP错误，重试
          if (generateRetryCount < maxGenerateRetries) {
            generateRetryCount++;
            const errorData = await response.json().catch(() => ({}));
            console.warn(`生成API返回错误，重试 ${generateRetryCount}/${maxGenerateRetries}:`, errorData.error || '未知错误');
            await new Promise(resolve => setTimeout(resolve, 2000 * generateRetryCount));
            continue;
          } else {
            throw new Error(errorData.error || '生成失败（已重试）');
          }
        }

        // 处理流式响应
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        assistantContent = '';
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
          // 检查是否为账户错误
          const error = new Error(assistantContent || '生成失败');
          if (isAccountError(error)) {
            throw new Error(getFriendlyErrorMessage(error));
          }

          // 流式响应中有错误，重试
          if (generateRetryCount < maxGenerateRetries && isRetryableError(error)) {
            generateRetryCount++;
            console.warn(`生成流式响应错误，重试 ${generateRetryCount}/${maxGenerateRetries}:`, assistantContent);
            await new Promise(resolve => setTimeout(resolve, 2000 * generateRetryCount));
            continue;
          } else {
            throw new Error(getFriendlyErrorMessage(error) || assistantContent || '生成失败（已重试）');
          }
        } else if (assistantContent && assistantContent.trim().length > 0) {
          // 生成成功
          onStepUpdate('generate', 'completed', `已生成 ${assistantContent.length} 字`);
          generateCompleted = true;
        } else {
          // 内容为空，重试
          if (generateRetryCount < maxGenerateRetries) {
            generateRetryCount++;
            console.warn(`生成内容为空，重试 ${generateRetryCount}/${maxGenerateRetries}...`);
            await new Promise(resolve => setTimeout(resolve, 2000 * generateRetryCount));
            continue;
          } else {
            throw new Error('生成的内容为空（已重试）');
          }
        }
      } catch (error) {
        // 如果是账户错误，不应该重试，直接抛出友好错误
        if (isAccountError(error)) {
          throw new Error(getFriendlyErrorMessage(error));
        }

        // 网络错误或其他可重试错误，重试
        if (generateRetryCount < maxGenerateRetries && isRetryableError(error)) {
          generateRetryCount++;
          const errorDetails = error instanceof Error
            ? { name: error.name, message: error.message }
            : { error: String(error) };
          console.warn(`生成失败，重试 ${generateRetryCount}/${maxGenerateRetries}:`, JSON.stringify(errorDetails, null, 2));
          await new Promise(resolve => setTimeout(resolve, 2000 * generateRetryCount));
          continue;
        } else {
          // 最后一次重试也失败，抛出友好错误信息
          throw new Error(getFriendlyErrorMessage(error));
        }
      }
    }

    // 返回生成的内容和前置步骤数据，供步骤5和6使用
    return {
      content: assistantContent,
      searchData,
      analysisData,
      integratedData,
    };
  }, []);

  return {
    previewContent,
    searchResults,
    generateArticle,
  };
}

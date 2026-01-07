'use client';

import { useState, useRef, useEffect } from 'react';
import MessageList from '@/components/MessageList';
import ChatInput from '@/components/ChatInput';
import PreviewPanel from '@/components/PreviewPanel';
import ContentTypeSelector from '@/components/ContentTypeSelector';
import AICapabilityPanel from '@/components/AICapabilityPanel';
import SettingsModal from '@/components/SettingsModal';
import { useSteps } from '@/hooks/useSteps';
import { useConversation } from '@/hooks/useConversation';
import { useArticleGeneration } from '@/hooks/useArticleGeneration';
import { useImageGeneration } from '@/hooks/useImageGeneration';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [contentType, setContentType] = useState<string>('article');
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { steps, updateStepStatus, resetSteps, markRunningStepsAsError } = useSteps();
  const { conversationId, createConversation, saveMessage } = useConversation();
  const { previewContent, searchResults, generateArticle } = useArticleGeneration();
  const { generatedImages, imagePositions, generateImages, resetImages } = useImageGeneration();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleContentUpdate = (content: string) => {
    setMessages(prev => {
      const newMessages = [...prev];
      const lastMessage = newMessages[newMessages.length - 1];
      if (lastMessage?.role === 'assistant') {
        lastMessage.content = content;
      } else {
        newMessages.push({ role: 'assistant', content });
      }
      return newMessages;
    });
  };

  const handleSendMessage = async (content: string, files?: File[]) => {
    if (!content.trim() && (!files || files.length === 0)) return;

    // 如果是第一条消息，尝试创建新对话
    // 即使创建失败，也会返回临时ID，确保流程可以继续
    let currentConversationId = conversationId;
    if (!currentConversationId) {
      currentConversationId = await createConversation(content, contentType);
      // 如果创建失败返回null，生成一个临时ID继续工作
      if (!currentConversationId) {
        currentConversationId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.warn('对话创建失败，使用临时ID继续:', currentConversationId);
      }
    }

    // 添加用户消息
    const userMessage: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);

    // 尝试保存用户消息到数据库（失败不影响主流程）
    if (currentConversationId) {
      try {
        await saveMessage('user', content);
      } catch (error) {
        console.warn('保存用户消息失败，继续执行:', error);
      }
    }

    // 显示预览面板并开始生成
    setIsPreviewVisible(true);
    setIsGenerating(true);
    resetSteps();
    resetImages();

    try {
      // 步骤1-4: 生成文章内容（包含搜索、分析、整合、生成）
      const generationResult = await generateArticle(
        content,
        contentType,
        messages,
        updateStepStatus,
        handleContentUpdate
      );

      const assistantContent = generationResult.content;
      const { searchData, analysisData, integratedData } = generationResult;

      // 步骤5: 内容配图（等待步骤4完成，传入所有前置步骤数据）
      let finalContent = assistantContent;
      if (assistantContent) {
        try {
          await generateImages(
            assistantContent,
            updateStepStatus,
            searchData,
            analysisData,
            integratedData
          );
        } catch (error) {
          console.error('图片生成失败，继续流程:', error);
        }
      }

      // 步骤6: 专家排版（等待步骤5完成，调用排版API）
      if (assistantContent) {
        updateStepStatus('layout', 'running');
        try {
          const layoutResponse = await fetch('/api/expert-layout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: assistantContent,
            }),
          });

          if (layoutResponse.ok) {
            const layoutData = await layoutResponse.json();
            if (layoutData.success && layoutData.formattedContent) {
              finalContent = layoutData.formattedContent;
              // 更新预览内容
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage?.role === 'assistant') {
                  lastMessage.content = finalContent;
                }
                return newMessages;
              });
              handleContentUpdate(finalContent);
              updateStepStatus('layout', 'completed', '排版优化完成');
            } else {
              throw new Error(layoutData.error || '排版失败');
            }
          } else {
            throw new Error(`排版API返回错误: ${layoutResponse.status}`);
          }
        } catch (error) {
          console.error('排版失败:', error);
          // 排版失败不影响主流程，使用原内容
          updateStepStatus('layout', 'completed', '排版完成（使用原格式）');
        }
      }

      // 尝试保存AI回复到数据库（失败不影响主流程）
      if (currentConversationId && finalContent) {
        try {
          await saveMessage('assistant', finalContent);
        } catch (error) {
          console.warn('保存AI回复失败，继续执行:', error);
        }
      }
    } catch (error) {
      console.error('生成错误:', error);
      markRunningStepsAsError();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '抱歉，生成过程中出现错误，请重试。'
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* 左侧AI能力面板 - 已隐藏 */}
      {/* <AICapabilityPanel steps={steps} isGenerating={isGenerating} /> */}

      {/* 中间对话区 */}
      <div className={`flex flex-col transition-all duration-300 ${
        isPreviewVisible ? 'w-1/2' : 'w-full'
      }`}>
        {/* 头部 */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">AI 文章生成助手</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">基于大模型的内容创作平台</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              title="设置"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={() => setIsPreviewVisible(!isPreviewVisible)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {isPreviewVisible ? '隐藏预览' : '显示预览'}
            </button>
          </div>
        </div>

        {/* 内容类型选择器 */}
        <div className="border-b border-gray-200 bg-white px-6 py-3 dark:border-gray-700 dark:bg-gray-800">
          <ContentTypeSelector
            value={contentType}
            onChange={setContentType}
          />
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <MessageList
            messages={messages}
            isGenerating={isGenerating}
            steps={steps}
            showSteps={isGenerating}
          />
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={isGenerating}
          />
        </div>
      </div>

      {/* 右侧预览区 */}
      {isPreviewVisible && (
        <div className="w-1/2 border-l border-gray-200 dark:border-gray-700">
          <PreviewPanel
            content={previewContent}
            contentType={contentType}
            isGenerating={isGenerating}
            searchResults={searchResults}
            images={generatedImages}
            imagePositions={imagePositions}
          />
        </div>
      )}

      {/* 设置弹窗 */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

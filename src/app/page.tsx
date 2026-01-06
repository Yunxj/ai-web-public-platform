'use client';

import { useState, useRef, useEffect } from 'react';
import MessageList from '@/components/MessageList';
import ChatInput from '@/components/ChatInput';
import PreviewPanel from '@/components/PreviewPanel';
import ContentTypeSelector from '@/components/ContentTypeSelector';
import AICapabilityPanel from '@/components/AICapabilityPanel';
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

    // 如果是第一条消息，创建新对话
    let currentConversationId = conversationId;
    if (!currentConversationId) {
      currentConversationId = await createConversation(content, contentType);
    }

    // 添加用户消息
    const userMessage: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);

    // 保存用户消息到数据库
    if (currentConversationId) {
      await saveMessage('user', content);
    }

    // 显示预览面板并开始生成
    setIsPreviewVisible(true);
    setIsGenerating(true);
    resetSteps();
    resetImages();

    try {
      // 生成文章内容
      const assistantContent = await generateArticle(
        content,
        contentType,
        messages,
        updateStepStatus,
        handleContentUpdate
      );

      // 步骤5: 内容配图
      if (assistantContent) {
        try {
          await generateImages(assistantContent, updateStepStatus);
        } catch (error) {
          console.error('图片生成失败，继续流程:', error);
        }
      }

      // 保存AI回复到数据库
      if (currentConversationId && assistantContent) {
        await saveMessage('assistant', assistantContent);
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
          <button
            onClick={() => setIsPreviewVisible(!isPreviewVisible)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {isPreviewVisible ? '隐藏预览' : '显示预览'}
          </button>
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
    </div>
  );
}

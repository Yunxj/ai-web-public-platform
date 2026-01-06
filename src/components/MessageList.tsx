import { MessageBubble } from './MessageBubble';
import AIStepsCard from './AIStepsCard';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  icon: string;
  result?: string;
  details?: string;
}

interface MessageListProps {
  messages: Message[];
  isGenerating: boolean;
  steps?: AIStep[];
  showSteps?: boolean;
}

export default function MessageList({ messages, isGenerating, steps = [], showSteps = false }: MessageListProps) {
  return (
    <div className="space-y-4">
      {messages.length === 0 && !isGenerating && !showSteps && (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <svg className="h-10 w-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            开始创作您的文章
          </h2>
          <p className="max-w-md text-gray-600 dark:text-gray-400">
            输入您的文章主题或需求，AI 将为您生成高质量的内容。支持公众号文章、海报、Word 等多种格式。
          </p>
        </div>
      )}

      {messages.map((message, index) => (
        <MessageBubble key={index} message={message} />
      ))}

      {/* AI步骤卡片 */}
      {showSteps && steps.length > 0 && (
        <AIStepsCard steps={steps} />
      )}

      {/* 生成中提示 */}
      {isGenerating && !showSteps && (
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex items-center gap-1 rounded-2xl rounded-tl-none bg-gray-100 px-4 py-3 dark:bg-gray-700">
            <div className="flex gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></span>
              <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0.2s' }}></span>
              <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0.4s' }}></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

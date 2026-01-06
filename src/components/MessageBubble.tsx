interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[80%] gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
        {/* 头像 */}
        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
          isUser
            ? 'bg-gradient-to-br from-green-400 to-blue-500'
            : 'bg-gradient-to-br from-blue-500 to-purple-600'
        }`}>
          {isUser ? (
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )}
        </div>

        {/* 消息内容 */}
        <div className={`rounded-2xl px-4 py-3 ${
          isUser
            ? 'rounded-tr-none bg-blue-600 text-white'
            : 'rounded-tl-none bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white'
        }`}>
          <div className="whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </div>
        </div>
      </div>
    </div>
  );
}

interface AIStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  icon: string;
  result?: string;
}

interface AICapabilityPanelProps {
  steps: AIStep[];
  isGenerating: boolean;
}

export default function AICapabilityPanel({ steps, isGenerating }: AICapabilityPanelProps) {
  return (
    <div className="flex h-screen w-72 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {/* 头部 */}
      <div className="border-b border-gray-200 px-4 py-4 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">AI 能力</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">智能生成工作流</p>
          </div>
        </div>
      </div>

      {/* 步骤列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-3">
          {steps.map((step, index) => (
            <StepCard key={step.id} step={step} index={index} />
          ))}
        </div>
      </div>

      {/* 底部状态 */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          {isGenerating ? (
            <>
              <div className="h-2 w-2 animate-pulse rounded-full bg-blue-600"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                AI 正在生成中...
              </span>
            </>
          ) : (
            <>
              <div className="h-2 w-2 rounded-full bg-green-600"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                准备就绪
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface StepCardProps {
  step: AIStep;
  index: number;
}

function StepCard({ step, index }: StepCardProps) {
  const getStatusIcon = () => {
    switch (step.status) {
      case 'pending':
        return (
          <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-300 text-xs font-medium text-gray-400 dark:border-gray-600 dark:text-gray-500">
            {index + 1}
          </div>
        );
      case 'running':
        return (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600">
            <svg className="h-3 w-3 animate-spin text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        );
      case 'completed':
        return (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600">
            <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600">
            <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
    }
  };

  const getBorderColor = () => {
    switch (step.status) {
      case 'pending':
        return 'border-gray-200 dark:border-gray-700';
      case 'running':
        return 'border-blue-500';
      case 'completed':
        return 'border-green-500';
      case 'error':
        return 'border-red-500';
    }
  };

  return (
    <div className={`rounded-lg border-2 bg-white p-3 transition-all ${getBorderColor()} dark:bg-gray-800`}>
      <div className="flex items-start gap-3">
        {/* 状态图标 */}
        <div className="mt-0.5">{getStatusIcon()}</div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">{step.icon}</span>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {step.title}
            </h3>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
            {step.description}
          </p>
          
          {/* 进度条（仅运行中显示） */}
          {step.status === 'running' && (
            <div className="mt-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div className="h-full w-full animate-pulse bg-blue-600"></div>
              </div>
            </div>
          )}

          {/* 完成标记和结果 */}
          {step.status === 'completed' && (
            <div className="mt-1.5 space-y-1">
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>已完成</span>
              </div>
              {step.result && (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {step.result}
                </p>
              )}
            </div>
          )}

          {/* 错误信息 */}
          {step.status === 'error' && (
            <div className="mt-1.5 text-xs text-red-600 dark:text-red-400">
              执行失败，请重试
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

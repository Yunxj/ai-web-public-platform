'use client';

import { useState } from 'react';

interface AIStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  icon: string;
  result?: string;
  details?: string;
}

interface AIStepsCardProps {
  steps: AIStep[];
}

export default function AIStepsCard({ steps }: AIStepsCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: AIStep['status']) => {
    switch (status) {
      case 'pending':
        return 'text-gray-400 bg-gray-100 dark:bg-gray-700 dark:text-gray-500';
      case 'running':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400';
      case 'completed':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
      case 'error':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
    }
  };

  const getStatusIcon = (status: AIStep['status']) => {
    switch (status) {
      case 'pending':
        return (
          <div className="h-4 w-4 rounded-full border-2 border-gray-300 dark:border-gray-600"></div>
        );
      case 'running':
        return (
          <svg className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'completed':
        return (
          <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="h-4 w-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
    }
  };

  const completedCount = steps.filter(s => s.status === 'completed').length;
  const runningCount = steps.filter(s => s.status === 'running').length;
  const errorCount = steps.filter(s => s.status === 'error').length;

  const getProgressText = () => {
    if (errorCount > 0) return `${errorCount} 个步骤失败`;
    if (runningCount > 0) return `${runningCount} 个步骤进行中`;
    if (completedCount === steps.length) return '思考完成';
    return `${completedCount}/${steps.length} 完成`;
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* 思考过程卡片 */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {/* 卡片头部 - 始终显示 */}
        <div
          className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2.5">
            {/* AI图标 */}
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>

            {/* 标题和进度 */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  AI 思考过程
                </h3>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  completedCount === steps.length
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : runningCount > 0
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : errorCount > 0
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {getProgressText()}
                </span>
              </div>
            </div>

            {/* 展开/收起图标 */}
            <div
              className={`transform transition-transform duration-300 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            >
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* 详细步骤 - 可展开 */}
        {isExpanded && (
          <div className="border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
            <div className="space-y-2.5">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-start gap-3 rounded-lg p-3 transition-all ${
                    step.status === 'running'
                      ? 'bg-blue-50 dark:bg-blue-900/10'
                      : step.status === 'completed'
                      ? 'bg-green-50 dark:bg-green-900/10'
                      : step.status === 'error'
                      ? 'bg-red-50 dark:bg-red-900/10'
                      : 'bg-white dark:bg-gray-800'
                  }`}
                >
                  {/* 状态图标 */}
                  <div className="flex-shrink-0 mt-0.5">
                    {getStatusIcon(step.status)}
                  </div>

                  {/* 步骤内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{step.icon}</span>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {step.title}
                      </h4>
                    </div>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      {step.description}
                    </p>

                    {/* 结果信息 */}
                    {step.result && step.status === 'completed' && (
                      <div className="mt-2 rounded bg-green-100 px-3 py-1.5 text-xs text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        <span className="font-medium">{step.result}</span>
                      </div>
                    )}

                    {/* 错误信息 */}
                    {step.status === 'error' && (
                      <div className="mt-2 rounded bg-red-100 px-3 py-1.5 text-xs text-red-800 dark:bg-red-900/30 dark:text-red-300">
                        <span className="font-medium">执行失败，请重试</span>
                      </div>
                    )}

                    {/* 进度条（仅运行中） */}
                    {step.status === 'running' && (
                      <div className="mt-2">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                          <div className="h-full animate-pulse bg-blue-600 w-2/3"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

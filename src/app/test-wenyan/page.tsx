'use client';

import { useState } from 'react';

/**
 * 测试 Wenyan 排版效果的页面
 * 访问: http://localhost:5000/test-wenyan
 */
export default function TestWenyanPage() {
  const [theme, setTheme] = useState('default');
  const [highlightTheme, setHighlightTheme] = useState('github');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const themes = [
    { id: 'default', name: '默认' },
    { id: 'orangeheart', name: 'Orange Heart' },
    { id: 'rainbow', name: 'Rainbow' },
    { id: 'lapis', name: 'Lapis' },
    { id: 'pie', name: 'Pie' },
    { id: 'maize', name: 'Maize' },
    { id: 'purple', name: 'Purple' },
    { id: 'phycat', name: '物理猫-薄荷' },
  ];

  const highlightThemes = [
    { id: 'github', name: 'GitHub' },
    { id: 'solarized-light', name: 'Solarized Light' },
    { id: 'atom-one-dark', name: 'Atom One Dark' },
    { id: 'dracula', name: 'Dracula' },
  ];

  const testWenyan = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const url = `/api/test-wenyan?theme=${theme}&highlight=${highlightTheme}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || '测试失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">
          Wenyan 排版测试页面
        </h1>

        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                主题选择
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2"
              >
                {themes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                代码高亮主题
              </label>
              <select
                value={highlightTheme}
                onChange={(e) => setHighlightTheme(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2"
              >
                {highlightThemes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={testWenyan}
            disabled={loading}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? '测试中...' : '测试排版效果'}
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-800">
            <strong>错误：</strong> {error}
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold">排版结果信息</h2>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>主题：</strong> {result.theme}
                </p>
                <p>
                  <strong>代码高亮：</strong> {result.highlightTheme}
                </p>
                {result.result.title && (
                  <p>
                    <strong>标题：</strong> {result.result.title}
                  </p>
                )}
                <p>
                  <strong>HTML 长度：</strong> {result.result.contentLength}{' '}
                  字符
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold">排版预览</h2>
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{
                  __html: result.result.content,
                }}
              />
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold">HTML 源码（前5000字符）</h2>
              <pre className="max-h-96 overflow-auto rounded bg-gray-100 p-4 text-xs">
                <code>{result.result.content.substring(0, 5000)}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

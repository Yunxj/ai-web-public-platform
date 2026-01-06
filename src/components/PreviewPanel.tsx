'use client';

import { useState } from 'react';
import { marked } from 'marked';
import { formatMarkdown } from '@/lib/text-formatter';

interface PreviewPanelProps {
  content: string;
  contentType: string;
  isGenerating: boolean;
  searchResults?: string;
  images?: string[];
  imagePositions?: Array<{ position: string; url: string }>;
}

const contentTypeLabels: Record<string, string> = {
  article: '公众号文章',
  poster: '海报/传单',
  word: 'Word文档',
  xiaohongshu: '小红书',
  ecommerce: '电商文案',
  longimage: '长图/长文',
  decoration: '户型装修',
};

// 公众号HTML样式 - 参考图片风格
const htmlStyles = `
  <style>
    /* 文章容器 */
    .article-container {
      max-width: 1000px; /* 1000px宽，适配响应式 */
      margin: 0 auto;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.8; /* 行高1.8 */
      color: #333; /* 正文文字颜色 */
      font-size: 16px; /* 正文字号 */
      background: #fff; /* 背景色#fff */
    }

    /* 小红书专属样式 - 柔和配色 */
    .article-container.xiaohongshu-style {
      font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(135deg, #faf7f0 0%, #fff 100%);
      padding: 20px;
      border-radius: 16px;
      line-height: 1.9;
    }

    .article-container.xiaohongshu-style h1 {
      background: linear-gradient(135deg, #f5a623 0%, #ff8c42 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-size: 28px;
      text-align: center;
      margin: 20px 0;
    }

    .article-container.xiaohongshu-style h2 {
      border-left: 4px solid #f5a623;
      background: linear-gradient(90deg, rgba(245, 166, 35, 0.05) 0%, transparent 100%);
      padding-left: 12px;
      margin: 25px 0 15px 0;
      font-size: 20px;
    }

    .article-container.xiaohongshu-style p {
      text-indent: 0;
      line-height: 1.9;
      margin: 12px 0;
    }

    .article-container.xiaohongshu-style strong {
      color: #e67e22;
      background: linear-gradient(180deg, transparent 50%, rgba(230, 126, 34, 0.08) 50%);
    }

    .article-container.xiaohongshu-style ul,
    .article-container.xiaohongshu-style ol {
      background: rgba(245, 166, 35, 0.03);
      border-left: 3px solid #f5a623;
    }

    .article-container.xiaohongshu-style blockquote {
      background: linear-gradient(135deg, rgba(245, 166, 35, 0.06) 0%, rgba(255, 140, 66, 0.06) 100%);
      border-left: 5px solid #f5a623;
    }

    /* 小红书话题标签样式 */
    .article-container.xiaohongshu-style .topic-tag {
      color: #e67e22;
      font-weight: 600;
      background: rgba(230, 126, 34, 0.08);
      padding: 4px 8px;
      border-radius: 4px;
      margin: 2px;
      display: inline-block;
    }

    /* 大标题样式 - 参考图片风格 */
    .article-container h1 {
      font-size: 48px; /* 48px */
      font-weight: bold; /* 加粗 */
      text-align: center; /* 居中 */
      margin: 30px 0 20px 0;
      line-height: 1.4;
      color: #d8b5ff; /* 浅紫色 #d8b5ff */
    }

    /* 案例标题样式 - 参考图片风格 */
    .article-container h2 {
      font-size: 24px; /* 24px */
      font-weight: bold; /* 加粗 */
      margin: 20px 0 15px 0; /* 标题上方间距20px，下方间距15px */
      padding-left: 10px; /* 左侧留白10px */
      border-left: 5px solid #7b3bad; /* 左边界5px深紫色垂直线 #7b3bad */
      color: #7b3bad; /* 深紫色 #7b3bad */
      line-height: 1.5;
    }

    /* 小标题样式 - 参考图片风格 */
    .article-container h3 {
      font-size: 18px; /* 18px */
      font-weight: bold; /* 加粗 */
      margin: 20px 0 15px 0; /* 标题上方间距20px，下方间距15px */
      color: #7b3bad; /* 深紫色 #7b3bad */
      line-height: 1.5;
      position: relative;
      padding-left: 0;
    }

    .article-container h3::before {
      content: none;
    }

    /* 段落样式 - 参考图片风格 */
    .article-container p {
      margin: 20px 0; /* 段落间距20px */
      text-align: justify;
      text-indent: 2em; /* 首行缩进2字符 */
      line-height: 1.8; /* 行高1.8 */
      font-size: 16px; /* 正文字号16px */
      color: #333; /* 正文颜色#333 */
    }

    /* 重点文字样式（加粗）- 参考图片风格 */
    .article-container strong {
      color: #7b3bad; /* 深紫色 #7b3bad */
      font-weight: 700;
    }

    /* 强调文字（高亮背景）- 参考图片风格 */
    .article-container mark {
      background: linear-gradient(180deg, transparent 40%, rgba(123, 59, 173, 0.15) 40%); /* 深紫色浅背景 */
      color: #333;
      padding: 0 4px;
      font-weight: 600;
      border-radius: 2px;
    }

    /* 列表样式 - 参考图片风格 */
    .article-container ul, .article-container ol {
      margin: 20px 0; /* 列表间距20px */
      padding-left: 32px;
    }

    .article-container ul {
      list-style-type: disc;
    }

    .article-container ul li {
      margin: 8px 0;
      line-height: 1.8; /* 行高1.8 */
      color: #333;
    }

    .article-container ul li::marker {
      color: #7b3bad; /* 深紫色圆点 */
      font-size: 1.2em;
    }

    .article-container ol {
      list-style-type: decimal;
      padding-left: 40px;
    }

    .article-container ol li {
      margin: 8px 0;
      line-height: 1.8; /* 行高1.8 */
      color: #333;
      font-weight: 500;
      text-indent: -20px;
    }

    .article-container ol li::marker {
      color: #7b3bad; /* 深紫色数字 */
      font-weight: bold;
    }

    /* 引用样式 - 参考图片风格 */

    /* 文首引导框（时代背景）- 浅色背景，开头和结尾使用 */
    .article-container blockquote {
      margin: 20px 0;
      padding: 15px; /* 内边距15px，更紧凑 */
      background: #f5f0ff; /* 浅紫灰色背景 #f5f0ff */
      border-left: 4px solid #7b3bad; /* 左侧深紫色边框 4px */
      color: #333; /* 深色文字 */
      font-size: 16px;
      line-height: 1.7; /* 行高1.7，紧凑易读 */
      border-radius: 4px;
      position: relative;
    }

    /* 真实案例框 - 正文中间使用，更紧凑 */
    .article-container blockquote.cases {
      background: #fbfafc; /* 更浅的米白色背景 #fbfafc */
      border-left: 3px solid #7b3bad; /* 左侧深紫色边框 3px */
      padding: 12px; /* 内边距12px，更小 */
      font-size: 15px; /* 案例描述文字15px */
      line-height: 1.6; /* 行高1.6，紧凑 */
      margin: 15px 0; /* 上下间距15px，更紧凑 */
      border-radius: 4px;
      color: #333; /* 深色文字 */
    }

    /* 真实案例中的段落样式 - 更紧凑 */
    .article-container blockquote.cases p {
      margin: 6px 0; /* 段落间距6px，非常紧凑 */
      text-indent: 0; /* 案例内容不缩进 */
      padding: 0;
      color: #333;
    }

    /* 开头和结尾区块中的段落样式 */
    .article-container blockquote:not(.cases) p {
      margin: 8px 0; /* 段落间距8px */
      text-indent: 0;
      padding: 0;
    }

    /* 引用块（最后部分）- 浅色背景，紧凑版 */
    .article-container blockquote.quote-box {
      background: #f0f0ff; /* 浅紫色背景 #f0f0ff */
      color: #7b3bad; /* 深紫色文字 */
      padding: 12px; /* 内边距12px，更紧凑 */
      padding-left: 40px; /* 左侧留出图标空间 */
      position: relative;
      border-left: none;
      border-radius: 4px;
      font-style: italic;
      margin: 15px 0; /* 上下间距15px */
    }

    .article-container blockquote.quote-box::before {
      content: '"';
      position: absolute;
      left: 12px;
      top: 8px;
      font-size: 32px; /* 字号从40px缩小到32px */
      color: #7b3bad; /* 深紫色引号 */
      font-family: Georgia, serif;
      opacity: 0.7;
    }

    .article-container blockquote::before {
      content: none; /* 默认移除引号装饰 */
    }

    /* 分割线 - 1px #f0f0f0浅灰横线 */
    .article-container hr {
      border: none;
      height: 1px;
      background: #f0f0f0; /* 浅灰 #f0f0f0 */
      margin: 30px 0;
    }

    /* 图片样式 - 参考图片风格 */
    .article-container img {
      width: 100%;
      max-width: 600px;
      height: auto;
      aspect-ratio: 16/9; /* 16:9比例 */
      display: block;
      margin: 20px auto;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      object-fit: cover;
    }

    /* 图片容器 - 自适应响应式 */
    .article-container .image-wrapper {
      max-width: 600px;
      margin: 20px auto;
      width: 100%;
    }

    .article-container .image-wrapper img {
      width: 100%;
      height: auto;
      aspect-ratio: 16/9; /* 16:9比例 */
      margin: 0;
    }

    .article-container img:hover {
      transform: scale(1.02);
    }



    /* 标签/按钮样式 - 参考图片风格 */
    .article-container .tag {
      display: inline-block;
      background: #444; /* 深灰背景 */
      color: #fff; /* 白色文字 */
      padding: 5px 10px; /* 垂直5px，水平10px */
      border-radius: 4px; /* 圆角4px */
      font-size: 13px;
      font-weight: 500;
      margin: 2px;
    }

    /* 代码块样式 - 参考图片风格 */
    .article-container code {
      background: linear-gradient(180deg, rgba(123, 59, 173, 0.1) 0%, rgba(123, 59, 173, 0.05) 100%);
      padding: 3px 8px;
      border-radius: 4px;
      font-family: "Courier New", monospace;
      font-size: 13px;
      color: #7b3bad; /* 深紫色 #7b3bad */
      font-weight: 600;
    }

    .article-container pre {
      background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
      padding: 20px;
      border-radius: 12px;
      overflow-x: auto;
      margin: 25px 0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border: 1px solid rgba(123, 59, 173, 0.3); /* 深紫色边框 */
    }

    .article-container pre code {
      background: none;
      padding: 0;
      color: #e2e8f0;
      font-size: 14px;
      font-weight: 400;
    }

    /* 表格样式 - 深紫色系 */
    .article-container table {
      width: 100%;
      border-collapse: collapse;
      margin: 25px 0;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      border: 1px solid #f0f0f0; /* 浅灰边框 */
    }

    .article-container th {
      background: linear-gradient(135deg, #7b3bad 0%, #6b3091 100%); /* 深紫色渐变 */
      color: white;
      font-weight: 600;
      padding: 14px 16px;
      text-align: left;
      font-size: 15px;
    }

    .article-container td {
      border: 1px solid #f0f0f0; /* 浅灰边框 */
      padding: 12px 16px;
      text-align: left;
      font-size: 14px;
      color: #333;
    }

    .article-container tr:nth-child(even) {
      background: rgba(123, 59, 173, 0.02);
    }

    .article-container tr:hover {
      background: rgba(123, 59, 173, 0.05);
    }
  </style>
`;

/**
 * 在HTML内容中插入图片
 */
const insertImagesIntoHTML = (
  htmlContent: string,
  imagePositions: Array<{ position: string; url: string }>
): string => {
  if (!imagePositions || imagePositions.length === 0) {
    return htmlContent;
  }

  let result = htmlContent;

  // 为每个图片位置插入图片
  imagePositions.forEach(({ position, url }) => {
    // 特殊处理：在第一段后插入图片
    if (position === 'FIRST_PARAGRAPH') {
      const firstParagraphPattern = /(<p[^>]*>.*?<\/p>\s*)/i;
      if (firstParagraphPattern.test(result)) {
        const imageHtml = `$1<div class="image-wrapper"><img src="${url}" alt="配图" /></div>`;
        result = result.replace(firstParagraphPattern, imageHtml);
      } else {
        // 如果没有段落，直接在开头插入
        const imageHtml = `<div class="image-wrapper"><img src="${url}" alt="配图" /></div>`;
        result = imageHtml + result;
      }
      return; // 处理完特殊标记后返回
    }

    // 在H2标题后插入图片
    const h2Pattern = new RegExp(
      `(<h2[^>]*>\\s*${escapeRegExp(position)}\\s*</h2>\\s*)`,
      'gi'
    );

    if (h2Pattern.test(result)) {
      const imageHtml = `$1<div class="image-wrapper"><img src="${url}" alt="配图" /></div>`;
      result = result.replace(h2Pattern, imageHtml);
    }
  });

  return result;
};

/**
 * 转义正则表达式特殊字符
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default function PreviewPanel({
  content,
  contentType,
  isGenerating,
  searchResults,
  images = [],
  imagePositions = [],
}: PreviewPanelProps) {
  const [showHtmlSource, setShowHtmlSource] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // 判断是否为小红书类型
  const isXiaohongshu = contentType === 'xiaohongshu';

  // 复制HTML到剪贴板
  const handleCopyHTML = async () => {
    const htmlContent = generateFinalHTML();

    try {
      await navigator.clipboard.writeText(htmlContent);
      setCopyStatus('success');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (error) {
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  // 下载HTML文件
  const handleDownloadHTML = () => {
    const htmlContent = generateFinalHTML();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `公众号文章-${new Date().toLocaleDateString('zh-CN')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 配置marked选项
  marked.setOptions({
    breaks: true, // 支持换行
    gfm: true, // GitHub Flavored Markdown
  });

  // 将Markdown转换为HTML
  const convertMarkdownToHTML = (markdown: string): string => {
    if (!markdown) return '';

    // 在转换前，先格式化文本（添加中英文空格）
    let processedContent = formatMarkdown(markdown);

    // 移除AI生成的配图占位符（![配图](图片链接)等无效占位符）
    // 这些占位符会被实际的imagePositions替换
    processedContent = processedContent.replace(/!\[配图\]\([^)]+\)/g, '');

    // 如果有图片位置信息，在Markdown中添加图片标记
    if (imagePositions && imagePositions.length > 0) {
      imagePositions.forEach(({ position, url }) => {
        // 特殊处理：在第一段后插入图片
        if (position === 'FIRST_PARAGRAPH') {
          // 找到第一个段落
          const firstParagraphPattern = /([^\n]+\n\n)/;
          if (firstParagraphPattern.test(processedContent)) {
            processedContent = processedContent.replace(
              firstParagraphPattern,
              `$1

![配图](${url})

`
            );
          } else {
            // 如果没有段落分隔，直接在开头插入
            processedContent = `![配图](${url})

` + processedContent;
          }
          return;
        }

        // 在H2标题后插入图片
        const h2Pattern = new RegExp(`(##\\s+${escapeRegExp(position)}\\s*)`, 'gi');
        if (h2Pattern.test(processedContent)) {
          processedContent = processedContent.replace(
            h2Pattern,
            `$1

![配图](${url})

`
          );
        }
      });
    }

    // 转换为HTML
    const html = marked.parse(processedContent) as string;

    // 包裹在文章容器中，根据内容类型添加不同的类
    const containerClass = isXiaohongshu ? 'article-container xiaohongshu-style' : 'article-container';
    const finalHtml = `
      <div class="${containerClass}">
        ${html}
      </div>
    `;

    return finalHtml;
  };

  // 生成最终的HTML（包含样式）
  const generateFinalHTML = (): string => {
    if (!content) return '';

    const bodyHtml = convertMarkdownToHTML(content);
    const title = isXiaohongshu ? '小红书笔记' : '公众号文章';
    const finalHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  ${htmlStyles}
</head>
<body>
  ${bodyHtml}
</body>
</html>
    `;

    return finalHtml;
  };

  const htmlContent = generateFinalHTML();

  // 提取HTML预览（不带完整文档结构）
  const previewHTML = convertMarkdownToHTML(content);

  return (
    <div className="flex h-full flex-col bg-gray-100 dark:bg-gray-900">
      {/* 头部 */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <svg className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">实时预览</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {contentTypeLabels[contentType] || '内容'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {content && !isGenerating && (
            <>
              <button
                onClick={handleCopyHTML}
                className="flex items-center gap-1.5 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                {copyStatus === 'success' ? (
                  <>
                    <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-600">已复制</span>
                  </>
                ) : copyStatus === 'error' ? (
                  <>
                    <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-red-600">复制失败</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    <span>复制HTML</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadHTML}
                className="flex items-center gap-1.5 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>下载</span>
              </button>
            </>
          )}

          <button
            onClick={() => setShowHtmlSource(!showHtmlSource)}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            {showHtmlSource ? '查看预览' : '查看HTML源码'}
          </button>
          {isGenerating && (
            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>生成中...</span>
            </div>
          )}
        </div>
      </div>

      {/* 预览内容区 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-2xl">
          {/* 搜索结果 */}
          {searchResults && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <div className="flex items-start gap-2">
                <svg className="mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    AI 资料搜索
                  </p>
                  <p className="mt-1 text-xs text-blue-800 dark:text-blue-300">
                    {searchResults}
                  </p>
                </div>
              </div>
            </div>
          )}

          {content ? (
            <div className="rounded-lg bg-white shadow-lg dark:bg-gray-800">
              <div className="p-6">
                {/* 文章头部信息 */}
                <div className="mb-6 text-center">
                  <div className="mb-2 inline-block rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-1 text-xs font-medium text-white">
                    原创
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date().toLocaleDateString('zh-CN')}
                  </p>
                </div>

                {/* 预览内容 */}
                {showHtmlSource ? (
                  <div className="relative">
                    <pre className="max-h-[600px] overflow-auto rounded-lg bg-gray-100 p-4 text-xs text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                      <code>{htmlContent}</code>
                    </pre>
                  </div>
                ) : (
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{
                      __html: `<style>${htmlStyles}</style>${previewHTML}`,
                    }}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
              <div>
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  请输入需求开始生成内容
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

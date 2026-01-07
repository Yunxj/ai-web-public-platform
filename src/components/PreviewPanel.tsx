'use client';

import { useState, useEffect } from 'react';
import { formatMarkdown } from '@/lib/text-formatter';
import { WENYAN_THEMES, getAllThemes, type WenyanThemeId } from '@/config/wenyan-themes';

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
  xiaohongshu: '小红书',
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

    // 在H2标题后插入图片（HTML中）
    // 首先尝试精确匹配
    let h2Pattern = new RegExp(
      `(<h2[^>]*>\\s*${escapeRegExp(position)}\\s*</h2>\\s*)`,
      'gi'
    );
    let matched = false;

    if (h2Pattern.test(result)) {
      matched = true;
      const imageHtml = `$1<div class="image-wrapper"><img src="${url}" alt="配图" /></div>`;
      result = result.replace(h2Pattern, imageHtml);
    } else {
      // 如果精确匹配失败，尝试更灵活的匹配
      // 匹配包含 position 关键词的 H2 标题
      const normalizedPosition = position
        .replace(/[：:]/g, '[：:]') // 支持中文和英文冒号
        .replace(/\s+/g, '\\s*') // 支持任意空格
        .replace(/\|/g, '\\|'); // 转义管道符
      
      h2Pattern = new RegExp(
        `(<h2[^>]*>\\s*.*?${normalizedPosition}.*?\\s*</h2>\\s*)`,
        'gi'
      );

      if (h2Pattern.test(result)) {
        matched = true;
        const imageHtml = `$1<div class="image-wrapper"><img src="${url}" alt="配图" /></div>`;
        result = result.replace(h2Pattern, imageHtml);
      } else {
        // 最后尝试：匹配包含关键词的 H2 标题
        const keywords = position.split(/[|：:\s]+/).filter(k => k.length > 2);
        if (keywords.length > 0) {
          const keywordPattern = keywords.map(k => escapeRegExp(k)).join('.*?');
          h2Pattern = new RegExp(
            `(<h2[^>]*>\\s*.*?${keywordPattern}.*?\\s*</h2>\\s*)`,
            'gi'
          );

          if (h2Pattern.test(result)) {
            matched = true;
            const imageHtml = `$1<div class="image-wrapper"><img src="${url}" alt="配图" /></div>`;
            result = result.replace(h2Pattern, imageHtml);
          }
        }
      }
    }
    
    if (!matched) {
      console.warn(`无法在HTML中匹配图片位置: ${position}，图片URL: ${url}`);
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

/**
 * 清理 HTML 内容，移除不完整的内容片段和未闭合的标签
 */
function cleanupHTML(html: string): string {
  if (!html) return '';

  let cleaned = html;

  // 1. 移除末尾的不完整 Markdown 语法片段（如 "4. **"、"**"、"*" 等）
  // 匹配末尾的不完整列表项和 Markdown 语法
  cleaned = cleaned.replace(/\d+\.\s*\*+\s*$/gm, ''); // 移除 "4. **" 这样的不完整列表项
  cleaned = cleaned.replace(/\*+\s*$/gm, ''); // 移除末尾单独的 "**" 或 "*"
  cleaned = cleaned.replace(/^\s*\*+\s*$/gm, ''); // 移除单独一行的 "**" 或 "*"
  
  // 2. 移除末尾不完整的 HTML 标签片段
  // 匹配末尾的不完整标签（如 "<strong>", "<em>" 等未闭合的标签）
  cleaned = cleaned.replace(/<(\w+)[^>]*>\s*$/g, ''); // 移除末尾未闭合的开始标签
  
  // 3. 移除末尾多余的空白字符和换行符
  cleaned = cleaned.replace(/\s+$/, '');
  
  // 4. 移除空段落和只包含空白字符的段落
  cleaned = cleaned.replace(/<p[^>]*>\s*<\/p>/gi, '');
  cleaned = cleaned.replace(/<p[^>]*>\s*[\*\s]+\s*<\/p>/gi, '');
  
  // 5. 移除不完整的列表项（只包含 "4. **" 这样的内容）
  cleaned = cleaned.replace(/<li[^>]*>\s*\d+\.\s*\*+\s*<\/li>/gi, '');
  cleaned = cleaned.replace(/<li[^>]*>\s*\*+\s*<\/li>/gi, '');
  
  // 6. 清理末尾的空列表
  cleaned = cleaned.replace(/<([uo]l)[^>]*>\s*<\/\1>/gi, '');
  
  // 7. 确保 HTML 结构完整，移除末尾不完整的嵌套结构
  // 移除末尾未闭合的标签（简单处理，主要针对常见的不完整标签）
  cleaned = cleaned.replace(/<strong[^>]*>\s*$/gi, '');
  cleaned = cleaned.replace(/<em[^>]*>\s*$/gi, '');
  cleaned = cleaned.replace(/<b[^>]*>\s*$/gi, '');
  cleaned = cleaned.replace(/<i[^>]*>\s*$/gi, '');
  cleaned = cleaned.replace(/<span[^>]*>\s*$/gi, '');
  
  // 8. 移除末尾的孤立文本节点（不完整的文本片段）
  // 如果末尾有单独的文本节点且只包含特殊字符，移除它
  const textEndMatch = cleaned.match(/>([^<]*)$/);
  if (textEndMatch) {
    const trailingText = textEndMatch[1].trim();
    // 如果末尾文本只包含数字、点、星号等，可能是截断的内容
    if (/^[\d\.\*\s]+$/.test(trailingText)) {
      cleaned = cleaned.replace(/>[^<]*$/, '>');
    }
  }

  return cleaned.trim();
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
  const [formattedHTML, setFormattedHTML] = useState<string>('');
  const [isFormatting, setIsFormatting] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<WenyanThemeId>('default');
  const [isRecommending, setIsRecommending] = useState(false);
  const [recommendedThemes, setRecommendedThemes] = useState<Array<{
    themeId: WenyanThemeId;
    name: string;
    description: string;
    reason: string;
    score: number;
  }>>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);

  // 判断是否为小红书类型
  const isXiaohongshu = contentType === 'xiaohongshu';

  // 获取所有主题列表
  const allThemes = getAllThemes();

  // 智能推荐主题
  const handleRecommendThemes = async () => {
    if (!content) {
      return;
    }

    setIsRecommending(true);
    setShowRecommendations(true);

    try {
      const response = await fetch('/api/recommend-theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
        }),
      });

      if (!response.ok) {
        throw new Error(`推荐失败: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.recommendedThemes) {
        setRecommendedThemes(result.recommendedThemes);
        // 自动应用第一个推荐的主题
        if (result.recommendedThemes.length > 0) {
          setCurrentTheme(result.recommendedThemes[0].themeId);
        }
      } else {
        throw new Error(result.error || '推荐失败');
      }
    } catch (error) {
      console.error('主题推荐失败:', error);
      setRecommendedThemes([]);
    } finally {
      setIsRecommending(false);
    }
  };

  // 应用推荐的主题
  const handleApplyTheme = (themeId: WenyanThemeId) => {
    setCurrentTheme(themeId);
    setShowRecommendations(false);
  };

  // 复制HTML到剪贴板
  const handleCopyHTML = async () => {
    // 使用纯HTML片段，不包含完整的HTML文档结构
    // 这样微信公众号编辑器可以正确解析
    if (!formattedHTML) {
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
      return;
    }

    try {
      // 优先使用 ClipboardItem API 写入HTML格式内容
      // 检查浏览器是否支持 ClipboardItem
      const ClipboardItemConstructor = (window as any).ClipboardItem;
      if (ClipboardItemConstructor && navigator.clipboard?.write) {
        const htmlBlob = new Blob([formattedHTML], { type: 'text/html' });
        const clipboardItem = new ClipboardItemConstructor({
          'text/html': htmlBlob,
        });
        await navigator.clipboard.write([clipboardItem]);
        setCopyStatus('success');
        setTimeout(() => setCopyStatus('idle'), 2000);
      } else {
        // 降级方案：创建临时div，选中内容后复制
        // 这种方式会复制HTML格式的内容，类似于手动拖拽选中
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'fixed';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '-9999px';
        tempDiv.style.width = '1px';
        tempDiv.style.height = '1px';
        tempDiv.style.opacity = '0';
        tempDiv.innerHTML = formattedHTML;
        document.body.appendChild(tempDiv);

        // 选中div中的所有内容
        const range = document.createRange();
        range.selectNodeContents(tempDiv);
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
          
          // 复制选中的内容（浏览器会自动将DOM内容转换为HTML格式）
          const success = document.execCommand('copy');
          selection.removeAllRanges();
          
          document.body.removeChild(tempDiv);
          
          if (success) {
            setCopyStatus('success');
            setTimeout(() => setCopyStatus('idle'), 2000);
          } else {
            throw new Error('execCommand copy failed');
          }
        } else {
          document.body.removeChild(tempDiv);
          throw new Error('Selection API not available');
        }
      }
    } catch (error) {
      console.error('复制失败:', error);
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

  // 使用 Wenyan 进行排版 - 当内容或图片位置变化时重新排版
  useEffect(() => {
    const formatContent = async () => {
      if (!content) {
        setFormattedHTML('');
        return;
      }

      setIsFormatting(true);

      try {
        // 1. 先处理 Markdown，插入图片
        let processedMarkdown = formatMarkdown(content);

        // 移除AI生成的配图占位符和示例图片链接
        processedMarkdown = processedMarkdown.replace(/!\[配图[^\]]*\]\([^)]+\)/g, '');
        processedMarkdown = processedMarkdown.replace(/!\[[^\]]*\]\(https?:\/\/(example\.com|placeholder|via\.placeholder)[^)]+\)/gi, '');
        processedMarkdown = processedMarkdown.replace(/!\[[^\]]*\]\([^)]*example[^)]*\)/gi, '');
        processedMarkdown = processedMarkdown.replace(/!\[[^\]]*\]\([^)]*placeholder[^)]*\)/gi, '');
        processedMarkdown = processedMarkdown.replace(/\n\s*!\[\]\([^)]*\)\s*\n/g, '\n\n');

        // 2. 插入图片到 Markdown 中
        if (imagePositions && imagePositions.length > 0) {
          const escapeUrl = (url: string): string => {
            return url.replace(/\)/g, '%29');
          };

          imagePositions.forEach(({ position, url }) => {
            const escapedUrl = escapeUrl(url);

            if (position === 'FIRST_PARAGRAPH') {
              const firstParagraphPattern = /([^\n]+\n\n)/;
              if (firstParagraphPattern.test(processedMarkdown)) {
                processedMarkdown = processedMarkdown.replace(
                  firstParagraphPattern,
                  `$1

![配图](${escapedUrl})

`
                );
              } else {
                processedMarkdown = `![配图](${escapedUrl})

` + processedMarkdown;
              }
              return;
            }

            // 在H2标题后插入图片
            const normalizedPosition = position.trim().replace(/\s+/g, ' ');
            let h2Pattern = new RegExp(
              `(##\\s+${escapeRegExp(normalizedPosition)}\\s*)`,
              'gi'
            );
            let matched = false;

            if (h2Pattern.test(processedMarkdown)) {
              matched = true;
              processedMarkdown = processedMarkdown.replace(
                h2Pattern,
                `$1

![配图](${escapedUrl})

`
              );
            } else {
              const flexiblePosition = normalizedPosition
                .replace(/[：:]/g, '[：:]')
                .replace(/\s+/g, '\\s+')
                .replace(/\|/g, '\\|');

              h2Pattern = new RegExp(`(##\\s+${flexiblePosition}\\s*)`, 'gi');

              if (h2Pattern.test(processedMarkdown)) {
                matched = true;
                processedMarkdown = processedMarkdown.replace(
                  h2Pattern,
                  `$1

![配图](${escapedUrl})

`
                );
              } else {
                const keywords = normalizedPosition
                  .split(/[|：:\s]+/)
                  .filter(k => k.length > 2)
                  .map(k => k.trim());

                if (keywords.length > 0) {
                  const keywordPattern = keywords.map(k => escapeRegExp(k)).join('.*?');
                  h2Pattern = new RegExp(`(##\\s+.*?${keywordPattern}.*?\\s*)`, 'gi');

                  if (h2Pattern.test(processedMarkdown)) {
                    matched = true;
                    processedMarkdown = processedMarkdown.replace(
                      h2Pattern,
                      `$1

![配图](${escapedUrl})

`
                    );
                  }
                }
              }
            }

            if (!matched) {
              console.warn(`无法匹配图片位置: ${position}`);
            }
          });
        }

        // 3. 调用 API 使用 Wenyan 进行排版
        const response = await fetch('/api/format-content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            markdown: processedMarkdown,
            theme: currentTheme,
            highlightTheme: 'github',
            isMacStyle: true,
          }),
        });

        if (!response.ok) {
          throw new Error(`排版失败: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || '排版失败');
        }

        // 4. 清理 HTML 中的占位符图片
        let finalHTML = result.html || '';
        finalHTML = finalHTML.replace(/<img[^>]*src=["']https?:\/\/(example\.com|placeholder|via\.placeholder)[^"']*["'][^>]*>/gi, '');
        finalHTML = finalHTML.replace(/<img[^>]*src=["'][^"']*example[^"']*["'][^>]*>/gi, '');
        finalHTML = finalHTML.replace(/<img[^>]*src=["'][^"']*placeholder[^"']*["'][^>]*>/gi, '');
        finalHTML = finalHTML.replace(/<p>\s*<img[^>]*src=["'][^"']*["'][^>]*>\s*<\/p>/gi, '');

        // 5. 清理不完整的内容片段和未闭合的标签
        finalHTML = cleanupHTML(finalHTML);

        setFormattedHTML(finalHTML);
      } catch (error) {
        console.error('Wenyan 排版失败:', error);
        // 如果排版失败，使用原始内容
        setFormattedHTML('');
      } finally {
        setIsFormatting(false);
      }
    };

    formatContent();
  }, [content, imagePositions, currentTheme]);

  // 将Markdown转换为HTML（保留用于兼容性，但主要使用 wenyan 排版）
  const convertMarkdownToHTML = (markdown: string): string => {
    if (!markdown) return '';

    // 在转换前，先格式化文本（添加中英文空格）
    let processedContent = formatMarkdown(markdown);

    // 移除AI生成的配图占位符和示例图片链接
    // 1. 移除 ![配图](...) 格式的占位符
    processedContent = processedContent.replace(/!\[配图[^\]]*\]\([^)]+\)/g, '');
    // 2. 移除所有 example.com、placeholder、via.placeholder 等示例图片链接
    processedContent = processedContent.replace(/!\[[^\]]*\]\(https?:\/\/(example\.com|placeholder|via\.placeholder)[^)]+\)/gi, '');
    // 3. 移除包含示例链接的图片标记（更宽泛的匹配）
    processedContent = processedContent.replace(/!\[[^\]]*\]\([^)]*example[^)]*\)/gi, '');
    processedContent = processedContent.replace(/!\[[^\]]*\]\([^)]*placeholder[^)]*\)/gi, '');
    // 4. 移除空的图片标签行
    processedContent = processedContent.replace(/\n\s*!\[\]\([^)]*\)\s*\n/g, '\n\n');

    // 如果有图片位置信息，在Markdown中添加图片标记
    if (imagePositions && imagePositions.length > 0) {
      console.log('开始插入图片，图片位置信息:', imagePositions);
      
      // 转义 URL 中的特殊字符，确保在 Markdown 中正确显示
      const escapeUrl = (url: string): string => {
        // URL 中可能包含特殊字符，但通常不需要转义
        // 只处理可能导致 Markdown 解析问题的字符
        return url.replace(/\)/g, '%29'); // 转义右括号，避免破坏 Markdown 链接语法
      };
      
      imagePositions.forEach(({ position, url }, index) => {
        const escapedUrl = escapeUrl(url);
        console.log(`处理第 ${index + 1} 张图片，位置: ${position}, URL: ${url.substring(0, 50)}...`);
        
        // 特殊处理：在第一段后插入图片
        if (position === 'FIRST_PARAGRAPH') {
          // 找到第一个段落
          const firstParagraphPattern = /([^\n]+\n\n)/;
          if (firstParagraphPattern.test(processedContent)) {
            processedContent = processedContent.replace(
              firstParagraphPattern,
              `$1

![配图](${escapedUrl})

`
            );
            console.log('在第一段后插入图片成功');
          } else {
            // 如果没有段落分隔，直接在开头插入
            processedContent = `![配图](${escapedUrl})

` + processedContent;
            console.log('在开头插入图片成功');
          }
          return;
        }

        // 在H2标题后插入图片
        // 改进匹配逻辑：支持更灵活的匹配（忽略空格、标点符号差异）
        
        // 策略1：精确匹配（去除首尾空格，标准化空白字符）
        const normalizedPosition = position.trim().replace(/\s+/g, ' ');
        let h2Pattern = new RegExp(
          `(##\\s+${escapeRegExp(normalizedPosition)}\\s*)`,
          'gi'
        );
        let matched = false;
        
        if (h2Pattern.test(processedContent)) {
          matched = true;
          processedContent = processedContent.replace(
            h2Pattern,
            `$1

![配图](${escapedUrl})

`
          );
          console.log(`精确匹配成功: ${position}`);
        } else {
          // 策略2：允许标点符号差异（中文/英文冒号等）
          const flexiblePosition = normalizedPosition
            .replace(/[：:]/g, '[：:]') // 支持中文和英文冒号
            .replace(/\s+/g, '\\s+') // 支持任意空格
            .replace(/\|/g, '\\|'); // 转义管道符
          
          h2Pattern = new RegExp(`(##\\s+${flexiblePosition}\\s*)`, 'gi');
          
          if (h2Pattern.test(processedContent)) {
            matched = true;
            processedContent = processedContent.replace(
              h2Pattern,
              `$1

![配图](${escapedUrl})

`
            );
            console.log(`灵活匹配成功: ${position}`);
          } else {
            // 策略3：关键词匹配（提取关键词进行模糊匹配）
            const keywords = normalizedPosition
              .split(/[|：:\s]+/)
              .filter(k => k.length > 2)
              .map(k => k.trim());
            
            if (keywords.length > 0) {
              const keywordPattern = keywords.map(k => escapeRegExp(k)).join('.*?');
              h2Pattern = new RegExp(`(##\\s+.*?${keywordPattern}.*?\\s*)`, 'gi');
              
              if (h2Pattern.test(processedContent)) {
                matched = true;
                processedContent = processedContent.replace(
                  h2Pattern,
                  `$1

![配图](${escapedUrl})

`
                );
                console.log(`关键词匹配成功: ${position}, 关键词: ${keywords.join(', ')}`);
              }
            }
          }
        }
        
        if (!matched) {
          console.warn(`无法匹配图片位置: ${position}`);
          console.warn('文章中的 H2 标题:', processedContent.match(/##\s+[^\n]+/g));
        }
      });
      
      console.log('图片插入完成');
    }

    // 注意：此函数保留用于向后兼容，但主要排版逻辑已在 useEffect 中使用 wenyan
    // 如果需要同步转换，可以使用简单的 HTML 包装
    let html = `<div class="article-container">${processedContent.replace(/\n/g, '<br>')}</div>`;

    // 在 HTML 转换后，再次清理所有占位符图片链接
    // 1. 移除包含 example.com 的图片标签
    html = html.replace(/<img[^>]*src=["']https?:\/\/(example\.com|placeholder|via\.placeholder)[^"']*["'][^>]*>/gi, '');
    // 2. 移除包含 example 关键词的图片标签
    html = html.replace(/<img[^>]*src=["'][^"']*example[^"']*["'][^>]*>/gi, '');
    // 3. 移除包含 placeholder 关键词的图片标签
    html = html.replace(/<img[^>]*src=["'][^"']*placeholder[^"']*["'][^>]*>/gi, '');
    // 4. 移除空的图片段落
    html = html.replace(/<p>\s*<img[^>]*src=["'][^"']*["'][^>]*>\s*<\/p>/gi, '');

    // 包裹在文章容器中，根据内容类型添加不同的类
    const containerClass = isXiaohongshu ? 'article-container xiaohongshu-style' : 'article-container';
    const finalHtml = `
      <div class="${containerClass}">
        ${html}
      </div>
    `;

    return finalHtml;
  };

  // 生成最终的HTML（用于复制和下载）- 使用 wenyan 排版结果
  const generateFinalHTML = (): string => {
    if (!formattedHTML) {
      return '';
    }

    const title = isXiaohongshu ? '小红书笔记' : '公众号文章';
    const finalHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
</head>
<body>
  ${formattedHTML}
</body>
</html>`;

    return finalHtml;
  };

  const htmlContent = generateFinalHTML();
  
  // 预览 HTML（直接使用 wenyan 排版的结果）
  const previewHTML = formattedHTML || '';

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
              {/* 主题选择器 */}
              <div className="relative">
                <select
                  value={currentTheme}
                  onChange={(e) => setCurrentTheme(e.target.value as WenyanThemeId)}
                  className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  {allThemes.map((theme) => (
                    <option key={theme.id} value={theme.id}>
                      {theme.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 智能推荐按钮 */}
              <button
                onClick={handleRecommendThemes}
                disabled={isRecommending}
                className="flex items-center gap-1.5 rounded border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 dark:border-blue-600 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30"
              >
                {isRecommending ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>推荐中...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span>智能推荐</span>
                  </>
                )}
              </button>

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
          {/* 主题推荐结果 */}
          {showRecommendations && recommendedThemes.length > 0 && (
            <div className="mb-4 rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/20">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                    智能推荐主题
                  </p>
                </div>
                <button
                  onClick={() => setShowRecommendations(false)}
                  className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-2">
                {recommendedThemes.map((theme, index) => (
                  <div
                    key={theme.themeId}
                    className={`rounded-lg border p-3 ${
                      currentTheme === theme.themeId
                        ? 'border-purple-400 bg-purple-100 dark:border-purple-600 dark:bg-purple-900/40'
                        : 'border-purple-200 bg-white dark:border-purple-800 dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                            {index + 1}. {theme.name}
                          </span>
                          {currentTheme === theme.themeId && (
                            <span className="rounded-full bg-purple-600 px-2 py-0.5 text-xs text-white">
                              已应用
                            </span>
                          )}
                          <span className="text-xs text-purple-600 dark:text-purple-400">
                            匹配度: {theme.score}%
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-purple-700 dark:text-purple-300">
                          {theme.reason}
                        </p>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                          {theme.description}
                        </p>
                      </div>
                      {currentTheme !== theme.themeId && (
                        <button
                          onClick={() => handleApplyTheme(theme.themeId)}
                          className="ml-3 rounded bg-purple-600 px-3 py-1 text-xs font-medium text-white hover:bg-purple-700"
                        >
                          应用
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                  <div className="relative">
                    {isFormatting ? (
                      <div className="flex min-h-[400px] items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                          <svg className="h-8 w-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="text-sm text-gray-600 dark:text-gray-400">正在排版...</span>
                        </div>
                      </div>
                    ) : previewHTML ? (
                      <div
                        className="prose prose-sm max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{
                          __html: previewHTML,
                        }}
                      />
                    ) : (
                      <div className="flex min-h-[400px] items-center justify-center text-gray-500 dark:text-gray-400">
                        <span>暂无内容</span>
                      </div>
                    )}
                  </div>
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

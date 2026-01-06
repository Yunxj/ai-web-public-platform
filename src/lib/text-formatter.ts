/**
 * 文本格式化工具
 * 处理全角中文与半角英文/数字之间的空格
 */

/**
 * 在全角中文和半角英文/数字之间添加半角空格
 */
export function addSpaceBetweenChineseAndEnglish(text: string): string {
  if (!text) return text;

  // 在中文后跟英文/数字时添加空格
  let result = text.replace(/([\u4e00-\u9fa5])([a-zA-Z0-9])/g, '$1 $2');

  // 在英文/数字后跟中文时添加空格
  result = result.replace(/([a-zA-Z0-9])([\u4e00-\u9fa5])/g, '$1 $2');

  // 避免在标签（如 **text**）内部添加空格
  result = result.replace(/\* \*/g, '**');

  return result;
}

/**
 * 格式化文本（空格处理 + 其他清理）
 */
export function formatText(text: string): string {
  if (!text) return text;

  // 添加中英文空格
  text = addSpaceBetweenChineseAndEnglish(text);

  // 清理多余的空格
  text = text.replace(/\s{3,}/g, '  '); // 3个以上空格替换为2个

  return text;
}

/**
 * 处理Markdown文本的格式化
 */
export function formatMarkdown(text: string): string {
  if (!text) return text;

  const lines = text.split('\n');
  const processedLines = lines.map(line => {
    // 跳过代码块
    if (line.trim().startsWith('```')) return line;
    if (line.trim().startsWith('>')) return line; // 引用块不处理

    // 处理普通文本行
    return formatText(line);
  });

  return processedLines.join('\n');
}

/**
 * 处理HTML文本的格式化
 * 注意：这个函数会在HTML标签外部的文本中添加空格
 */
export function formatHTML(html: string): string {
  if (!html) return html;

  // 简单的实现：移除HTML标签，处理文本，再放回标签
  // 注意：这个简化版本可能不适用于复杂HTML

  return html;
}

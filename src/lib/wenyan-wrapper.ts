/**
 * Wenyan 排版库封装
 * 封装 @wenyan-md/core 的 getGzhContent 函数，提供统一的排版接口
 */

import { getGzhContent } from '@wenyan-md/core/wrapper';

export interface WenyanOptions {
  theme?: string; // 主题ID: 'default', 'orangeheart', 'rainbow', 'lapis', 'pie', 'maize', 'purple', 'phycat'
  highlightTheme?: string; // 代码高亮主题
  isMacStyle?: boolean; // 代码块Mac风格
}

/**
 * 使用 Wenyan 库格式化 Markdown 内容
 */
export async function formatWithWenyan(
  markdown: string,
  options: WenyanOptions = {}
): Promise<{
  title?: string;
  cover?: string;
  content: string;
  description?: string;
}> {
  const {
    theme = 'default',
    highlightTheme = 'github',
    isMacStyle = true,
  } = options;

  try {
    const result = await getGzhContent(markdown, theme, highlightTheme, isMacStyle);
    return result;
  } catch (error) {
    console.error('Wenyan 排版失败:', error);
    throw error;
  }
}

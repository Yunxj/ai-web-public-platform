/**
 * 测试 @wenyan-md/core 排版效果
 * 此文件用于快速测试 wenyan 库的排版功能
 */

import { getGzhContent } from '@wenyan-md/core/wrapper';

/**
 * 测试用的示例 Markdown 内容
 */
const testMarkdown = `# 测试文章标题

这是一段测试文本，用于验证 wenyan 排版效果。

## 二级标题

### 三级标题

这里是一个**加粗文本**和*斜体文本*的示例。

> 这是一个引用块的示例
> 引用块可以包含多行内容

\`\`\`javascript
// 代码块示例
function hello() {
  console.log("Hello, Wenyan!");
}
\`\`\`

- 无序列表项 1
- 无序列表项 2
- 无序列表项 3

1. 有序列表项 1
2. 有序列表项 2
3. 有序列表项 3

---

最后是分隔线后的内容。`;

/**
 * 测试所有可用主题的排版效果
 */
export async function testAllThemes() {
  const themes = [
    'default',
    'orangeheart',
    'rainbow',
    'lapis',
    'pie',
    'maize',
    'purple',
    'phycat',
  ] as const;

  const highlightThemes = [
    'github',
    'solarized-light',
    'atom-one-dark',
    'dracula',
  ] as const;

  const results: Array<{
    theme: string;
    highlightTheme: string;
    html: string;
    title?: string;
  }> = [];

  console.log('开始测试 wenyan 排版...\n');

  for (const theme of themes) {
    try {
      console.log(`测试主题: ${theme}`);
      const result = await getGzhContent(
        testMarkdown,
        theme,
        'github',
        true
      );
      
      results.push({
        theme,
        highlightTheme: 'github',
        html: result.content,
        title: result.title,
      });

      console.log(`✓ ${theme} 主题测试成功`);
      console.log(`  - 生成 HTML 长度: ${result.content.length} 字符`);
      if (result.title) {
        console.log(`  - 标题: ${result.title}`);
      }
      console.log('');
    } catch (error) {
      console.error(`✗ ${theme} 主题测试失败:`, error);
    }
  }

  return results;
}

/**
 * 测试单个主题的排版
 */
export async function testSingleTheme(
  theme: string = 'default',
  highlightTheme: string = 'github',
  isMacStyle: boolean = true
) {
  try {
    console.log(`测试主题: ${theme}, 代码高亮: ${highlightTheme}`);
    
    const result = await getGzhContent(
      testMarkdown,
      theme,
      highlightTheme,
      isMacStyle
    );

    console.log(`✓ 排版成功`);
    console.log(`  - HTML 长度: ${result.content.length} 字符`);
    console.log(`  - 标题: ${result.title || '未提取到标题'}`);
    console.log(`  - 封面: ${result.cover || '未提取到封面'}`);
    console.log(`  - 描述: ${result.description || '未提取到描述'}`);

    return {
      success: true,
      theme,
      highlightTheme,
      result,
    };
  } catch (error) {
    console.error(`✗ 排版失败:`, error);
    return {
      success: false,
      theme,
      highlightTheme,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

/**
 * 快速测试默认主题
 */
export async function quickTest() {
  return testSingleTheme('default', 'github', true);
}

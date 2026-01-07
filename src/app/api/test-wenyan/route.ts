/**
 * 测试 Wenyan 排版效果的 API
 * GET /api/test-wenyan?theme=default&highlight=github
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGzhContent } from '@wenyan-md/core/wrapper';

export const runtime = 'nodejs';

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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const theme = searchParams.get('theme') || 'default';
    const highlightTheme = searchParams.get('highlight') || 'github';
    const isMacStyle = searchParams.get('macStyle') !== 'false';

    console.log(`测试 Wenyan 排版 - 主题: ${theme}, 代码高亮: ${highlightTheme}`);

    const result = await getGzhContent(
      testMarkdown,
      theme,
      highlightTheme,
      isMacStyle
    );

    return NextResponse.json({
      success: true,
      theme,
      highlightTheme,
      isMacStyle,
      result: {
        title: result.title,
        cover: result.cover,
        description: result.description,
        content: result.content.substring(0, 5000), // 限制返回长度
        contentLength: result.content.length,
      },
    });
  } catch (error) {
    console.error('Wenyan 排版测试失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

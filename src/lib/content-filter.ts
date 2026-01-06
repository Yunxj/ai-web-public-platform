/**
 * 内容审核与过滤工具
 * 提供基础的内容安全检测功能
 */

/**
 * 敏感词列表（基础版）
 * 注意：这是一个简化版本，生产环境应该使用专业的审核服务
 */
const SENSITIVE_KEYWORDS = [
  // 政治敏感词（示例）
  '台独', '藏独', '疆独', '法轮功', '邪教',

  // 暴力相关
  '杀人', '自杀', '恐怖主义', '炸弹', '爆炸',

  // 色情相关
  '色情', '裸体', '淫秽',

  // 诈骗相关
  '诈骗', '传销', '赌博', '洗钱',

  // 其他违规
  '毒品', '吸毒',
];

/**
 * 审核结果
 */
export interface AuditResult {
  isSafe: boolean;
  issues: string[];
  confidence: number;
}

/**
 * 文本内容审核
 */
export function auditText(text: string): AuditResult {
  const issues: string[] = [];
  let isSafe = true;

  if (!text) {
    return { isSafe: true, issues: [], confidence: 1.0 };
  }

  // 检测敏感词
  SENSITIVE_KEYWORDS.forEach(keyword => {
    if (text.includes(keyword)) {
      issues.push(`检测到敏感词: ${keyword}`);
      isSafe = false;
    }
  });

  // 检测过多重复内容（可能是垃圾内容）
  const shortTextThreshold = 20;
  if (text.length < shortTextThreshold) {
    issues.push('内容过短');
    isSafe = false;
  }

  // 计算置信度
  const confidence = isSafe ? 1.0 : Math.max(0, 1.0 - issues.length * 0.2);

  return {
    isSafe,
    issues,
    confidence,
  };
}

/**
 * 图片URL审核（基础版）
 * 注意：真正图片审核需要专业服务，这里只是示例
 */
export function auditImageURL(url: string): AuditResult {
  const issues: string[] = [];

  if (!url) {
    return { isSafe: true, issues: [], confidence: 1.0 };
  }

  // 检查URL是否包含可疑关键词
  const suspiciousKeywords = ['xxx', 'porn', 'adult'];
  suspiciousKeywords.forEach(keyword => {
    if (url.toLowerCase().includes(keyword)) {
      issues.push(`图片URL包含可疑关键词: ${keyword}`);
    }
  });

  return {
    isSafe: issues.length === 0,
    issues,
    confidence: issues.length === 0 ? 1.0 : 0.5,
  };
}

/**
 * 审核Markdown内容
 */
export function auditMarkdown(markdown: string): AuditResult {
  return auditText(markdown);
}

/**
 * 过滤违规内容
 * 将敏感词替换为 ***
 */
export function filterSensitiveWords(text: string): string {
  let filteredText = text;

  SENSITIVE_KEYWORDS.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi');
    filteredText = filteredText.replace(regex, '*'.repeat(keyword.length));
  });

  return filteredText;
}

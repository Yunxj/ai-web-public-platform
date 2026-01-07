/**
 * Wenyan 主题配置
 * 定义内置主题列表、主题元数据和配置映射
 */

/**
 * 主题特征标签
 */
export type ThemeTag = 
  | '简洁' | '经典' | '长文'
  | '温暖' | '橙色' | '活力' | '优雅' | '情感' | '生活'
  | '色彩丰富' | '生动' | '创意' | '轻松'
  | '清凉' | '蓝色' | '极简' | '清新' | '技术' | '专业'
  | '现代' | '锐利' | '时尚' | '科技' | '设计'
  | '柔和' | '玉米色' | '明快'
  | '简约' | '紫色' | '文艺' | '深度'
  | '薄荷绿' | '结构清晰' | '教程' | '知识';

/**
 * 主题适用场景
 */
export type ThemeScenario = 
  | '长文阅读' | '技术文章' | '专业内容' | '情感类' | '生活类'
  | '创意内容' | '轻松内容' | '科技类' | '设计类' | '文艺类' | '深度内容'
  | '教程类' | '知识类';

/**
 * 主题特征配置
 */
export interface ThemeFeatures {
  tags: ThemeTag[];
  scenarios: ThemeScenario[];
  keywords: string[]; // 关键词，用于匹配文章内容
}

/**
 * 内置主题列表（包含特征信息）
 */
export const WENYAN_THEMES = {
  default: { 
    name: '默认', 
    description: '文颜默认主题',
    features: {
      tags: ['简洁', '经典', '长文'],
      scenarios: ['长文阅读', '专业内容'],
      keywords: ['长文', '深度', '专业', '正式', '严肃', '报告', '分析', '研究']
    }
  },
  orangeheart: { 
    name: 'Orange Heart', 
    description: '橙色心形主题',
    features: {
      tags: ['温暖', '橙色', '活力', '优雅', '情感', '生活'],
      scenarios: ['情感类', '生活类'],
      keywords: ['情感', '生活', '温暖', '故事', '感悟', '随笔', '心得', '经历', '分享', '日记']
    }
  },
  rainbow: { 
    name: 'Rainbow', 
    description: '彩虹主题',
    features: {
      tags: ['色彩丰富', '生动', '创意', '轻松'],
      scenarios: ['创意内容', '轻松内容'],
      keywords: ['创意', '轻松', '有趣', '活泼', '生动', '色彩', '艺术', '设计', '视觉']
    }
  },
  lapis: { 
    name: 'Lapis', 
    description: '青金石主题',
    features: {
      tags: ['清凉', '蓝色', '极简', '清新', '技术', '专业'],
      scenarios: ['技术文章', '专业内容'],
      keywords: ['技术', '编程', '开发', '代码', '架构', '算法', '专业', '教程', '指南', '原理']
    }
  },
  pie: { 
    name: 'Pie', 
    description: '派主题',
    features: {
      tags: ['现代', '锐利', '时尚', '科技', '设计'],
      scenarios: ['科技类', '设计类'],
      keywords: ['科技', '设计', '现代', '时尚', '创新', '产品', '用户体验', '界面', '交互']
    }
  },
  maize: { 
    name: 'Maize', 
    description: '玉米主题',
    features: {
      tags: ['柔和', '玉米色', '明快', '生活'],
      scenarios: ['生活类', '轻松内容'],
      keywords: ['生活', '轻松', '日常', '分享', '美食', '旅行', '休闲', '娱乐']
    }
  },
  purple: { 
    name: 'Purple', 
    description: '紫色主题',
    features: {
      tags: ['简约', '紫色', '文艺', '深度'],
      scenarios: ['文艺类', '深度内容'],
      keywords: ['文艺', '深度', '思考', '哲学', '文学', '艺术', '文化', '人文', '思想']
    }
  },
  phycat: { 
    name: '物理猫-薄荷', 
    description: '物理猫薄荷主题',
    features: {
      tags: ['薄荷绿', '结构清晰', '教程', '知识'],
      scenarios: ['教程类', '知识类'],
      keywords: ['教程', '知识', '学习', '教育', '教学', '指南', '说明', '步骤', '方法', '技巧']
    }
  },
} as const;

/**
 * 代码高亮主题列表
 */
export const HIGHLIGHT_THEMES = {
  'atom-one-dark': 'Atom One Dark',
  'atom-one-light': 'Atom One Light',
  'dracula': 'Dracula',
  'github-dark': 'GitHub Dark',
  'github': 'GitHub',
  'monokai': 'Monokai',
  'solarized-dark': 'Solarized Dark',
  'solarized-light': 'Solarized Light',
  'xcode': 'Xcode',
} as const;

/**
 * 主题ID类型
 */
export type WenyanThemeId = keyof typeof WENYAN_THEMES;

/**
 * 代码高亮主题ID类型
 */
export type HighlightThemeId = keyof typeof HIGHLIGHT_THEMES;

/**
 * 获取所有主题列表
 */
export function getAllThemes() {
  return Object.entries(WENYAN_THEMES).map(([id, info]) => ({
    id,
    name: info.name,
    description: info.description,
    features: info.features,
  }));
}

/**
 * 根据主题ID获取主题特征
 */
export function getThemeFeatures(themeId: WenyanThemeId): ThemeFeatures {
  return WENYAN_THEMES[themeId].features;
}

/**
 * 根据关键词匹配主题
 * 返回匹配的主题ID和匹配度分数
 */
export function matchThemesByKeywords(
  keywords: string[]
): Array<{ themeId: WenyanThemeId; score: number }> {
  const themeScores: Array<{ themeId: WenyanThemeId; score: number }> = [];
  
  Object.entries(WENYAN_THEMES).forEach(([id, theme]) => {
    let score = 0;
    const lowerKeywords = keywords.map(k => k.toLowerCase());
    
    theme.features.keywords.forEach(keyword => {
      const lowerKeyword = keyword.toLowerCase();
      lowerKeywords.forEach(k => {
        if (k.includes(lowerKeyword) || lowerKeyword.includes(k)) {
          score += 1;
        }
      });
    });
    
    if (score > 0) {
      themeScores.push({ themeId: id as WenyanThemeId, score });
    }
  });
  
  // 按分数降序排序
  return themeScores.sort((a, b) => b.score - a.score);
}

/**
 * 获取所有代码高亮主题列表
 */
export function getAllHighlightThemes() {
  return Object.entries(HIGHLIGHT_THEMES).map(([id, name]) => ({
    id,
    name,
  }));
}

/**
 * 验证主题ID是否有效
 */
export function isValidTheme(themeId: string): themeId is WenyanThemeId {
  return themeId in WENYAN_THEMES;
}

/**
 * 验证代码高亮主题ID是否有效
 */
export function isValidHighlightTheme(
  themeId: string
): themeId is HighlightThemeId {
  return themeId in HIGHLIGHT_THEMES;
}

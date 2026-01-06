export interface AIStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  icon: string;
  result?: string;
}

export const defaultSteps: AIStep[] = [
  {
    id: 'search',
    title: '资料搜索',
    description: '根据需求搜索大量相关资料和素材',
    status: 'pending',
    icon: '🔍',
  },
  {
    id: 'analyze',
    title: '分析资料信息',
    description: '深度分析搜索到的资料内容和价值',
    status: 'pending',
    icon: '📊',
  },
  {
    id: 'integrate',
    title: '资料整合',
    description: '整理和整合分析后的资料',
    status: 'pending',
    icon: '📝',
  },
  {
    id: 'generate',
    title: '正文生成',
    description: '基于整合资料生成优质文章正文',
    status: 'pending',
    icon: '✍️',
  },
  {
    id: 'image',
    title: '内容配图',
    description: '智能生成3~6张高质量配图',
    status: 'pending',
    icon: '🎨',
  },
  {
    id: 'layout',
    title: '专家排版',
    description: '应用公众号文章专业排版',
    status: 'pending',
    icon: '✨',
  },
];

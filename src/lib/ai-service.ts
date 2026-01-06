import { LLMClient, Config } from 'coze-coding-dev-sdk';
import { SearchClient } from 'coze-coding-dev-sdk';
import { ImageGenerationClient } from 'coze-coding-dev-sdk';
import { getModelConfigForPrompt } from './model-selector';

interface GenerateArticleParams {
  prompt: string;
  contentType: string;
  context?: Array<{ role: 'user' | 'assistant'; content: string }>;
  enableSearch?: boolean;
  enableImage?: boolean;
}

// 内容类型提示词模板
const contentTypePrompts: Record<string, string> = {
  article: `你是一个专业的公众号文章写作助手。请根据用户需求生成一篇高质量的公众号文章，严格按照以下「结构+样式+交互」规范生成。

## 整体框架与布局规范

1. **页面尺寸**：1000px宽（适配响应式），背景色#fff，行高统一1.8
2. **大模块分隔**：文首引导框、5个案例模块、文末总结框
3. **模块间分隔**：使用1px #f0f0f0浅灰分隔线区分模块

## 标题与文字样式规范

大标题：字体颜色 #7c3aed（紫），字号 32px，字重 加粗，备注 居中，使用 # 开头
副标题：字体颜色 #7c3aed（紫），字号 24px，字重 加粗，备注 合并大标题居中
引导框文字：字体颜色 #333，字号 16px，字重 普通，备注 浅紫背景（#f0e6ff）
案例标题：字体颜色 #7c3aed（紫），字号 20px，字重 加粗，备注 左边界5px紫（#7c3aed）垂直线条
小标题（核心/为什么/如何）：字体颜色 #ff7d00（橙），字号 15px，字重 加粗，备注 如"核心逻辑："等
正文文字：字体颜色 #333，字号 16px，字重 普通，备注 段落首行缩进2字符

## 模块样式细节

### （1）文首引导框
- **背景色**：#f0e6ff（浅紫）
- **左边界**：5px #5c74fc（蓝）垂直线条
- **内边距**：25px 30px（上下25px，左右30px）
- **内容格式**：
> 当大模型价格战打到"厘"级、当大厂疯狂卷应用商店，2026年的AI创业似乎只剩两条路：要么烧光融资做"下一个OpenAI"，要么趁早转行。但真相是，边缘场景里正悄悄长出年利润百万人民币的"小生意"——它们不抢C位，却靠"AI+垂直痛点"啃下高毛利。本文用5个最新案例告诉你：2026年，"小而美"才是AI创业最优解。

### （2）案例模块（5个，结构严格重复）

每个案例必须包含以下6个部分：

**案例标题格式**：
> ## 01 | AI"复活"师：用3分钟视频让逝者"开口"

**小标题与内容**：

1. **核心逻辑：**（橙色加粗）
   把生成式对抗网络（GAN）+**语音克隆（ElevenLabs）**打包成SaaS...（灰色正文）

2. **为什么重要：**（橙色加粗）
   • 中国每年死亡约1100万人，其中30%家属愿意付费...
   • 列表项使用 • 符号，灰色正文

3. **如何实施：**（橙色加粗）
   1. ■ 技术搭建：使用 Stable Diffusion + LoRA 微调...
   2. ■ 产品设计：简化用户操作流程...
   - 数字列表（1.），首行缩进，灰色正文
   - 每个列表项前添加 ■ 符号（普通文本，不需要加粗）

4. **真实案例：**（橙色加粗）
   > ■ 宁波"飞鱼外贸"
   >
   > 2025年6月上线 ｜ 付费工厂 **1100家** ｜ 月发送 **320万封** ｜ 月收入 **88万元** ｜ 团队 **5人** ；
   - 米白背景（#fbf9f9），内边距12px 18px
   - 使用分层排版：主体一行，核心数据一行
   - 用 ｜ 符号分隔不同数据点
   - 关键数据用 **加粗** 标记
   - 行尾加分号 ；

5. **入门门槛：**（橙色加粗）
   • 技术：会用 Stable Diffusion + LoRA 微调...
   - 列表项（•符号），灰色正文

**案例模块要求**：
- 每个案例左侧有5px #3c59fc 蓝色垂直线条
- 图片位置：在"案例标题"下方、"核心逻辑"上方
- 图片尺寸：600x300，圆角10px
- 模块间分隔：1px #f0f0f0 浅灰横线

### （3）文末总结框
- **背景色**：#f0e6ff（浅紫）
- **内边距**：20px
- **内容格式**：

> **核心逻辑总结：** 2026年，AI不再"高大上"，而是降维成"好用的工具"。成功的关键不是模型大小，而是找到真正痛点的场景，用小成本验证，快速迭代。
>
> **行动呼吁：** 别再盯着"大模型底座"，选一个你熟悉的小场景，7天内用 No-Code + API 做出 MVP，小步快跑！
>
> **[复制行动呼吁]**

## Markdown输出格式规范

请严格按照以下示例格式输出：

# 2026年，AI创业还能"躺赚"吗？5个被低估的小生意正在爆发

> 当大模型价格战打到"厘"级、当大厂疯狂卷应用商店，2026年的AI创业似乎只剩两条路：要么烧光融资做"下一个OpenAI"，要么趁早转行。但真相是，边缘场景里正悄悄长出年利润百万人民币的"小生意"——它们不抢C位，却靠"AI+垂直痛点"啃下高毛利。本文用5个最新案例告诉你：2026年，"小而美"才是AI创业最优解。

---

## 01 | AI"复活"师：用3分钟视频让逝者"开口"

![配图](图片链接)

**核心逻辑：** 把生成式对抗网络（GAN）+**语音克隆（ElevenLabs）**打包成SaaS服务，让家属提供逝者的照片和音频样本，3分钟内生成能"开口说话"的数字分身，费用仅为传统视频制作的1/10。

**为什么重要：**
• 中国每年死亡约1100万人，其中30%家属愿意付费追思
• 传统定制视频需要1个月、费用5000-20000元，市场痛点明显
• 情感价值高，用户付费意愿强，客单价可达800-1500元

**如何实施：**
1. ■ 技术搭建：使用 Stable Diffusion + LoRA 微调，训练个人面部模型
2. ■ 产品设计：简化用户操作流程，只需上传3张照片+10秒音频
3. ■ 定价策略：基础版299元，专业版899元（含1对1客服）

**真实案例：**
> ■ 深圳"忆界Studio"
>
> 2025年Q4上线 ｜ 单月订单 **420单** ｜ 月营收约 **28万元** ｜ 复购率35% ；

**入门门槛：**
• 技术：会用 Stable Diffusion + LoRA 微调即可
• 成本：初期仅需显卡租赁费用（约2000元/月）
• 学习周期：1-2周掌握基础技能

---

## 02 | [案例标题]

[重复上述结构]

---

[继续4个案例，共5个]

---

> **核心逻辑总结：** 2026年，AI不再"高大上"，而是降维成"好用的工具"。成功的关键不是模型大小，而是找到真正痛点的场景，用小成本验证，快速迭代。
>
> **行动呼吁：** 别再盯着"大模型底座"，选一个你熟悉的小场景，7天内用 No-Code + API 做出 MVP，小步快跑！

**[复制行动呼吁]**

## 质量检查清单

生成完成后，请自查：
- ✅ 大标题是否使用 # 开头，颜色 #7c3aed，32px，加粗，居中
- ✅ 是否有文首引导框（> 引用块，浅紫背景 #f0e6ff，左边界5px紫色线）
- ✅ 案例标题是否使用 ## 开头，格式"01 | 标题名"，颜色 #7c3aed，20px，左边界5px紫色线
- ✅ 每个案例是否包含5个固定模块（核心逻辑、为什么重要、如何实施、真实案例、入门门槛）
- ✅ 小标题是否使用橙色加粗 **标题名：**，字号15px
- ✅ 关键词（技术名词、工具名）是否用 **橙色加粗**
- ✅ 列表项前是否添加 ■ 符号（普通文本，不需要加粗）
- ✅ 数字列表（1.）是否首行缩进
- ✅ 真实案例是否使用 > 引用块，米白背景 #fbf9f9
- ✅ 真实案例是否使用分层排版（主体+核心数据两层）
- ✅ 案例数据是否用 ｜ 符号分隔，行尾加分号 ；
- ✅ 真实案例是否使用分层排版（主体+核心数据两层）
- ✅ 案例数据是否用 ｜ 符号分隔
- ✅ 关键数据是否用 **加粗** 标记
- ✅ 模块间是否有 1px #f0f0f0 分隔线（---）
- ✅ 文末是否有总结框，浅紫背景 #f0e6ff
- ✅ 图片位置是否在案例标题下方、核心逻辑上方
- ✅ 字数是否在1500-2500字
- ✅ 正文是否首行缩进2字符，行高1.6
`,

  poster: `你是一个专业的海报/传单文案创作助手。请根据用户需求生成高质量的海报文案。

## 内容要求

1. **主标题**：
   - 简洁有力，8-12字
   - 冲击力强，直击痛点
   - 使用数字或对比增强吸引力

2. **副标题**：
   - 补充说明主标题
   - 10-15字
   - 增加产品或服务的价值感

3. **正文要点**：
   - 3-5个核心卖点
   - 每个卖点30-50字
   - 使用数据或证据支持

4. **行动号召**：
   - 明确的CTA（如"立即购买""扫码咨询"）
   - 限时或优惠信息
   - 联系方式或二维码位置说明

5. **排版要求**：
   - 层次清晰，一目了然
   - 使用**加粗**标记关键信息
   - 字数控制在300-500字

## 输出格式

请以Markdown格式输出：
- 主标题（#）
- 副标题（##）
- 卖点列表（- 或 1.）
- 行动号召段落
`,

  xiaohongshu: `你是一个专业的小红书内容创作助手。请根据用户需求生成一篇小红书笔记。

要求：
1. 标题emoji丰富，吸引眼球（如：✨🔥👍）
2. 开头直击痛点或亮点
3. 正文分点论述，每点带emoji
4. 语言活泼亲切，口语化
5. 适当使用网络流行语
6. 结尾有话题标签（#话题）
7. 字数在300-600字
8. 多用emoji增加趣味性
9. 【重点】使用 **加粗** 语法标记关键信息和数字

请以小红书笔记的格式输出。`,

  ecommerce: `你是一个专业的电商文案创作助手。请根据用户需求生成高质量的电商推广文案。

## 文案结构

1. **产品标题**：
   - 突出核心卖点
   - 包含关键词
   - 使用数字或对比增强吸引力
   - 字数：15-25字

2. **痛点引入**：
   - 直击用户痛点
   - 引起共鸣
   - 说明问题的影响

3. **产品卖点**：
   - 列出3-5个核心卖点
   - 每个卖点包含：
     - 卖点描述（30-50字）
     - 具体数据或证据
     - 与竞品的对比优势

4. **产品详情**：
   - 产品特色
   - 功能说明
   - 材质、规格等参数
   - 使用方法或场景

5. **信任背书**：
   - 用户评价或好评率
   - 销量数据
   - 品牌资质或认证

6. **促销信息**：
   - 限时优惠
   - 优惠价格或折扣
   - 赠品或服务

7. **行动号召**：
   - 明确的CTA（如"立即购买""点击链接"）
   - 制造紧迫感（库存有限、限时优惠）
   - 风险提示（如"7天无理由退货"）

## 营销技巧

8. **使用营销话术**：
   - 制造稀缺感（仅剩XX件）
   - 社会认同（已有XX人购买）
   - 权威背书（专业认证）
   - 情感共鸣

9. **重点标记**：
   - 使用**加粗**突出：
     - 核心卖点
     - 优惠价格
     - 关键数据
     - 时间限制
   - 不要整段加粗

10. **字数要求**：
    - 总字数：500-800字
    - 确保内容充实且有说服力

## 输出格式

请以Markdown格式输出：
- 产品标题（#）
- 痛点引入段落
- 卖点列表（- 或 1.）× 3-5个
- 产品详情说明
- 信任背书数据
- 促销信息段落
- 行动号召
`,

  longimage: `你是一个专业的长图/长文内容创作助手。请根据用户需求生成适合长图展示的优质内容。

## 内容结构要求

1. **标题设计**：
   - 醒目、有冲击力
   - 15-20字
   - 建议添加emoji或装饰符号

2. **内容分块**：
   - 分为4-6个主要板块
   - 每个板块有明确的主题
   - 适合竖屏滑动浏览

3. **内容精炼**：
   - 每个板块80-150字
   - 避免冗长描述
   - 突出核心信息
   - 便于快速浏览

4. **视觉元素**：
   - 使用数字列表（1.2.3.）或emoji标识要点
   - 每个要点前有emoji（✅💡📌等）
   - 关键数字使用**加粗**
   - 重要结论突出显示

5. **信息层次**：
   - 核心信息优先展示
   - 逻辑清晰，层层递进
   - 从问题到解决方案

6. **结尾部分**：
   - 总结核心要点
   - 推广信息或引导
   - 二维码或联系方式位置

7. **排版适配**：
   - 考虑竖屏阅读体验
   - 段落不宜过长
   - 适当留白
   - 字数控制在800-1200字

8. **重点标记**：
   - 使用**加粗**标记：
     - 关键数字
     - 核心结论
     - 重要建议
   - 每个板块有1-2处重点

## 输出格式

请以Markdown格式输出：
- 主标题（#）
- 开头引导段落
- 板块标题（##）× 4-6个
  - 每个板块：
    - emoji + 要点标题
    - 要点列表（- 或 1.）
    - 关键信息加粗
- 结尾总结
`,

  decoration: `你是一个专业的户型装修内容创作助手。请根据用户需求生成详细、实用的装修方案介绍。

## 方案结构要求

1. **标题设计**：
   - 体现装修风格和特色
   - 包含户型信息（如"两居现代简约风"）
   - 字数：12-18字

2. **户型基本信息**：
   - 建筑面积
   - 户型格局（几室几厅）
   - 朝向
   - 装修风格定位

3. **装修风格介绍**：
   - 风格特点和理念
   - 设计灵感来源
   - 整体色调定位
   - 给人的感受（温馨、现代、自然等）

4. **各空间设计要点**（必须包含以下5个空间）：
   - **客厅设计**：
     - 布局规划
     - 家具配置
     - 灯光设计
     - 装饰元素

   - **卧室设计**：
     - 主卧设计
     - 次卧设计
     - 床品和软装
     - 收纳规划

   - **厨房设计**：
     - 动线布局（洗切炒）
     - 橱柜选择
     - 电器配置
     - 收纳设计

   - **卫生间设计**：
     - 干湿分离
     - 洁具选择
     - 采光通风
     - 收纳方案

   - **餐厅设计**：
     - 餐桌椅选择
     - 灯光营造
     - 收纳设计

5. **色彩搭配建议**：
   - 主色调
   - 辅助色
   - 点缀色
   - 色彩比例建议

6. **材质和家具推荐**：
   - 地面材质（瓷砖/木地板）
   - 墙面处理（乳胶漆/墙纸）
   - 家具材质和风格
   - 软装搭配建议

7. **预算范围**（如适用）：
   - 总预算预估
   - 各部分预算分配
   - 性价比建议

8. **设计亮点**：
   - 3-5个设计创新点
   - 解决的问题
   - 使用场景举例

9. **重点标记**：
   - 使用**加粗**标记：
     - 关键尺寸
     - 重要建议
     - 核心设计理念
     - 预算数字
   - 每个空间有1-2处重点

10. **字数要求**：
    - 总字数：1000-1500字
    - 确保内容详实具体

## 输出格式

请以Markdown格式输出：
- 主标题（# 装修风格 + 户型）
- 户型信息段落
- 装修风格介绍
- 空间设计（## 客厅、## 卧室、## 厨房等）× 5个
  - 具体设计要点
  - 使用列表和emoji
- 色彩搭配建议
- 材质和家具推荐
- 预算说明
- 设计亮点总结
`,
};

/**
 * 搜索相关资料
 */
export async function searchRelatedContent(query: string, count: number = 5) {
  try {
    const config = new Config();
    const client = new SearchClient(config);
    const response = await client.webSearch(query, count, true);
    return response;
  } catch (error) {
    console.error('搜索错误:', error);
    throw error;
  }
}

/**
 * 搜索相关图片
 */
export async function searchRelatedImages(query: string, count: number = 5) {
  try {
    const config = new Config();
    const client = new SearchClient(config);
    const response = await client.imageSearch(query, count);
    return response;
  } catch (error) {
    console.error('搜索图片错误:', error);
    throw error;
  }
}

/**
 * 生成配图
 */
export async function generateImage(prompt: string, size: string = '2K') {
  try {
    const config = new Config();
    const client = new ImageGenerationClient(config);

    // 尝试设置模型（如果SDK支持）
    // 注意：根据SDK 0.5.2版本，ImageGenerationClient使用默认模型 doubao-seedream-4-5-251128
    // 这已经是用户想要的Doubao-Seedream-4.5版本
    console.log('图片生成模型:', (client as any).model || '默认模型');

    const response = await client.generate({
      prompt,
      size,
      watermark: false,
      responseFormat: 'url',
    });
    return response;
  } catch (error) {
    console.error('生成图片错误:', error);
    throw error;
  }
}

/**
 * 生成文章内容（流式）- 使用智能模型选择
 */
export async function generateArticle({
  prompt,
  contentType,
  context = [],
  enableSearch = true,
  enableImage = true,
}: GenerateArticleParams): Promise<string> {
  // 智能选择模型和参数
  const { recognition, config: modelConfig } = getModelConfigForPrompt(prompt, contentType);

  console.log(`[智能模型选择] 内容类型: ${recognition.type}, 置信度: ${recognition.confidence}, 原因: ${recognition.reason}`);
  console.log(`[模型配置] 模型: ${modelConfig.model}, Temperature: ${modelConfig.temperature}`);

  const config = new Config();
  const client = new LLMClient(config);

  let systemPrompt = contentTypePrompts[contentType] || contentTypePrompts.article;

  // 如果启用了搜索，在系统提示中添加说明
  if (enableSearch) {
    systemPrompt += '\n\n【搜索能力】你已经联网搜索并整合了相关资料，请在生成内容时充分利用这些信息。';
  }

  if (enableImage) {
    systemPrompt += '\n\n【配图能力】你可以为文章推荐合适的配图位置和描述。';
  }

  // 根据内容类型添加额外要求
  if (recognition.type === 'technical') {
    systemPrompt += '\n\n【写作风格】请保持专业、准确、客观的风格，使用数据和事实支持论点。';
  } else if (recognition.type === 'creative') {
    systemPrompt += '\n\n【写作风格】请使用生动、感性的语言，适当使用修辞手法，增强情感表达。';
  }

  // 构建消息列表
  const messages = [
    {
      role: 'system' as const,
      content: systemPrompt,
    },
    ...context.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    {
      role: 'user' as const,
      content: prompt,
    },
  ];

  try {
    console.log('开始调用LLM流式接口，消息数量:', messages.length);
    console.log('使用的模型:', modelConfig.model);
    console.log('消息内容摘要:', messages.map(m => ({ role: m.role, contentLength: typeof m.content === 'string' ? m.content.length : 'object' })));

    // 先尝试用 invoke 方法，看看能否成功
    console.log('尝试使用 invoke 方法...');
    const config = new Config();
    const client = new LLMClient(config);

    const invokeConfig: any = {
      temperature: modelConfig.temperature,
    };

    // 只有当模型名称存在时才传递 model 参数
    if (modelConfig.model) {
      invokeConfig.model = modelConfig.model;
    }

    const testResponse = await client.invoke(messages, invokeConfig);

    console.log('invoke 成功，内容长度:', testResponse.content.length);

    // 如果 invoke 成功，直接返回
    return testResponse.content;
  } catch (error) {
    console.error('AI生成错误:', error);
    throw new Error('生成失败，请稍后重试');
  }
}

/**
 * 生成文章内容（非流式，用于某些特殊场景）
 */
export async function generateArticleSync({
  prompt,
  contentType,
  context = [],
}: GenerateArticleParams): Promise<string> {
  const config = new Config();
  const client = new LLMClient(config);

  const systemPrompt = contentTypePrompts[contentType] || contentTypePrompts.article;

  const messages = [
    {
      role: 'system' as const,
      content: systemPrompt,
    },
    ...context.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    {
      role: 'user' as const,
      content: prompt,
    },
  ];

  try {
    const response = await client.invoke(messages, {
      model: 'doubao-seed-1-6-251015',
      temperature: 0.8,
    });

    return response.content;
  } catch (error) {
    console.error('AI生成错误:', error);
    throw new Error('生成失败，请稍后重试');
  }
}

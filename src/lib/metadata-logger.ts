/**
 * 生成元数据记录工具
 * 记录每次生成内容的元数据，便于分析和优化
 */

/**
 * 生成元数据接口
 */
export interface GenerationMetadata {
  id: string;
  timestamp: number;
  prompt: string;
  contentType: string;

  // 模型配置
  model: string;
  temperature: number;
  maxTokens?: number;

  // 识别信息
  recognizedType: string;
  recognitionConfidence: number;
  recognitionReason: string;

  // 搜索信息
  searchEnabled: boolean;
  searchResultsCount?: number;

  // 图片信息
  imageEnabled: boolean;
  imageCount?: number;
  imagePositions?: Array<{ position: string; url: string }>;

  // 生成结果
  contentLength: number;
  contentPreview: string; // 前100字

  // 性能指标
  generationTime: number; // 毫秒
  success: boolean;

  // 审核信息
  auditPassed: boolean;
  auditIssues?: string[];
}

/**
 * 元数据管理器
 */
export class MetadataLogger {
  private static instance: MetadataLogger;
  private logs: GenerationMetadata[] = [];

  private constructor() {}

  public static getInstance(): MetadataLogger {
    if (!MetadataLogger.instance) {
      MetadataLogger.instance = new MetadataLogger();
    }
    return MetadataLogger.instance;
  }

  /**
   * 记录生成元数据
   */
  public log(metadata: Partial<GenerationMetadata>): void {
    const fullMetadata: GenerationMetadata = {
      id: this.generateId(),
      timestamp: Date.now(),
      ...metadata,
    } as GenerationMetadata;

    this.logs.push(fullMetadata);

    // 在实际项目中，这里应该写入数据库或日志文件
    console.log('[元数据记录]', JSON.stringify({
      id: fullMetadata.id,
      model: fullMetadata.model,
      type: fullMetadata.contentType,
      success: fullMetadata.success,
      length: fullMetadata.contentLength,
    }));
  }

  /**
   * 获取所有记录
   */
  public getAllLogs(): GenerationMetadata[] {
    return [...this.logs];
  }

  /**
   * 获取成功的生成记录
   */
  public getSuccessLogs(): GenerationMetadata[] {
    return this.logs.filter(log => log.success);
  }

  /**
   * 获取失败的生成记录
   */
  public getFailedLogs(): GenerationMetadata[] {
    return this.logs.filter(log => !log.success);
  }

  /**
   * 按内容类型统计
   */
  public getStatisticsByType(): Record<string, { count: number; avgLength: number; successRate: number }> {
    const stats: Record<string, { count: number; totalLength: number; successCount: number }> = {};

    this.logs.forEach(log => {
      const type = log.contentType;
      if (!stats[type]) {
        stats[type] = { count: 0, totalLength: 0, successCount: 0 };
      }
      stats[type].count++;
      stats[type].totalLength += log.contentLength;
      if (log.success) {
        stats[type].successCount++;
      }
    });

    // 转换为最终格式
    const result: Record<string, { count: number; avgLength: number; successRate: number }> = {};
    Object.keys(stats).forEach(type => {
      const stat = stats[type];
      result[type] = {
        count: stat.count,
        avgLength: Math.round(stat.totalLength / stat.count),
        successRate: stat.successCount / stat.count,
      };
    });

    return result;
  }

  /**
   * 按模型统计
   */
  public getStatisticsByModel(): Record<string, { count: number; avgTemperature: number; successRate: number }> {
    const stats: Record<string, { count: number; totalTemperature: number; successCount: number }> = {};

    this.logs.forEach(log => {
      const model = log.model;
      if (!stats[model]) {
        stats[model] = { count: 0, totalTemperature: 0, successCount: 0 };
      }
      stats[model].count++;
      stats[model].totalTemperature += log.temperature;
      if (log.success) {
        stats[model].successCount++;
      }
    });

    const result: Record<string, { count: number; avgTemperature: number; successRate: number }> = {};
    Object.keys(stats).forEach(model => {
      const stat = stats[model];
      result[model] = {
        count: stat.count,
        avgTemperature: Number((stat.totalTemperature / stat.count).toFixed(2)),
        successRate: stat.successCount / stat.count,
      };
    });

    return result;
  }

  /**
   * 清空日志
   */
  public clearLogs(): void {
    this.logs = [];
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

/**
 * 便捷函数：记录生成元数据
 */
export function logGeneration(metadata: Partial<GenerationMetadata>): void {
  const logger = MetadataLogger.getInstance();
  logger.log(metadata);
}

import { NextRequest, NextResponse } from 'next/server';
import { getApiKeys, saveApiKeys, clearApiKeys } from '@/lib/api-key-storage';

export const runtime = 'nodejs';

/**
 * 获取 API Key 配置
 */
export async function GET(request: NextRequest) {
  try {
    const config = await getApiKeys();
    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('获取 API Key 配置失败:', error);
    return NextResponse.json(
      { success: false, error: '获取配置失败' },
      { status: 500 }
    );
  }
}

/**
 * 保存 API Key 配置
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { config } = body;

    if (!config || typeof config !== 'object') {
      return NextResponse.json(
        { success: false, error: '配置格式错误' },
        { status: 400 }
      );
    }

    // 验证配置格式
    const validKeys = ['deepseek', 'qwen', 'doubao', 'ark'];
    const filteredConfig: Record<string, string> = {};
    
    for (const key of validKeys) {
      if (config[key] && typeof config[key] === 'string' && config[key].trim()) {
        filteredConfig[key] = config[key].trim();
      }
    }

    const saved = await saveApiKeys(filteredConfig);
    
    if (saved) {
      return NextResponse.json({ success: true, message: '配置保存成功' });
    } else {
      return NextResponse.json(
        { success: false, error: '配置保存失败' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('保存 API Key 配置失败:', error);
    return NextResponse.json(
      { success: false, error: '保存配置失败' },
      { status: 500 }
    );
  }
}

/**
 * 清除 API Key 配置
 */
export async function DELETE(request: NextRequest) {
  try {
    await clearApiKeys();
    return NextResponse.json({ success: true, message: '配置已清除' });
  } catch (error) {
    console.error('清除 API Key 配置失败:', error);
    return NextResponse.json(
      { success: false, error: '清除配置失败' },
      { status: 500 }
    );
  }
}

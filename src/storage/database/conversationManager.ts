import { eq, desc, and } from "drizzle-orm";
import { getDb, isDbAvailable } from "./db";
import {
  conversations,
  messages,
  insertConversationSchema,
  updateConversationSchema,
  insertMessageSchema,
} from "./shared/schema";
import type {
  Conversation,
  InsertConversation,
  UpdateConversation,
  Message,
  InsertMessage,
} from "./shared/schema";

export class ConversationManager {
  /**
   * 创建新对话
   */
  async createConversation(data: InsertConversation): Promise<Conversation> {
    const db = await getDb();
    if (!db) {
      // 无数据库模式：返回临时对话对象
      const validated = insertConversationSchema.parse(data);
      return {
        id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: validated.title || '新对话',
        contentType: validated.contentType || 'article',
        metadata: validated.metadata || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    
    const validated = insertConversationSchema.parse(data);
    const [conversation] = await db
      .insert(conversations)
      .values(validated)
      .returning();
    return conversation;
  }

  /**
   * 获取对话列表
   */
  async getConversations(options: {
    skip?: number;
    limit?: number;
    contentType?: string;
  } = {}): Promise<Conversation[]> {
    const { skip = 0, limit = 50, contentType } = options;
    const db = await getDb();
    
    if (!db) {
      // 无数据库模式：返回空数组
      return [];
    }

    const conditions = [];
    if (contentType) {
      conditions.push(eq(conversations.contentType, contentType));
    }

    if (conditions.length > 0) {
      return db
        .select()
        .from(conversations)
        .where(and(...conditions))
        .orderBy(desc(conversations.updatedAt))
        .limit(limit)
        .offset(skip);
    }

    return db
      .select()
      .from(conversations)
      .orderBy(desc(conversations.updatedAt))
      .limit(limit)
      .offset(skip);
  }

  /**
   * 获取对话详情（包含消息）
   */
  async getConversationWithMessages(id: string): Promise<{
    conversation: Conversation | null;
    messages: Message[];
  }> {
    const db = await getDb();
    
    if (!db) {
      // 无数据库模式：返回空数据
      return { conversation: null, messages: [] };
    }

    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));

    if (!conversation) {
      return { conversation: null, messages: [] };
    }

    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);

    return { conversation, messages: conversationMessages };
  }

  /**
   * 获取单个对话
   */
  async getConversationById(id: string): Promise<Conversation | null> {
    const db = await getDb();
    
    if (!db) {
      // 无数据库模式：返回null
      return null;
    }
    
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return conversation || null;
  }

  /**
   * 更新对话
   */
  async updateConversation(
    id: string,
    data: UpdateConversation
  ): Promise<Conversation | null> {
    const db = await getDb();
    
    if (!db) {
      // 无数据库模式：返回null（无法更新）
      return null;
    }
    
    const validated = updateConversationSchema.parse(data);
    const [conversation] = await db
      .update(conversations)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return conversation || null;
  }

  /**
   * 删除对话（级联删除消息）
   */
  async deleteConversation(id: string): Promise<boolean> {
    const db = await getDb();
    
    if (!db) {
      // 无数据库模式：返回false（无法删除）
      return false;
    }
    
    const result = await db.delete(conversations).where(eq(conversations.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * 添加消息到对话
   */
  async addMessage(data: InsertMessage): Promise<Message> {
    const db = await getDb();
    
    if (!db) {
      // 无数据库模式：返回临时消息对象
      const validated = insertMessageSchema.parse(data);
      return {
        id: `temp_msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        conversationId: validated.conversationId,
        role: validated.role,
        content: validated.content,
        metadata: validated.metadata || null,
        createdAt: new Date(),
      };
    }
    
    const validated = insertMessageSchema.parse(data);
    const [message] = await db.insert(messages).values(validated).returning();

    // 更新对话的更新时间
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, data.conversationId));

    return message;
  }

  /**
   * 获取对话的消息列表
   */
  async getMessagesByConversationId(conversationId: string): Promise<Message[]> {
    const db = await getDb();
    
    if (!db) {
      // 无数据库模式：返回空数组
      return [];
    }
    
    return db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  /**
   * 删除消息
   */
  async deleteMessage(id: string): Promise<boolean> {
    const db = await getDb();
    
    if (!db) {
      // 无数据库模式：返回false（无法删除）
      return false;
    }
    
    const result = await db.delete(messages).where(eq(messages.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const conversationManager = new ConversationManager();

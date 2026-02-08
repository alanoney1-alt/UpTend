/**
 * SMS Bot Storage Domain
 *
 * Database operations for SMS conversations and messages
 */

import { eq, desc, and } from "drizzle-orm";
import { db } from "../../../db";
import {
  smsConversations,
  smsMessages,
  type SmsConversation,
  type InsertSmsConversation,
  type SmsMessage,
  type InsertSmsMessage,
} from "@shared/schema";

export interface ISmsBotStorage {
  getOrCreateSmsConversation(phoneNumber: string): Promise<SmsConversation>;
  getSmsConversation(id: string): Promise<SmsConversation | undefined>;
  getSmsConversationByPhone(phoneNumber: string): Promise<SmsConversation | undefined>;
  updateSmsConversation(id: string, updates: Partial<SmsConversation>): Promise<SmsConversation | undefined>;
  createSmsMessage(message: InsertSmsMessage): Promise<SmsMessage>;
  getSmsMessage(id: string): Promise<SmsMessage | undefined>;
  getSmsMessagesByConversation(conversationId: string, limit?: number): Promise<SmsMessage[]>;
  updateSmsMessage(id: string, updates: Partial<SmsMessage>): Promise<SmsMessage | undefined>;
  updateSmsMessageByTwilioSid(twilioMessageSid: string, updates: Partial<SmsMessage>): Promise<SmsMessage | undefined>;
}

export class SmsBotStorage implements ISmsBotStorage {
  async getOrCreateSmsConversation(phoneNumber: string): Promise<SmsConversation> {
    // Try to get existing conversation
    const existing = await this.getSmsConversationByPhone(phoneNumber);
    if (existing) {
      return existing;
    }

    // Create new conversation
    const [newConversation] = await db
      .insert(smsConversations)
      .values({
        phoneNumber,
        lastMessageAt: new Date().toISOString(),
        messageCount: 0,
        isActive: true,
        messagesLastHour: 0,
        lastHourResetAt: new Date().toISOString(),
      })
      .returning();

    return newConversation;
  }

  async getSmsConversation(id: string): Promise<SmsConversation | undefined> {
    const [conversation] = await db
      .select()
      .from(smsConversations)
      .where(eq(smsConversations.id, id));

    return conversation || undefined;
  }

  async getSmsConversationByPhone(phoneNumber: string): Promise<SmsConversation | undefined> {
    const [conversation] = await db
      .select()
      .from(smsConversations)
      .where(eq(smsConversations.phoneNumber, phoneNumber));

    return conversation || undefined;
  }

  async updateSmsConversation(
    id: string,
    updates: Partial<SmsConversation>
  ): Promise<SmsConversation | undefined> {
    const [updated] = await db
      .update(smsConversations)
      .set({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(smsConversations.id, id))
      .returning();

    return updated || undefined;
  }

  async createSmsMessage(message: InsertSmsMessage): Promise<SmsMessage> {
    const [newMessage] = await db
      .insert(smsMessages)
      .values({
        ...message,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return newMessage;
  }

  async getSmsMessage(id: string): Promise<SmsMessage | undefined> {
    const [message] = await db
      .select()
      .from(smsMessages)
      .where(eq(smsMessages.id, id));

    return message || undefined;
  }

  async getSmsMessagesByConversation(
    conversationId: string,
    limit: number = 50
  ): Promise<SmsMessage[]> {
    const messages = await db
      .select()
      .from(smsMessages)
      .where(eq(smsMessages.conversationId, conversationId))
      .orderBy(desc(smsMessages.createdAt))
      .limit(limit);

    return messages;
  }

  async updateSmsMessage(
    id: string,
    updates: Partial<SmsMessage>
  ): Promise<SmsMessage | undefined> {
    const [updated] = await db
      .update(smsMessages)
      .set(updates)
      .where(eq(smsMessages.id, id))
      .returning();

    return updated || undefined;
  }

  async updateSmsMessageByTwilioSid(
    twilioMessageSid: string,
    updates: Partial<SmsMessage>
  ): Promise<SmsMessage | undefined> {
    const [updated] = await db
      .update(smsMessages)
      .set(updates)
      .where(eq(smsMessages.twilioMessageSid, twilioMessageSid))
      .returning();

    return updated || undefined;
  }
}

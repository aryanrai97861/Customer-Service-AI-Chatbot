import { pgTable, serial, text, timestamp, uuid, pgEnum } from 'drizzle-orm/pg-core';

export const senderEnum = pgEnum('sender', ['user', 'ai']);

export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  created_at: timestamp('created_at').defaultNow(),
});

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  conversation_id: uuid('conversation_id').references(() => conversations.id).notNull(),
  sender: senderEnum('sender').notNull(),
  content: text('content').notNull(),
  created_at: timestamp('created_at').defaultNow(),
});

import fs from 'fs/promises';
import path from 'path';
import { Chat, ChatMessage, ChatFrontmatter } from '../models/Chat';
import { config } from '../utils/config';
import { formatDateTime } from '../utils/dateUtils';
import { parseFrontmatter, serializeFrontmatter } from '../utils/frontmatterParser';
import { ensureDir } from '../utils/fileSystem';

export class ChatService {
  private static chatDir = path.join(config.vaultPath, 'chat');

  /**
   * Get all chats sorted by modified date (newest first)
   */
  static async getAll(): Promise<Chat[]> {
    const chats: Chat[] = [];
    const years = await fs.readdir(this.chatDir, { withFileTypes: true });

    for (const yearEntry of years) {
      if (!yearEntry.isDirectory() || yearEntry.name === 'README.md') continue;

      const yearPath = path.join(this.chatDir, yearEntry.name);
      const months = await fs.readdir(yearPath, { withFileTypes: true });

      for (const monthEntry of months) {
        if (!monthEntry.isDirectory()) continue;

        const monthPath = path.join(yearPath, monthEntry.name);
        const files = await fs.readdir(monthPath);

        for (const file of files) {
          if (!file.endsWith('.md')) continue;

          const filePath = path.join(monthPath, file);
          try {
            const chat = await this.parseChat(filePath);
            chats.push(chat);
          } catch (error) {
            console.error(`Failed to parse chat ${filePath}:`, error);
          }
        }
      }
    }

    // Sort by modified date (newest first)
    chats.sort((a, b) =>
      new Date(b.frontmatter.modified).getTime() - new Date(a.frontmatter.modified).getTime()
    );

    return chats;
  }

  /**
   * Get chat by ID
   */
  static async getById(
    id: string,
    options: { limit?: number; skip?: number } = {}
  ): Promise<Chat | null> {
    // ID format: YYYYMMDD-HHMMSS-slug
    const year = id.substring(0, 4);
    const month = id.substring(4, 6);

    const monthPath = path.join(this.chatDir, year, month);
    const files = await fs.readdir(monthPath).catch(() => []);

    const file = files.find((f) => f.startsWith(id) && f.endsWith('.md'));
    if (!file) return null;

    const filePath = path.join(monthPath, file);
    return this.parseChat(filePath, options);
  }

  /**
   * Create a new chat
   */
  static async create(title: string, messages: ChatMessage[] = []): Promise<Chat> {
    const now = new Date();
    // Format as YYYYMMDDHHMMSS
    const id = now.toISOString().replace(/[-:T.]/g, '').substring(0, 14); // Removed '.' from replace, changed substring length
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50);
    const filename = `${id}-${slug}.md`;

    // Ensure chat directory structure exists
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const chatPath = path.join(this.chatDir, year, month);
    await ensureDir(chatPath);

    const frontmatter: ChatFrontmatter = {
      id,
      title,
      created: formatDateTime(now),
      modified: formatDateTime(now),
      tags: ['chat'],
      messageCount: messages.length,
    };

    const chat = new Chat(frontmatter, messages, path.join(chatPath, filename));
    await this.save(chat);

    return chat;
  }

  /**
   * Update an existing chat
   */
  static async update(chat: Chat): Promise<void> {
    chat.frontmatter.modified = formatDateTime(new Date());
    await this.save(chat);
  }

  /**
   * Delete a chat
   */
  static async delete(id: string): Promise<void> {
    const chat = await this.getById(id);
    if (!chat) {
      throw new Error(`Chat not found: ${id}`);
    }

    await fs.unlink(chat.filePath);
  }

  /**
   * Add a message to an existing chat
   */
  static async addMessage(
    id: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<Chat> {
    const chat = await this.getById(id);
    if (!chat) {
      throw new Error(`Chat not found: ${id}`);
    }

    chat.addMessage(role, content);
    await this.update(chat);

    return chat;
  }

  /**
   * Parse a chat file
   */
  private static async parseChat(
    filePath: string,
    options: { limit?: number; skip?: number } = {}
  ): Promise<Chat> {
    const content = await fs.readFile(filePath, 'utf-8');
    const { frontmatter, content: body } = parseFrontmatter(content);

    // Parse messages from markdown
    const messages: ChatMessage[] = [];
    const sections = body.split(/\n---\n/);

    for (const section of sections) {
      // Trim section to remove leading/trailing whitespace
      const trimmedSection = section.trim();
      const match = trimmedSection.match(/^## (User|Assistant)\n\n([\s\S]+)/);
      if (match) {
        const role = match[1].toLowerCase() as 'user' | 'assistant';
        const msgContent = match[2].trim();
        messages.push({
          role,
          content: msgContent,
          timestamp: frontmatter.modified, // Use modified as fallback
        });
      }
    }

    // Apply pagination if requested
    let paginatedMessages = messages;
    if (options.limit !== undefined || options.skip !== undefined) {
      const total = messages.length;
      const skip = options.skip || 0;
      const limit = options.limit || total;
      
      // Calculate slice indices from the end
      // Example: 100 messages. skip=0, limit=10 -> slice(90, 100)
      // skip=10, limit=10 -> slice(80, 90)
      const endIndex = Math.max(0, total - skip);
      const startIndex = Math.max(0, endIndex - limit);
      
      paginatedMessages = messages.slice(startIndex, endIndex);
    }

    // Cast frontmatter to ChatFrontmatter type
    const chatFrontmatter = frontmatter as unknown as ChatFrontmatter;
    // Ensure messageCount reflects the total on disk, not just the slice
    chatFrontmatter.messageCount = messages.length; 
    
    return new Chat(chatFrontmatter, paginatedMessages, filePath);
  }

  /**
   * Save a chat to disk
   */
  private static async save(chat: Chat): Promise<void> {
    const frontmatterStr = serializeFrontmatter(chat.frontmatter as any, '');
    const content = chat.getContent();
    const fullContent = `${frontmatterStr}\n${content}\n`;

    await fs.writeFile(chat.filePath, fullContent, 'utf-8');
  }

  /**
   * Get chat statistics
   */
  static async getStats() {
    const chats = await this.getAll();

    const totalMessages = chats.reduce((sum, chat) => sum + chat.frontmatter.messageCount, 0);
    const avgMessagesPerChat = chats.length > 0 ? Math.round(totalMessages / chats.length) : 0;

    // Get recent chats (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentChats = chats.filter(
      (chat) => new Date(chat.frontmatter.created) >= sevenDaysAgo
    );

    return {
      totalChats: chats.length,
      totalMessages,
      avgMessagesPerChat,
      recentChats: recentChats.length,
    };
  }
}

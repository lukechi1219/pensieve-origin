import { formatDateTime } from '../utils/dateUtils';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatFrontmatter {
  id: string;
  title: string;
  created: string;
  modified: string;
  tags: string[];
  model?: string;
  messageCount: number;
}

export class Chat {
  public frontmatter: ChatFrontmatter;
  public messages: ChatMessage[];
  public filePath: string;

  constructor(
    frontmatter: ChatFrontmatter,
    messages: ChatMessage[],
    filePath: string
  ) {
    this.frontmatter = frontmatter;
    this.messages = messages;
    this.filePath = filePath;
  }

  /**
   * Get chat content as markdown string
   */
  public getContent(): string {
    return this.messages
      .map((msg) => `## ${msg.role === 'user' ? 'User' : 'Assistant'}\n\n${msg.content}`)
      .join('\n\n---\n\n');
  }

  /**
   * Add a new message to the chat
   */
  public addMessage(role: 'user' | 'assistant', content: string): void {
    this.messages.push({
      role,
      content,
      timestamp: formatDateTime(new Date()),
    });
    this.frontmatter.messageCount = this.messages.length;
    this.frontmatter.modified = formatDateTime(new Date());
  }

  /**
   * Get chat summary (first 100 chars of first user message)
   */
  public getSummary(): string {
    const firstUserMessage = this.messages.find((m) => m.role === 'user');
    if (!firstUserMessage) return 'Empty chat';
    return firstUserMessage.content.substring(0, 100) + (firstUserMessage.content.length > 100 ? '...' : '');
  }

  /**
   * Convert to JSON-serializable object
   */
  public toJSON() {
    return {
      id: this.frontmatter.id,
      title: this.frontmatter.title,
      created: this.frontmatter.created,
      modified: this.frontmatter.modified,
      tags: this.frontmatter.tags,
      model: this.frontmatter.model,
      messageCount: this.frontmatter.messageCount,
      messages: this.messages,
      summary: this.getSummary(),
      filePath: this.filePath,
    };
  }
}

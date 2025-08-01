import { createHmac } from 'crypto';

export interface DingTalkConfig {
  webhook: string;
  secret?: string;
  keywords?: string[];
}

export interface DingTalkMessage {
  msgtype: 'text' | 'markdown' | 'link';
  text?: {
    content: string;
  };
  markdown?: {
    title: string;
    text: string;
  };
  link?: {
    title: string;
    text: string;
    picUrl?: string;
    messageUrl: string;
  };
  at?: {
    atMobiles?: string[];
    atUserIds?: string[];
    isAtAll?: boolean;
  };
}

export class DingTalkClient {
  constructor(private config: DingTalkConfig) {}

  private generateSign(): string | null {
    if (!this.config.secret) return null;
    
    const timestamp = Date.now();
    const stringToSign = `${timestamp}\n${this.config.secret}`;
    const sign = createHmac('sha256', this.config.secret)
      .update(stringToSign, 'utf8')
      .digest('base64');
    
    return `timestamp=${timestamp}&sign=${encodeURIComponent(sign)}`;
  }

  async sendMessage(message: DingTalkMessage): Promise<boolean> {
    try {
      const signParams = this.generateSign();
      const url = signParams 
        ? `${this.config.webhook}&${signParams}`
        : this.config.webhook;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      return result.errcode === 0;
    } catch (error) {
      console.error('DingTalk notification failed:', error);
      return false;
    }
  }

  async sendText(content: string, atAll = false): Promise<boolean> {
    return this.sendMessage({
      msgtype: 'text',
      text: { content },
      at: { isAtAll: atAll }
    });
  }

  async sendMarkdown(title: string, text: string, atAll = false): Promise<boolean> {
    return this.sendMessage({
      msgtype: 'markdown',
      markdown: { title, text },
      at: { isAtAll: atAll }
    });
  }

  async sendLink(title: string, text: string, messageUrl: string, picUrl?: string): Promise<boolean> {
    return this.sendMessage({
      msgtype: 'link',
      link: { title, text, messageUrl, picUrl }
    });
  }
}
#!/usr/bin/env node

/**
 * 简化版会话结束通知脚本
 * 用于在 Claude Code 对话结束后快速发送钉钉通知
 */

import { DingTalkClient } from './dingtalk.js';

interface QuickNotificationData {
  sessionType: string;
  duration: string;
  mainTasks: string[];
  summary: string;
  filesCount: number;
  toolsUsed: number;
}

class QuickSessionNotifier {
  private dingTalkClient: DingTalkClient | null = null;

  constructor() {
    this.initializeDingTalk();
  }

  private initializeDingTalk() {
    const webhook = process.env.DINGTALK_WEBHOOK;
    const secret = process.env.DINGTALK_SECRET;

    if (!webhook) {
      console.warn('⚠️  未配置 DINGTALK_WEBHOOK，将跳过通知发送');
      return;
    }

    this.dingTalkClient = new DingTalkClient({
      webhook,
      secret,
      keywords: process.env.DINGTALK_KEYWORDS?.split(',').map(k => k.trim())
    } as any);

    console.log('✅ 钉钉客户端初始化成功');
  }

  private detectSessionInfo(): QuickNotificationData {
    // 从命令行参数或环境变量获取会话信息
    const args = process.argv.slice(2);
    
    return {
      sessionType: args[0] || process.env.CLAUDE_SESSION_TYPE || '开发协助',
      duration: args[1] || process.env.CLAUDE_SESSION_DURATION || '未知时长',
      mainTasks: (args[2] || process.env.CLAUDE_MAIN_TASKS || '').split(',').filter(t => t.trim()),
      summary: args[3] || process.env.CLAUDE_SESSION_SUMMARY || '会话已完成',
      filesCount: parseInt(args[4] || process.env.CLAUDE_FILES_COUNT || '0'),
      toolsUsed: parseInt(args[5] || process.env.CLAUDE_TOOLS_USED || '0')
    };
  }

  private generateQuickNotification(data: QuickNotificationData): {title: string; content: string} {
    const now = new Date();
    const title = `🤖 Claude Code ${data.sessionType}完成`;
    
    const content = `## 🤖 Claude Code ${data.sessionType}完成

**完成时间：** ${now.toLocaleString('zh-CN')}
**会话时长：** ${data.duration}

### 📋 本次会话
${data.summary}

${data.mainTasks.length > 0 ? `
### ✅ 主要任务
${data.mainTasks.map(task => `- ${task.trim()}`).join('\\n')}
` : ''}

### 📊 操作统计
- **文件操作：** ${data.filesCount} 个
- **工具使用：** ${data.toolsUsed} 次

---
*Claude Code 自动通知 | ${now.toLocaleDateString('zh-CN')}*`;

    return { title, content };
  }

  async sendQuickNotification(): Promise<boolean> {
    if (!this.dingTalkClient) {
      console.log('⚠️  钉钉客户端未初始化，跳过通知发送');
      return false;
    }

    try {
      const sessionData = this.detectSessionInfo();
      const { title, content } = this.generateQuickNotification(sessionData);

      console.log('📤 正在发送钉钉通知...');
      const success = await this.dingTalkClient.sendMarkdown(title, content);

      if (success) {
        console.log('🎉 钉钉通知发送成功！');
        return true;
      } else {
        console.error('❌ 钉钉通知发送失败');
        return false;
      }
    } catch (error) {
      console.error('发送通知时出错:', error);
      return false;
    }
  }

  // 静态便捷方法
  static async quickSend(
    sessionType: string = '开发协助',
    duration: string = '刚刚完成',
    tasks: string[] = [],
    summary: string = '会话已完成',
    filesCount: number = 0,
    toolsUsed: number = 0
  ): Promise<boolean> {
    const notifier = new QuickSessionNotifier();
    
    // 临时设置环境变量
    process.env.CLAUDE_SESSION_TYPE = sessionType;
    process.env.CLAUDE_SESSION_DURATION = duration;
    process.env.CLAUDE_MAIN_TASKS = tasks.join(',');
    process.env.CLAUDE_SESSION_SUMMARY = summary;
    process.env.CLAUDE_FILES_COUNT = filesCount.toString();
    process.env.CLAUDE_TOOLS_USED = toolsUsed.toString();
    
    return await notifier.sendQuickNotification();
  }
}

export { QuickSessionNotifier };

// 命令行使用
if (import.meta.url === `file://${process.argv[1]}`) {
  const notifier = new QuickSessionNotifier();
  notifier.sendQuickNotification().then(success => {
    process.exit(success ? 0 : 1);
  });
}
#!/usr/bin/env node

/**
 * Claude Code 会话结束自动通知脚本
 * 在 Claude Code 会话结束时自动推送统计信息到钉钉
 */

import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface SessionStats {
  startTime: Date;
  endTime: Date;
  duration: string;
  messageCount: number;
  toolCalls: number;
  filesModified: string[];
  tasksCompleted: string[];
  errors: string[];
  summary: string;
}

class ClaudeCodeSessionNotifier {
  private sessionStats: SessionStats;
  private logFile: string;

  constructor() {
    this.logFile = process.env.CLAUDE_SESSION_LOG || './.claude-session.log';
    this.sessionStats = this.initializeSession();
  }

  private initializeSession(): SessionStats {
    return {
      startTime: new Date(),
      endTime: new Date(),
      duration: '0分钟',
      messageCount: 0,
      toolCalls: 0,
      filesModified: [],
      tasksCompleted: [],
      errors: [],
      summary: '待生成'
    };
  }

  // 从 Claude Code 日志中提取会话统计信息
  private extractSessionStats(): SessionStats {
    try {
      if (!existsSync(this.logFile)) {
        console.log('⚠️  未找到会话日志文件，使用默认统计');
        return this.sessionStats;
      }

      const logContent = readFileSync(this.logFile, 'utf-8');
      const lines = logContent.split('\\n').filter(line => line.trim());

      // 解析日志内容
      let messageCount = 0;
      let toolCalls = 0;
      const filesModified: Set<string> = new Set();
      const tasksCompleted: string[] = [];
      const errors: string[] = [];

      for (const line of lines) {
        // 统计消息数量
        if (line.includes('user:') || line.includes('assistant:')) {
          messageCount++;
        }

        // 统计工具调用
        if (line.includes('tool_use:') || line.includes('function_call:')) {
          toolCalls++;
        }

        // 统计修改的文件
        const fileMatch = line.match(/(?:edit|write|create).*?([\\w\\-\\/\\.]+\\.[\\w]+)/i);
        if (fileMatch) {
          filesModified.add(fileMatch[1]);
        }

        // 统计已完成任务
        if (line.includes('✅') || line.includes('completed') || line.includes('finished')) {
          const taskMatch = line.match(/(?:completed|finished|done):\\s*(.+)/i);
          if (taskMatch) {
            tasksCompleted.push(taskMatch[1].trim());
          }
        }

        // 收集错误信息
        if (line.includes('❌') || line.includes('error') || line.includes('failed')) {
          errors.push(line.trim());
        }
      }

      const endTime = new Date();
      const duration = this.formatDuration(this.sessionStats.startTime, endTime);

      return {
        ...this.sessionStats,
        endTime,
        duration,
        messageCount,
        toolCalls,
        filesModified: Array.from(filesModified),
        tasksCompleted,
        errors: errors.slice(0, 5), // 只保留前5个错误
        summary: this.generateSummary(messageCount, toolCalls, Array.from(filesModified), tasksCompleted)
      };

    } catch (error) {
      console.error('解析会话日志失败:', error);
      return this.sessionStats;
    }
  }

  private formatDuration(start: Date, end: Date): string {
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins}分钟`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}小时${mins}分钟`;
    }
  }

  private generateSummary(messages: number, tools: number, files: string[], tasks: string[]): string {
    const parts = [];
    
    if (messages > 0) parts.push(`${messages}条对话`);
    if (tools > 0) parts.push(`${tools}次工具调用`);
    if (files.length > 0) parts.push(`${files.length}个文件修改`);
    if (tasks.length > 0) parts.push(`${tasks.length}个任务完成`);
    
    return parts.length > 0 ? parts.join('，') : '会话已结束';
  }

  // 生成钉钉通知内容
  private generateNotificationContent(stats: SessionStats): {title: string; content: string} {
    const title = `🤖 Claude Code 会话完成`;
    
    const content = `## 🤖 Claude Code 会话完成

**会话时间：** ${stats.startTime.toLocaleString('zh-CN')} - ${stats.endTime.toLocaleString('zh-CN')}
**持续时长：** ${stats.duration}

### 📊 会话统计
- **对话消息：** ${stats.messageCount} 条
- **工具调用：** ${stats.toolCalls} 次
- **文件操作：** ${stats.filesModified.length} 个文件
- **任务完成：** ${stats.tasksCompleted.length} 个

${stats.filesModified.length > 0 ? `
### 📝 修改文件
${stats.filesModified.slice(0, 10).map(file => `- ${file}`).join('\\n')}
${stats.filesModified.length > 10 ? `- ...还有 ${stats.filesModified.length - 10} 个文件` : ''}
` : ''}

${stats.tasksCompleted.length > 0 ? `
### ✅ 完成任务
${stats.tasksCompleted.slice(0, 5).map(task => `- ${task}`).join('\\n')}
${stats.tasksCompleted.length > 5 ? `- ...还有 ${stats.tasksCompleted.length - 5} 个任务` : ''}
` : ''}

${stats.errors.length > 0 ? `
### ⚠️ 错误记录
${stats.errors.slice(0, 3).map(error => `- ${error}`).join('\\n')}
${stats.errors.length > 3 ? `- ...还有 ${stats.errors.length - 3} 个错误` : ''}
` : ''}

### 📋 会话摘要
${stats.summary}

---
*自动生成 | Claude Code 会话监控*`;

    return { title, content };
  }

  // 发送钉钉通知
  private async sendDingTalkNotification(title: string, content: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        // 使用我们的 MCP Server 发送通知
        const mcpProcess = spawn('node', [
          join(__dirname, 'index.js')
        ], {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: {
            ...process.env,
            // 确保环境变量可用
            DINGTALK_WEBHOOK: process.env.DINGTALK_WEBHOOK,
            DINGTALK_SECRET: process.env.DINGTALK_SECRET
          }
        });

        // 发送 MCP 请求
        const mcpRequest = {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: 'dingtalk_send_markdown',
            arguments: {
              title,
              text: content,
              atAll: false
            }
          }
        };

        mcpProcess.stdin.write(JSON.stringify(mcpRequest) + '\\n');
        mcpProcess.stdin.end();

        let response = '';
        mcpProcess.stdout.on('data', (data) => {
          response += data.toString();
        });

        mcpProcess.on('close', (code) => {
          if (code === 0) {
            console.log('✅ 钉钉通知发送成功');
            resolve(true);
          } else {
            console.error('❌ 钉钉通知发送失败');
            resolve(false);
          }
        });

        mcpProcess.on('error', (error) => {
          console.error('钉钉通知发送错误:', error);
          resolve(false);
        });

      } catch (error) {
        console.error('发送钉钉通知异常:', error);
        resolve(false);
      }
    });
  }

  // 主要执行函数
  async execute(): Promise<void> {
    console.log('🚀 开始生成会话结束通知...');

    // 1. 提取会话统计信息
    const stats = this.extractSessionStats();
    console.log('📊 会话统计信息:', {
      duration: stats.duration,
      messages: stats.messageCount,
      tools: stats.toolCalls,
      files: stats.filesModified.length,
      tasks: stats.tasksCompleted.length
    });

    // 2. 生成通知内容
    const { title, content } = this.generateNotificationContent(stats);

    // 3. 检查钉钉配置
    if (!process.env.DINGTALK_WEBHOOK) {
      console.warn('⚠️  未配置钉钉 Webhook，跳过通知发送');
      console.log('💡 设置环境变量 DINGTALK_WEBHOOK 以启用自动通知');
      return;
    }

    // 4. 发送钉钉通知
    console.log('📤 正在发送钉钉通知...');
    const success = await this.sendDingTalkNotification(title, content);

    if (success) {
      console.log('🎉 会话结束通知发送完成！');
    } else {
      console.log('❌ 通知发送失败，请检查钉钉配置');
    }
  }
}

// 导出供外部使用
export { ClaudeCodeSessionNotifier };

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  const notifier = new ClaudeCodeSessionNotifier();
  notifier.execute().catch(console.error);
}
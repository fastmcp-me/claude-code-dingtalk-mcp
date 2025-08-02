#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { DingTalkClient, DingTalkConfig } from './dingtalk.js';
import { execSync } from 'child_process';

class DingTalkMCPServer {
  private server: Server;
  private dingTalkClient: DingTalkClient | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'dingtalk-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    this.initializeFromEnv();
  }

  private getGitUsername(): string {
    try {
      const username = execSync('git config --get user.name', { encoding: 'utf8' }).trim();
      return username || 'Unknown User';
    } catch (error) {
      return 'Unknown User';
    }
  }

  private initializeFromEnv() {
    const webhook = process.env.DINGTALK_WEBHOOK;
    const secret = process.env.DINGTALK_SECRET;
    const keywords = process.env.DINGTALK_KEYWORDS;

    if (webhook) {
      const config: DingTalkConfig = {
        webhook,
        secret,
        keywords: keywords ? keywords.split(',').map(k => k.trim()) : undefined
      };
      this.dingTalkClient = new DingTalkClient(config);
      console.error('✅ DingTalk client initialized from environment variables');
    }
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'dingtalk_configure',
            description: 'Configure DingTalk webhook settings',
            inputSchema: {
              type: 'object',
              properties: {
                webhook: {
                  type: 'string',
                  description: 'DingTalk webhook URL with access token',
                },
                secret: {
                  type: 'string',
                  description: 'Optional secret for signature verification',
                },
                keywords: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Optional keywords for security validation',
                },
              },
              required: ['webhook'],
            },
          },
          {
            name: 'dingtalk_send_text',
            description: 'Send a text message to DingTalk group',
            inputSchema: {
              type: 'object',
              properties: {
                content: {
                  type: 'string',
                  description: 'Text content to send',
                },
                atAll: {
                  type: 'boolean',
                  description: 'Whether to @all members',
                  default: false,
                },
              },
              required: ['content'],
            },
          },
          {
            name: 'dingtalk_send_markdown',
            description: 'Send a markdown message to DingTalk group',
            inputSchema: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: 'Message title',
                },
                text: {
                  type: 'string',
                  description: 'Markdown formatted text content',
                },
                atAll: {
                  type: 'boolean',
                  description: 'Whether to @all members',
                  default: false,
                },
              },
              required: ['title', 'text'],
            },
          },
          {
            name: 'dingtalk_send_link',
            description: 'Send a link message to DingTalk group',
            inputSchema: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: 'Link title',
                },
                text: {
                  type: 'string',
                  description: 'Link description text',
                },
                messageUrl: {
                  type: 'string',
                  description: 'Target URL',
                },
                picUrl: {
                  type: 'string',
                  description: 'Optional image URL',
                },
              },
              required: ['title', 'text', 'messageUrl'],
            },
          },
          {
            name: 'dingtalk_notify_session_end',
            description: 'Send a session completion notification with automatic stats',
            inputSchema: {
              type: 'object',
              properties: {
                sessionType: {
                  type: 'string',
                  description: 'Type of session (e.g., "开发协助", "代码审查", "问题解决")',
                  default: '开发协助'
                },
                duration: {
                  type: 'string',
                  description: 'Session duration (e.g., "30分钟", "1小时20分")',
                },
                mainTasks: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'List of main tasks completed in this session',
                },
                summary: {
                  type: 'string',
                  description: 'Brief summary of the session',
                  default: '会话已完成'
                },
                filesCount: {
                  type: 'number',
                  description: 'Number of files modified/created',
                  default: 0
                },
                toolsUsed: {
                  type: 'number', 
                  description: 'Number of tools/commands used',
                  default: 0
                },
                atAll: {
                  type: 'boolean',
                  description: 'Whether to @all members',
                  default: false
                }
              },
              required: []
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'dingtalk_configure':
            return await this.handleConfigure(args as unknown as DingTalkConfig);

          case 'dingtalk_send_text':
            return await this.handleSendText(args as unknown as { content: string; atAll?: boolean });

          case 'dingtalk_send_markdown':
            return await this.handleSendMarkdown(args as unknown as { title: string; text: string; atAll?: boolean });

          case 'dingtalk_send_link':
            return await this.handleSendLink(args as unknown as { title: string; text: string; messageUrl: string; picUrl?: string });

          case 'dingtalk_notify_session_end':
            return await this.handleNotifySessionEnd(args as unknown as {
              sessionType?: string;
              duration?: string;
              mainTasks?: string[];
              summary?: string;
              filesCount?: number;
              toolsUsed?: number;
              atAll?: boolean;
            });

          case 'dingtalk_notify_task_complete':
            return await this.handleNotifyTaskComplete(args as unknown as {
              taskName: string;
              status: 'success' | 'failed' | 'warning';
              details?: string;
              duration?: string;
              atAll?: boolean;
            });

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });
  }

  private async handleConfigure(config: DingTalkConfig) {
    this.dingTalkClient = new DingTalkClient(config);
    return {
      content: [
        {
          type: 'text',
          text: '✅ DingTalk client configured successfully',
        },
      ],
    };
  }

  private async handleSendText(args: { content: string; atAll?: boolean }) {
    if (!this.dingTalkClient) {
      throw new Error('DingTalk client not configured. Use dingtalk_configure first or set environment variables (DINGTALK_WEBHOOK, DINGTALK_SECRET).');
    }

    const gitUsername = this.getGitUsername();
    const contentWithUser = `${args.content}\n\n---\n👤 发送者: ${gitUsername}`;

    const success = await this.dingTalkClient.sendText(contentWithUser, args.atAll);
    return {
      content: [
        {
          type: 'text',
          text: success 
            ? '✅ Text message sent successfully' 
            : '❌ Failed to send text message',
        },
      ],
    };
  }

  private async handleSendMarkdown(args: { title: string; text: string; atAll?: boolean }) {
    if (!this.dingTalkClient) {
      throw new Error('DingTalk client not configured. Use dingtalk_configure first or set environment variables (DINGTALK_WEBHOOK, DINGTALK_SECRET).');
    }

    const gitUsername = this.getGitUsername();
    const textWithUser = `${args.text}\n\n---\n👤 **发送者:** ${gitUsername}`;

    const success = await this.dingTalkClient.sendMarkdown(args.title, textWithUser, args.atAll);
    return {
      content: [
        {
          type: 'text',
          text: success 
            ? '✅ Markdown message sent successfully' 
            : '❌ Failed to send markdown message',
        },
      ],
    };
  }

  private async handleSendLink(args: { title: string; text: string; messageUrl: string; picUrl?: string }) {
    if (!this.dingTalkClient) {
      throw new Error('DingTalk client not configured. Use dingtalk_configure first or set environment variables (DINGTALK_WEBHOOK, DINGTALK_SECRET).');
    }

    const success = await this.dingTalkClient.sendLink(args.title, args.text, args.messageUrl, args.picUrl);
    return {
      content: [
        {
          type: 'text',
          text: success 
            ? '✅ Link message sent successfully' 
            : '❌ Failed to send link message',
        },
      ],
    };
  }

  private async handleNotifySessionEnd(args: {
    sessionType?: string;
    duration?: string;
    mainTasks?: string[];
    summary?: string;
    filesCount?: number;
    toolsUsed?: number;
    atAll?: boolean;
  }) {
    if (!this.dingTalkClient) {
      throw new Error('DingTalk client not configured. Use dingtalk_configure first or set environment variables (DINGTALK_WEBHOOK, DINGTALK_SECRET).');
    }

    const sessionType = args.sessionType || '开发协助';
    const duration = args.duration || '刚刚完成';
    const mainTasks = args.mainTasks || [];
    const summary = args.summary || '会话已完成';
    const filesCount = args.filesCount || 0;
    const toolsUsed = args.toolsUsed || 0;

    const now = new Date();
    const gitUsername = this.getGitUsername();
    const title = `🤖 Claude Code ${sessionType}完成`;
    
    let content = `## 🤖 Claude Code ${sessionType}完成

**完成时间：** ${now.toLocaleString('zh-CN')}
**会话时长：** ${duration}
**操作者：** ${gitUsername}

### 📋 本次会话
${summary}`;

    if (mainTasks.length > 0) {
      content += `

### ✅ 主要任务
${mainTasks.map(task => `- ${task.trim()}`).join('\n')}`;
    }

    content += `

### 📊 操作统计
- **文件操作：** ${filesCount} 个
- **工具使用：** ${toolsUsed} 次

---
*Claude Code 自动通知 | ${now.toLocaleDateString('zh-CN')}*`;

    const success = await this.dingTalkClient.sendMarkdown(title, content, args.atAll);

    return {
      content: [
        {
          type: 'text',
          text: success 
            ? '✅ Session completion notification sent successfully' 
            : '❌ Failed to send session completion notification',
        },
      ],
    };
  }

  private async handleNotifyTaskComplete(args: {
    taskName: string;
    status: 'success' | 'failed' | 'warning';
    details?: string;
    duration?: string;
    atAll?: boolean;
  }) {
    if (!this.dingTalkClient) {
      throw new Error('DingTalk client not configured. Use dingtalk_configure first or set environment variables (DINGTALK_WEBHOOK, DINGTALK_SECRET).');
    }

    const statusEmoji = {
      success: '✅',
      failed: '❌',
      warning: '⚠️'
    };

    const statusText = {
      success: '任务完成',
      failed: '任务失败',
      warning: '任务警告'
    };

    const timestamp = new Date().toLocaleString('zh-CN');
    const gitUsername = this.getGitUsername();
    
    let markdownText = `## ${statusEmoji[args.status]} ${statusText[args.status]}

**任务名称：** ${args.taskName}
**状态：** ${statusText[args.status]}
**时间：** ${timestamp}
**操作者：** ${gitUsername}`;

    if (args.duration) {
      markdownText += `\n**耗时：** ${args.duration}`;
    }

    if (args.details) {
      markdownText += `\n\n**详情：**\n${args.details}`;
    }

    markdownText += '\n\n---\n*来自 Claude Code MCP Server*';

    const success = await this.dingTalkClient.sendMarkdown(
      `${statusEmoji[args.status]} ${args.taskName} - ${statusText[args.status]}`,
      markdownText,
      args.atAll
    );

    return {
      content: [
        {
          type: 'text',
          text: success 
            ? '✅ Task completion notification sent successfully' 
            : '❌ Failed to send task completion notification',
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('DingTalk MCP server running on stdio');
  }
}

const server = new DingTalkMCPServer();
server.run().catch(console.error);
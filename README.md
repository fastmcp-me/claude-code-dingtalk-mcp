# 🔔 Claude Code DingTalk MCP Server

**Claude Code 集成钉钉机器人通知的 MCP Server 实现**

[![npm version](https://badge.fury.io/js/claude-code-dingtalk-mcp.svg)](https://badge.fury.io/js/claude-code-dingtalk-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

## 📋 功能特性

- ✅ **环境变量配置** - 支持通过环境变量自动初始化，无需手动配置
- ✅ **钉钉群机器人集成** - 完整的 Webhook API 支持
- ✅ **多种消息格式** - 支持文本、Markdown、链接三种消息类型
- ✅ **安全签名验证** - 支持 HMAC-SHA256 签名验证
- ✅ **专用任务通知** - 格式化的任务完成通知模板
- ✅ **TypeScript 开发** - 完整的类型安全和智能提示
- ✅ **即插即用** - 与 Claude Code 无缝集成

## 🚀 5分钟快速开始

### 第1步：安装
```bash
npm install -g claude-code-dingtalk-mcp
```

### 第2步：获取钉钉机器人信息
1. 钉钉群 → 群设置 → 智能群助手 → 添加机器人 → 自定义
2. 安全设置选择"加签"，获取 Webhook URL 和密钥

### 第3步：配置环境变量
```bash
export DINGTALK_WEBHOOK="https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN"
export DINGTALK_SECRET="YOUR_SECRET"
```

### 第4步：配置 Claude Code
创建 `.mcp.json` 文件：
```json
{"mcpServers": {"dingtalk-notifications": {"command": "dingtalk-mcp-server"}}}
```

### 第5步：测试
重启 Claude Code，然后运行：
```bash
dingtalk_send_text {"content": "测试成功！"}
```

✅ **完成！现在可以在每次对话结束时调用 `dingtalk_notify_session_end` 发送通知**

---

### 方法一：npm 安装（推荐）

```bash
npm install -g claude-code-dingtalk-mcp
```

### 方法二：通过 MCP 管理器安装

```bash
# 如果您的 Claude Code 支持 MCP 管理器
npx @modelcontextprotocol/cli add claude-code-dingtalk-mcp
```

### 方法三：直接使用 npx

```bash
# 无需安装，直接使用
npx claude-code-dingtalk-mcp
```

## ⚙️ Claude Code 对接配置

### 第一步：安装钉钉 MCP Server

选择以下任一方式安装：

```bash
# 方式1：全局安装（推荐）
npm install -g claude-code-dingtalk-mcp

# 方式2：项目本地安装  
npm install claude-code-dingtalk-mcp

# 方式3：直接使用（无需安装）
npx claude-code-dingtalk-mcp
```

### 第二步：配置 Claude Code

在您的项目根目录或 Claude Code 全局配置目录创建/编辑 `.mcp.json` 文件：

**全局安装方式：**
```json
{
  "mcpServers": {
    "dingtalk-notifications": {
      "command": "dingtalk-mcp-server",
      "description": "钉钉通知服务器"
    }
  }
}
```

**本地安装方式：**
```json
{
  "mcpServers": {
    "dingtalk-notifications": {
      "command": "node",
      "args": ["./node_modules/claude-code-dingtalk-mcp/dist/index.js"],
      "description": "钉钉通知服务器"
    }
  }
}
```

**NPX 方式：**
```json
{
  "mcpServers": {
    "dingtalk-notifications": {
      "command": "npx", 
      "args": ["claude-code-dingtalk-mcp"],
      "description": "钉钉通知服务器"
    }
  }
}
```

### 第三步：配置钉钉机器人

#### 3.1 创建钉钉群机器人

1. 在钉钉群中：**群设置** → **智能群助手** → **添加机器人**
2. 选择 **"自定义"** 机器人
3. 设置机器人名称（如：Claude Code 通知）
4. **重要**：选择安全设置 → **加签**（推荐）
5. 复制生成的 **Webhook URL** 和 **签名密钥**

#### 3.2 设置环境变量

**方式1：系统环境变量**
```bash
# 添加到 ~/.bashrc 或 ~/.zshrc
export DINGTALK_WEBHOOK="https://oapi.dingtalk.com/robot/send?access_token=YOUR_ACCESS_TOKEN"
export DINGTALK_SECRET="YOUR_SECRET_KEY"
export DINGTALK_KEYWORDS="Claude,任务完成,通知"  # 可选
```

**方式2：项目 .env 文件**
```bash
# 在项目根目录创建 .env 文件
DINGTALK_WEBHOOK=https://oapi.dingtalk.com/robot/send?access_token=YOUR_ACCESS_TOKEN
DINGTALK_SECRET=YOUR_SECRET_KEY
DINGTALK_KEYWORDS=Claude,任务完成,通知
```

### 第四步：重启 Claude Code

```bash
# 重启 Claude Code 以加载新的 MCP 配置
claude code restart
# 或者关闭 Claude Code 后重新打开
```

### 第五步：验证配置

在 Claude Code 中运行以下命令测试：

```bash
# 测试基本连接
dingtalk_send_text {"content": "🎉 Claude Code 钉钉通知测试成功！"}

# 测试会话结束通知
dingtalk_notify_session_end {
  "sessionType": "配置测试",
  "summary": "成功配置了 Claude Code 钉钉通知功能"
}
```

## 📍 配置文件位置

Claude Code 会在以下位置查找 `.mcp.json` 配置：

1. **当前项目目录**：`./mcp.json` 或 `./.mcp.json`
2. **用户主目录**：`~/.claude/mcp.json`
3. **全局配置**：`~/.config/claude-code/mcp.json`

## 🔍 常见问题

**Q: 提示找不到 dingtalk_xxx 命令？**
A: 检查 `.mcp.json` 配置是否正确，重启 Claude Code

**Q: 钉钉通知发送失败？**  
A: 检查环境变量配置，确保 Webhook URL 和密钥正确

**Q: 如何确认 MCP Server 是否运行？**
A: 在 Claude Code 中输入 `dingtalk_` 按 Tab 键，应该会显示可用命令

**Q: 支持团队共享配置吗？**
A: 是的，将 `.mcp.json` 提交到代码仓库即可团队共享

## 🛠️ 使用方法

### 自动初始化（推荐）

如果您已设置环境变量，MCP Server 将自动初始化，无需手动配置：

```bash
# 直接发送通知，无需配置步骤
dingtalk_notify_task_complete {
  "taskName": "项目构建",
  "status": "success",
  "details": "构建成功，所有测试通过",
  "duration": "2分30秒"
}
```

### 手动配置方式

如果未设置环境变量，可以在 Claude Code 中手动配置：

```bash
dingtalk_configure {
  "webhook": "https://oapi.dingtalk.com/robot/send?access_token=YOUR_ACCESS_TOKEN",
  "secret": "YOUR_SECRET_KEY"
}
```

## 📖 可用工具

### 1. `dingtalk_configure`
手动配置钉钉机器人设置

**参数：**
- `webhook` (必需): 钉钉机器人 Webhook URL
- `secret` (可选): 签名验证密钥
- `keywords` (可选): 安全关键字数组

### 2. `dingtalk_send_text`
发送文本消息

**参数：**
- `content` (必需): 文本内容
- `atAll` (可选): 是否 @所有人，默认 false

### 3. `dingtalk_send_markdown`
发送 Markdown 格式消息

**参数：**
- `title` (必需): 消息标题
- `text` (必需): Markdown 格式文本内容
- `atAll` (可选): 是否 @所有人，默认 false

### 4. `dingtalk_send_link`
发送链接消息

**参数：**
- `title` (必需): 链接标题
- `text` (必需): 链接描述文本
- `messageUrl` (必需): 目标 URL
- `picUrl` (可选): 图片 URL

### 6. `dingtalk_notify_session_end`
发送会话结束通知（**新功能**）

**参数：**
- `sessionType` (可选): 会话类型，如 "开发协助"、"代码审查"、"问题解决"，默认 "开发协助"
- `duration` (可选): 会话时长，如 "30分钟"、"1小时20分"
- `mainTasks` (可选): 主要任务列表
- `summary` (可选): 会话摘要，默认 "会话已完成"
- `filesCount` (可选): 修改/创建的文件数量，默认 0
- `toolsUsed` (可选): 使用的工具/命令数量，默认 0
- `atAll` (可选): 是否 @所有人，默认 false

## 🎯 自动会话结束通知

**重要功能**：每次 Claude Code 对话完成后，自动推送通知到钉钉群！

### 方法一：直接调用（推荐）

在 Claude Code 对话即将结束时，直接调用：

```bash
dingtalk_notify_session_end {
  "sessionType": "开发协助",
  "duration": "45分钟", 
  "mainTasks": ["实现钉钉MCP Server", "添加环境变量支持", "编写使用文档"],
  "summary": "成功开发并部署了钉钉通知MCP Server，支持多种消息格式和自动会话通知",
  "filesCount": 8,
  "toolsUsed": 15
}
```

### 方法二：环境变量触发

设置环境变量后，使用脚本自动触发：

```bash
# 设置会话信息
export CLAUDE_SESSION_TYPE="代码审查"
export CLAUDE_SESSION_DURATION="30分钟"
export CLAUDE_MAIN_TASKS="代码质量检查,安全漏洞扫描,性能优化建议"
export CLAUDE_SESSION_SUMMARY="完成了全面的代码审查，发现并修复了3个安全问题"
export CLAUDE_FILES_COUNT="5"
export CLAUDE_TOOLS_USED="12"

# 触发通知
npm run notify-session-end
```

### 方法三：Claude Code Hooks（自动化）

安装钩子后，每次会话结束自动触发：

```bash
# 安装钩子
./claude-hook.sh install

# 钩子会在 Claude Code 会话结束时自动运行
# 无需手动操作！
```

## 💡 使用示例

### 任务完成通知

```bash
dingtalk_notify_task_complete {
  "taskName": "代码部署",
  "status": "success",
  "details": "✅ 部署到生产环境成功\\n- 版本: v2.1.0\\n- 测试: 100% 通过\\n- 性能: 优化 15%",
  "duration": "3分45秒"
}
```

### 发送 Markdown 消息

```bash
dingtalk_send_markdown {
  "title": "📊 每日构建报告",
  "text": "## 📊 每日构建报告\\n\\n**日期**: 2025-01-15\\n**状态**: ✅ 成功\\n\\n### 📈 统计数据\\n- 构建次数: 12\\n- 成功率: 100%\\n- 平均耗时: 2分15秒\\n\\n### 🔧 修复问题\\n- 修复了登录超时问题\\n- 优化了数据库查询性能\\n\\n---\\n*来自 Claude Code 自动化构建*"
}
```

### 发送简单文本

```bash
dingtalk_send_text {
  "content": "🎉 代码审查完成！所有检查项目都已通过，可以开始合并到主分支。",
  "atAll": false
}
```

## 🔧 钉钉机器人配置

### 1. 创建钉钉群机器人

1. 在钉钉群中，点击群设置 → 智能群助手 → 添加机器人
2. 选择"自定义"机器人
3. 设置机器人名称和头像
4. **重要**：配置安全设置（推荐使用"加签"方式）
5. 获取 Webhook URL 和签名密钥

### 2. 安全设置说明

- **关键词验证**：消息中必须包含设定的关键词
- **加签验证**：使用 HMAC-SHA256 签名验证（**推荐**）
- **IP 白名单**：限制请求来源 IP

### 3. 获取配置信息

```bash
# Webhook URL 示例
https://oapi.dingtalk.com/robot/send?access_token=f248fa5a2e04cf0c13abb23831c4a6190f3837fa7ddf3338f759db5a67079469

# 签名密钥示例（加签验证）
SECad12bf23f1e2e3c3d7dae0cd58e41c2b4daa9d1066cdf7ce452c4732ecf0c30e
```

## 🚨 注意事项

1. **消息频率限制**：每个机器人每分钟最多发送 20 条消息
2. **消息格式**：确保 Markdown 格式正确，特殊字符需要转义
3. **安全配置**：生产环境建议启用签名验证
4. **环境变量优先级**：环境变量配置优先于手动配置
5. **错误处理**：工具会返回成功/失败状态，请检查返回值

## 🔍 故障排查

### 常见问题

**Q: 提示"DingTalk client not configured"**
A: 请检查环境变量设置或使用 `dingtalk_configure` 手动配置

**Q: 消息发送失败**
A: 请检查：
- Webhook URL 是否正确
- 签名密钥是否匹配
- 是否触发了安全关键字验证
- 是否超过频率限制（20条/分钟）

**Q: npm 安装失败**
A: 请确保 Node.js 版本 ≥ 18.0.0

### 调试模式

```bash
# 启用调试日志
DEBUG=dingtalk-mcp-server npx claude-code-dingtalk-mcp
```

## 🤝 开发与贡献

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/claude-code-community/dingtalk-mcp-server.git
cd dingtalk-mcp-server

# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建项目
npm run build

# 测试
npm test
```

### 项目结构

```
claude-code-dingtalk-mcp/
├── src/
│   ├── dingtalk.ts     # 钉钉客户端封装
│   ├── index.ts        # MCP Server 主程序
│   └── test.ts         # 测试用例
├── dist/               # 编译输出
├── .env.example        # 环境变量示例
├── LICENSE             # MIT 许可证
├── README.md           # 说明文档
└── package.json        # 项目配置
```

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🔗 相关链接

- [Claude Code 官方文档](https://docs.anthropic.com/en/docs/claude-code)
- [钉钉开放平台文档](https://open.dingtalk.com/document/group/custom-robot-access)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [NPM 包地址](https://www.npmjs.com/package/claude-code-dingtalk-mcp)

---

**让 Claude Code 的任务完成通知更加便捷！** 🚀
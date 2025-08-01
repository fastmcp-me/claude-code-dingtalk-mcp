#!/bin/bash

# 钉钉通知 MCP Server 快速安装脚本

echo "🚀 开始安装钉钉通知 MCP Server..."

# 检查 Node.js 和 npm
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 npm"
    exit 1
fi

echo "✅ Node.js 和 npm 已安装"

# 安装依赖
echo "📦 安装项目依赖..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

echo "✅ 依赖安装成功"

# 构建项目
echo "🔨 构建 TypeScript 项目..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 项目构建失败"
    exit 1
fi

echo "✅ 项目构建成功"

# 获取当前路径
CURRENT_PATH=$(pwd)
echo "📍 当前项目路径: $CURRENT_PATH"

# 创建示例 MCP 配置
echo "📝 创建 MCP 配置示例..."

cat > mcp-config-example.json << EOF
{
  "mcpServers": {
    "dingtalk-notifications": {
      "command": "node",
      "args": ["$CURRENT_PATH/dist/index.js"],
      "description": "DingTalk notification server for Claude Code task completion alerts"
    }
  }
}
EOF

echo "✅ MCP 配置示例已创建: mcp-config-example.json"

# 创建使用示例脚本
cat > usage-example.sh << 'EOF'
#!/bin/bash

echo "=== 钉钉通知 MCP Server 使用示例 ==="
echo ""
echo "1. 配置钉钉机器人:"
echo 'dingtalk_configure {"webhook": "https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN", "secret": "YOUR_SECRET"}'
echo ""
echo "2. 发送任务完成通知:"
echo 'dingtalk_notify_task_complete {"taskName": "代码构建", "status": "success", "details": "构建成功，所有测试通过", "duration": "2分30秒"}'
echo ""
echo "3. 发送 Markdown 消息:"
echo 'dingtalk_send_markdown {"title": "部署完成", "text": "## 🎉 部署成功\\n\\n**环境**: 生产环境\\n**版本**: v1.2.0\\n**状态**: ✅ 运行正常"}'
echo ""
echo "4. 发送文本消息:"
echo 'dingtalk_send_text {"content": "Hello from Claude Code! 任务执行完成。"}'
echo ""
EOF

chmod +x usage-example.sh

echo "✅ 使用示例脚本已创建: usage-example.sh"

echo ""
echo "🎉 安装完成!"
echo ""
echo "📋 下一步:"
echo "1. 复制 mcp-config-example.json 的内容到您的 .mcp.json 文件"
echo "2. 在钉钉群中创建自定义机器人获取 Webhook URL 和密钥"
echo "3. 在 Claude Code 中运行 dingtalk_configure 配置机器人"
echo "4. 运行 ./usage-example.sh 查看使用示例"
echo ""
echo "📖 更多信息请查看 README.md"
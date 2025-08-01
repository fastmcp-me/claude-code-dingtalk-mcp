import { DingTalkClient } from './dingtalk.js';

// 测试配置
const testConfig = {
  webhook: 'https://oapi.dingtalk.com/robot/send?access_token=YOUR_ACCESS_TOKEN', // 替换为您的钉钉机器人 Webhook
  secret: 'YOUR_SECRET', // 可选
};

async function testDingTalkClient() {
  const client = new DingTalkClient(testConfig);
  
  console.log('Testing DingTalk client...');
  
  // 测试发送文本消息
  console.log('Testing text message...');
  const textResult = await client.sendText('Hello from Claude Code MCP Server! 测试消息');
  console.log('Text message result:', textResult);
  
  // 测试发送 Markdown 消息
  console.log('Testing markdown message...');
  const markdownResult = await client.sendMarkdown(
    '测试 Markdown 消息',
    `## 任务完成通知

**任务名称：** 测试任务
**状态：** 成功
**时间：** ${new Date().toLocaleString('zh-CN')}

**详情：**
- 功能测试通过
- MCP Server 运行正常

---
*来自 Claude Code MCP Server*`
  );
  console.log('Markdown message result:', markdownResult);
  
  // 测试发送链接消息
  console.log('Testing link message...');
  const linkResult = await client.sendLink(
    'Claude Code MCP Server',
    '钉钉通知 MCP Server 已成功集成',
    'https://github.com',
    'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
  );
  console.log('Link message result:', linkResult);
}

// 如果直接运行此文件则执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testDingTalkClient().catch(console.error);
}
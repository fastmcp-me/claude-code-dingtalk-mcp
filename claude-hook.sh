#!/bin/bash

# Claude Code 会话结束钩子脚本
# 在 Claude Code 会话结束时自动触发钉钉通知

# 脚本配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NOTIFIER_SCRIPT="$SCRIPT_DIR/dist/session-notifier.js"
LOG_FILE="${CLAUDE_SESSION_LOG:-./.claude-session.log}"

# 颜色输出
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
NC='\\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    log_info "检查依赖环境..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先安装 Node.js"
        exit 1
    fi
    
    # 检查通知脚本
    if [ ! -f "$NOTIFIER_SCRIPT" ]; then
        log_warning "通知脚本不存在，尝试构建..."
        cd "$SCRIPT_DIR" && npm run build
        if [ ! -f "$NOTIFIER_SCRIPT" ]; then
            log_error "无法找到通知脚本: $NOTIFIER_SCRIPT"
            exit 1
        fi
    fi
    
    log_success "依赖检查完成"
}

# 检查钉钉配置
check_dingtalk_config() {
    log_info "检查钉钉配置..."
    
    if [ -z "$DINGTALK_WEBHOOK" ]; then
        log_warning "未设置 DINGTALK_WEBHOOK 环境变量"
        log_info "请设置钉钉机器人配置:"
        log_info "export DINGTALK_WEBHOOK='https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN'"
        log_info "export DINGTALK_SECRET='YOUR_SECRET'  # 可选"
        return 1
    fi
    
    log_success "钉钉配置检查完成"
    return 0
}

# 记录会话开始
session_start() {
    log_info "Claude Code 会话开始"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Session started" >> "$LOG_FILE"
    echo "user: 会话开始" >> "$LOG_FILE"
}

# 记录会话结束并发送通知
session_end() {
    log_info "Claude Code 会话结束，准备发送通知..."
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Session ended" >> "$LOG_FILE"
    echo "assistant: 会话结束" >> "$LOG_FILE"
    
    # 检查配置
    if ! check_dingtalk_config; then
        log_warning "跳过钉钉通知发送"
        return 0
    fi
    
    # 发送通知
    log_info "正在发送钉钉通知..."
    node "$NOTIFIER_SCRIPT"
    
    if [ $? -eq 0 ]; then
        log_success "钉钉通知发送完成"
    else
        log_error "钉钉通知发送失败"
    fi
    
    # 清理日志文件（可选）
    if [ "${CLAUDE_CLEANUP_LOG:-false}" = "true" ]; then
        rm -f "$LOG_FILE"
        log_info "会话日志已清理"
    fi
}

# 记录消息
log_message() {
    local role="$1"
    local message="$2"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $role: $message" >> "$LOG_FILE"
}

# 记录工具调用
log_tool_call() {
    local tool_name="$1"
    local result="$2"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - tool_use: $tool_name - $result" >> "$LOG_FILE"
}

# 记录文件操作
log_file_operation() {
    local operation="$1"
    local file_path="$2"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - file_op: $operation - $file_path" >> "$LOG_FILE"
}

# 记录任务完成
log_task_completion() {
    local task_name="$1"
    local status="$2"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - task_completed: $task_name - $status" >> "$LOG_FILE"
}

# 安装钩子到 Claude Code
install_hooks() {
    log_info "安装 Claude Code 钩子..."
    
    # 创建 Claude 配置目录
    CLAUDE_CONFIG_DIR="$HOME/.claude"
    mkdir -p "$CLAUDE_CONFIG_DIR"
    
    # 创建钩子配置文件
    cat > "$CLAUDE_CONFIG_DIR/hooks.json" << EOF
{
  "session_start": "$SCRIPT_DIR/claude-hook.sh session_start",
  "session_end": "$SCRIPT_DIR/claude-hook.sh session_end",
  "message_sent": "$SCRIPT_DIR/claude-hook.sh log_message user",
  "message_received": "$SCRIPT_DIR/claude-hook.sh log_message assistant",
  "tool_called": "$SCRIPT_DIR/claude-hook.sh log_tool_call",
  "file_modified": "$SCRIPT_DIR/claude-hook.sh log_file_operation",
  "task_completed": "$SCRIPT_DIR/claude-hook.sh log_task_completion"
}
EOF
    
    log_success "钩子配置已安装到: $CLAUDE_CONFIG_DIR/hooks.json"
    log_info "请重启 Claude Code 以使钩子生效"
}

# 卸载钩子
uninstall_hooks() {
    log_info "卸载 Claude Code 钩子..."
    
    CLAUDE_CONFIG_DIR="$HOME/.claude"
    if [ -f "$CLAUDE_CONFIG_DIR/hooks.json" ]; then
        rm "$CLAUDE_CONFIG_DIR/hooks.json"
        log_success "钩子配置已移除"
    else
        log_warning "未找到钩子配置文件"
    fi
}

# 测试通知功能
test_notification() {
    log_info "测试钉钉通知功能..."
    
    # 创建测试日志
    TEST_LOG_FILE="/tmp/claude-test-session.log"
    cat > "$TEST_LOG_FILE" << EOF
$(date '+%Y-%m-%d %H:%M:%S') - Session started
user: 测试会话开始
assistant: 我来帮您测试钉钉通知功能
tool_use: dingtalk_configure - success
file_op: edit - test.js
task_completed: 测试钉钉通知功能 - success  
assistant: 测试完成
$(date '+%Y-%m-%d %H:%M:%S') - Session ended
EOF
    
    # 使用测试日志运行通知脚本
    CLAUDE_SESSION_LOG="$TEST_LOG_FILE" node "$NOTIFIER_SCRIPT"
    
    # 清理测试文件
    rm -f "$TEST_LOG_FILE"
    
    log_success "测试完成"
}

# 显示帮助信息
show_help() {
    echo "Claude Code 钉钉通知钩子脚本"
    echo ""
    echo "用法: $0 [命令] [参数...]"
    echo ""
    echo "命令:"
    echo "  install              安装钩子到 Claude Code"
    echo "  uninstall            卸载钩子"
    echo "  test                 测试通知功能"
    echo "  session_start        记录会话开始"
    echo "  session_end          记录会话结束并发送通知"
    echo "  log_message <role>   记录消息"
    echo "  log_tool_call <tool> 记录工具调用"
    echo "  log_file_operation   记录文件操作"
    echo "  log_task_completion  记录任务完成"
    echo "  help                 显示此帮助信息"
    echo ""
    echo "环境变量:"
    echo "  DINGTALK_WEBHOOK     钉钉机器人 Webhook URL（必需）"
    echo "  DINGTALK_SECRET      钉钉机器人签名密钥（可选）"
    echo "  CLAUDE_SESSION_LOG   会话日志文件路径（默认: ./.claude-session.log）"
    echo "  CLAUDE_CLEANUP_LOG   会话结束后是否清理日志（默认: false）"
    echo ""
    echo "示例:"
    echo "  $0 install           # 安装钩子"
    echo "  $0 test              # 测试通知"
    echo "  $0 session_end       # 手动触发会话结束通知"
}

# 主程序
main() {
    case "${1:-help}" in
        "install")
            check_dependencies
            install_hooks
            ;;
        "uninstall")
            uninstall_hooks
            ;;
        "test")
            check_dependencies
            test_notification
            ;;
        "session_start")
            session_start
            ;;
        "session_end")
            check_dependencies
            session_end
            ;;
        "log_message")
            log_message "$2" "$3"
            ;;
        "log_tool_call")
            log_tool_call "$2" "$3"
            ;;
        "log_file_operation")
            log_file_operation "$2" "$3"
            ;;
        "log_task_completion")
            log_task_completion "$2" "$3"
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# 运行主程序
main "$@"
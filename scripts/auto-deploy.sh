#!/bin/bash

# Eufy GEO3 自动部署脚本
# 监控代码变更并自动执行同步

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
WATCH_DIRS=("frontend" "backend" "scripts")
WATCH_EXTENSIONS=("*.ts" "*.tsx" "*.js" "*.jsx" "*.json" "*.md" "*.sh")
SYNC_INTERVAL=300  # 5分钟检查一次
DEPLOY_LOG="/Users/cavin/Desktop/dev/eufygeo3/deploy.log"

# 日志函数
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$DEPLOY_LOG"
}

echo_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
    log "INFO: $1"
}

echo_success() {
    echo -e "${GREEN}✅ $1${NC}"
    log "SUCCESS: $1"
}

echo_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    log "WARNING: $1"
}

echo_error() {
    echo -e "${RED}❌ $1${NC}"
    log "ERROR: $1"
}

# 检查是否启用自动部署
check_auto_deploy_enabled() {
    # 加载环境变量
    if [ -f ".env" ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi
    
    if [ "$ENABLE_CI_CD" != "true" ]; then
        echo_info "自动部署已禁用 (ENABLE_CI_CD=false)"
        exit 0
    fi
}

# 检测文件变更
detect_changes() {
    local last_check_file=".last_auto_deploy_check"
    local current_time=$(date +%s)
    
    # 如果不存在上次检查文件，创建它
    if [ ! -f "$last_check_file" ]; then
        echo "$current_time" > "$last_check_file"
        return 1
    fi
    
    local last_check=$(cat "$last_check_file")
    
    # 检查是否有文件在上次检查后被修改
    for dir in "${WATCH_DIRS[@]}"; do
        if [ -d "$dir" ]; then
            for ext in "${WATCH_EXTENSIONS[@]}"; do
                if find "$dir" -name "$ext" -newer "$last_check_file" | grep -q .; then
                    echo "$current_time" > "$last_check_file"
                    return 0
                fi
            done
        fi
    done
    
    # 检查根目录的重要文件
    local important_files=("package.json" "package-lock.json" ".env.example" "README.md")
    for file in "${important_files[@]}"; do
        if [ -f "$file" ] && [ "$file" -nt "$last_check_file" ]; then
            echo "$current_time" > "$last_check_file"
            return 0
        fi
    done
    
    return 1
}

# 执行自动同步
auto_sync() {
    echo_info "检测到代码变更，开始自动同步..."
    
    # 等待一小段时间，确保文件写入完成
    sleep 5
    
    # 执行GitHub同步
    if ./scripts/github-sync.sh "Auto-deploy: Code changes detected"; then
        echo_success "自动同步完成"
        
        # 发送通知（如果需要）
        send_notification "✅ Eufy GEO3 代码已自动同步到GitHub"
    else
        echo_error "自动同步失败"
        send_notification "❌ Eufy GEO3 自动同步失败，请检查日志"
        return 1
    fi
}

# 发送通知（简单的日志记录，可扩展为邮件/Slack等）
send_notification() {
    local message="$1"
    echo_info "通知: $message"
    
    # 这里可以扩展为发送邮件、Slack消息等
    # 目前只记录到日志文件
    log "NOTIFICATION: $message"
}

# 健康检查
health_check() {
    local issues=()
    
    # 检查前端服务
    if ! curl -s http://localhost:3000 > /dev/null; then
        issues+=("前端服务(3000)不可访问")
    fi
    
    # 检查Git状态
    if ! git status > /dev/null 2>&1; then
        issues+=("Git仓库状态异常")
    fi
    
    # 检查环境文件
    if [ ! -f ".env" ]; then
        issues+=("环境配置文件(.env)缺失")
    fi
    
    if [ ${#issues[@]} -gt 0 ]; then
        echo_warning "健康检查发现问题:"
        for issue in "${issues[@]}"; do
            echo_warning "  - $issue"
        done
        return 1
    else
        echo_success "健康检查通过"
        return 0
    fi
}

# 监控模式
monitor_mode() {
    echo_info "🔍 启动自动部署监控模式..."
    echo_info "监控目录: ${WATCH_DIRS[*]}"
    echo_info "检查间隔: ${SYNC_INTERVAL}秒"
    echo_info "日志文件: $DEPLOY_LOG"
    echo_info "按 Ctrl+C 停止监控"
    echo_info "=================================="
    
    local check_count=0
    
    while true; do
        check_count=$((check_count + 1))
        
        # 每10次检查执行一次健康检查
        if [ $((check_count % 10)) -eq 0 ]; then
            health_check
        fi
        
        if detect_changes; then
            echo_info "第${check_count}次检查 - 检测到变更"
            auto_sync
        else
            echo_info "第${check_count}次检查 - 无变更"
        fi
        
        sleep "$SYNC_INTERVAL"
    done
}

# 单次检查模式
single_check_mode() {
    echo_info "🔍 执行单次变更检查..."
    
    if detect_changes; then
        echo_info "检测到代码变更"
        auto_sync
    else
        echo_info "未检测到代码变更"
    fi
}

# 强制同步模式
force_sync_mode() {
    echo_info "🚀 强制执行GitHub同步..."
    
    local commit_message="${1:-Force sync: Manual deployment}"
    
    if ./scripts/github-sync.sh "$commit_message"; then
        echo_success "强制同步完成"
    else
        echo_error "强制同步失败"
        exit 1
    fi
}

# 显示帮助信息
show_help() {
    cat << EOF
🚀 Eufy GEO3 自动部署工具

用法:
  $0 [选项] [参数]

选项:
  -m, --monitor     启动监控模式（持续监控文件变更）
  -c, --check       执行单次变更检查
  -f, --force       强制执行同步（可选提交消息）
  -h, --help        显示此帮助信息
  -s, --status      显示当前状态

示例:
  $0 --monitor                    # 启动持续监控
  $0 --check                      # 单次检查
  $0 --force "更新功能模块"       # 强制同步并自定义消息
  $0 --status                     # 查看状态

配置:
  在 .env 文件中设置 ENABLE_CI_CD=true 启用自动部署
EOF
}

# 显示状态信息
show_status() {
    echo_info "📊 Eufy GEO3 自动部署状态"
    echo_info "=================================="
    
    # 环境状态
    if [ -f ".env" ]; then
        export $(cat .env | grep -v '^#' | xargs)
        echo_info "环境配置: ✅ 已加载"
        echo_info "自动部署: ${ENABLE_CI_CD:-false}"
        echo_info "自动同步: ${ENABLE_AUTO_SYNC:-false}"
    else
        echo_warning "环境配置: ❌ .env文件不存在"
    fi
    
    # Git状态
    if git status > /dev/null 2>&1; then
        echo_info "Git状态: ✅ 正常"
        echo_info "当前分支: $(git branch --show-current)"
        echo_info "最后提交: $(git log -1 --pretty=format:'%h - %s (%cr)')"
    else
        echo_warning "Git状态: ❌ 异常"
    fi
    
    # 服务状态
    if curl -s http://localhost:3000 > /dev/null; then
        echo_info "前端服务: ✅ 运行中 (http://localhost:3000)"
    else
        echo_warning "前端服务: ❌ 未运行"
    fi
    
    # 日志文件
    if [ -f "$DEPLOY_LOG" ]; then
        local log_size=$(wc -l < "$DEPLOY_LOG")
        echo_info "部署日志: ✅ ${log_size}行记录"
    else
        echo_info "部署日志: 📝 尚未创建"
    fi
}

# 主函数
main() {
    # 切换到项目根目录
    cd "$(dirname "$0")/.."
    
    # 检查是否启用自动部署
    check_auto_deploy_enabled
    
    # 处理命令行参数
    case "${1:-}" in
        -m|--monitor)
            monitor_mode
            ;;
        -c|--check)
            single_check_mode
            ;;
        -f|--force)
            force_sync_mode "$2"
            ;;
        -s|--status)
            show_status
            ;;
        -h|--help|"")
            show_help
            ;;
        *)
            echo_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
}

# 脚本入口
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi
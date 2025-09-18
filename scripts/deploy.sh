#!/bin/bash

# Eufy GEO 3.0 自动部署脚本
# 作者: Claude AI
# 日期: $(date '+%Y-%m-%d')

set -e  # 遇到错误立即停止

echo "🚀 Eufy GEO 3.0 自动部署开始..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查环境
check_environment() {
    echo -e "${BLUE}🔍 检查部署环境...${NC}"
    
    # 检查Node.js版本
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js 未安装${NC}"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    if [ "$(printf '%s\n' "20.0.0" "$NODE_VERSION" | sort -V | head -n1)" != "20.0.0" ]; then
        echo -e "${RED}❌ Node.js 版本需要 >= 20.0.0，当前版本: $NODE_VERSION${NC}"
        exit 1
    fi
    
    # 检查Git
    if ! command -v git &> /dev/null; then
        echo -e "${RED}❌ Git 未安装${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 环境检查通过${NC}"
}

# 安装依赖
install_dependencies() {
    echo -e "${BLUE}📦 安装项目依赖...${NC}"
    npm install
    echo -e "${GREEN}✅ 依赖安装完成${NC}"
}

# 运行测试
run_tests() {
    echo -e "${BLUE}🧪 运行测试套件...${NC}"
    
    # 后端测试
    if [ -f "backend/package.json" ]; then
        echo "运行后端测试..."
        cd backend && npm test --if-present && cd ..
    fi
    
    # 前端测试  
    if [ -f "frontend/package.json" ]; then
        echo "运行前端测试..."
        cd frontend && npm test --if-present && cd ..
    fi
    
    echo -e "${GREEN}✅ 测试通过${NC}"
}

# 代码检查
lint_code() {
    echo -e "${BLUE}🔍 代码质量检查...${NC}"
    
    # 后端Lint
    if [ -f "backend/package.json" ]; then
        echo "后端代码检查..."
        cd backend && npm run lint --if-present && cd ..
    fi
    
    # 前端Lint
    if [ -f "frontend/package.json" ]; then
        echo "前端代码检查..."
        cd frontend && npm run lint --if-present && cd ..
    fi
    
    echo -e "${GREEN}✅ 代码检查通过${NC}"
}

# 构建项目
build_project() {
    echo -e "${BLUE}🏗️ 构建生产版本...${NC}"
    
    # 构建后端
    if [ -f "backend/package.json" ]; then
        echo "构建后端..."
        cd backend && npm run build --if-present && cd ..
    fi
    
    # 构建前端
    if [ -f "frontend/package.json" ]; then
        echo "构建前端..."
        cd frontend && npm run build && cd ..
    fi
    
    echo -e "${GREEN}✅ 构建完成${NC}"
}

# Git操作
git_operations() {
    echo -e "${BLUE}📝 准备Git提交...${NC}"
    
    # 检查Git状态
    if [ -n "$(git status --porcelain)" ]; then
        echo "发现未提交的更改，正在添加..."
        git add .
        
        # 生成提交信息
        COMMIT_MSG="🚀 自动部署: $(date '+%Y-%m-%d %H:%M:%S')"
        if [ ! -z "$1" ]; then
            COMMIT_MSG="$1"
        fi
        
        git commit -m "$COMMIT_MSG"
        echo -e "${GREEN}✅ 代码已提交: $COMMIT_MSG${NC}"
    else
        echo -e "${YELLOW}⚠️ 没有新的更改需要提交${NC}"
    fi
}

# 推送到远程仓库
push_to_remote() {
    echo -e "${BLUE}☁️ 推送到远程仓库...${NC}"
    
    # 检查远程仓库
    if ! git remote get-url origin &> /dev/null; then
        echo -e "${RED}❌ 远程仓库未配置${NC}"
        exit 1
    fi
    
    # 推送到main分支
    git push origin main
    echo -e "${GREEN}✅ 代码已推送到远程仓库${NC}"
}

# 部署状态报告
deployment_report() {
    echo -e "${GREEN}"
    echo "================================="
    echo "🎉 部署完成！"
    echo "================================="
    echo "📊 部署统计:"
    echo "  - 时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "  - 分支: $(git branch --show-current)"
    echo "  - 提交: $(git rev-parse --short HEAD)"
    echo "  - 仓库: $(git remote get-url origin)"
    echo ""
    echo "🔗 相关链接:"
    echo "  - GitHub: https://github.com/keevingfu/eufygeo3"
    echo "  - 前端: http://localhost:3000"
    echo "  - 后端: http://localhost:4004"
    echo "  - GraphQL: http://localhost:4004/graphql"
    echo ""
    echo "📈 下一步:"
    echo "  - 监控CI/CD流水线状态"
    echo "  - 验证部署功能"
    echo "  - 查看应用运行状态"
    echo "================================="
    echo -e "${NC}"
}

# 主函数
main() {
    echo -e "${GREEN}🚀 Eufy GEO 3.0 自动部署脚本 v1.0${NC}"
    echo -e "${BLUE}开始部署流程...${NC}"
    echo ""
    
    check_environment
    install_dependencies
    run_tests
    lint_code
    build_project
    git_operations "$1"
    push_to_remote
    deployment_report
    
    echo -e "${GREEN}🎉 部署成功完成！${NC}"
}

# 脚本入口
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi
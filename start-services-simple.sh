#!/bin/bash

echo "🚀 启动 Eufy GEO3 应用..."
echo "=================================="

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 停止已运行的服务
echo -e "${YELLOW}清理已运行的服务...${NC}"
pkill -f "node.*eufygeo3" 2>/dev/null
pkill -f "next.*3000" 2>/dev/null
sleep 2

# 启动前端
echo -e "\n${BLUE}1. 启动前端服务 (端口 3000)...${NC}"
cd /Users/cavin/Desktop/dev/eufygeo3/frontend
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "前端进程ID: $FRONTEND_PID"

# 等待前端启动
echo -e "${YELLOW}等待前端服务启动...${NC}"
sleep 5

# 检查前端状态
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${GREEN}✅ 前端服务启动成功！${NC}"
else
    echo -e "${RED}❌ 前端服务启动失败${NC}"
fi

echo -e "\n=================================="
echo -e "${GREEN}🎉 应用启动完成！${NC}"
echo -e "\n${YELLOW}访问地址：${NC}"
echo "📱 前端界面: http://localhost:3000"
echo ""
echo "📊 可访问的页面："
echo "  - 主页: http://localhost:3000"
echo "  - 仪表板: http://localhost:3000/dashboard"
echo "  - 关键词管理: http://localhost:3000/dashboard/keywords"
echo "  - 工作流管理: http://localhost:3000/dashboard/workflow"
echo "  - 内容管理: http://localhost:3000/dashboard/content"
echo "  - 数据分析: http://localhost:3000/dashboard/analytics"
echo ""
echo -e "${BLUE}Phase 2 智能化功能：${NC}"
echo "🧠 AI搜索意图预测系统"
echo "🎨 多模态内容优化引擎"
echo "💬 对话流优化框架"
echo "🔄 实时内容演化系统"
echo "🌐 语义知识图谱构建"
echo ""
echo -e "${YELLOW}提示: 按 Ctrl+C 停止服务${NC}"

# 保持脚本运行
tail -f /tmp/frontend.log
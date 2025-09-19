#!/bin/bash

echo "🚀 启动 Eufy GEO3 全部服务..."
echo "=================================="

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查端口是否被占用
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  端口 $1 已被占用，正在尝试关闭..."
        lsof -ti:$1 | xargs kill -9 2>/dev/null
        sleep 1
    fi
}

# 启动服务函数
start_service() {
    local service_name=$1
    local service_dir=$2
    local start_command=$3
    local port=$4
    
    echo -e "${BLUE}启动 $service_name (端口: $port)...${NC}"
    check_port $port
    
    cd $service_dir
    nohup $start_command > /tmp/${service_name}.log 2>&1 &
    echo $! > /tmp/${service_name}.pid
    
    echo -e "${GREEN}✅ $service_name 启动成功${NC}"
}

# 创建日志目录
mkdir -p /tmp/eufygeo3-logs

# 启动后端服务
echo -e "\n${YELLOW}1. 启动后端服务${NC}"
echo "------------------------"

# 启动关键词服务 (4004)
start_service "keyword-service" "/Users/cavin/Desktop/dev/eufygeo3/backend" "npm run start:keyword" 4004

# 启动工作流服务 (4005)
start_service "workflow-service" "/Users/cavin/Desktop/dev/eufygeo3/backend" "npm run start:workflow" 4005

# 启动集成服务 (4006)
start_service "integrated-service" "/Users/cavin/Desktop/dev/eufygeo3/backend" "npm run start:integrated" 4006

# 启动GEO服务 (4007)
start_service "geo-service" "/Users/cavin/Desktop/dev/eufygeo3/backend" "npm run start:geo" 4007

# 等待后端服务启动
echo -e "\n⏳ 等待后端服务完全启动..."
sleep 5

# 启动前端服务
echo -e "\n${YELLOW}2. 启动前端服务${NC}"
echo "------------------------"

start_service "frontend" "/Users/cavin/Desktop/dev/eufygeo3/frontend" "npm run dev" 3000

# 等待所有服务启动完成
echo -e "\n⏳ 等待所有服务启动完成..."
sleep 5

# 检查服务状态
echo -e "\n${YELLOW}3. 服务状态检查${NC}"
echo "------------------------"

services=(
    "keyword-service:4004"
    "workflow-service:4005"
    "integrated-service:4006"
    "geo-service:4007"
    "frontend:3000"
)

all_running=true
for service in "${services[@]}"; do
    IFS=':' read -r name port <<< "$service"
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${GREEN}✅ $name (端口: $port) - 运行中${NC}"
    else
        echo -e "${RED}❌ $name (端口: $port) - 未运行${NC}"
        all_running=false
    fi
done

echo -e "\n=================================="

if [ "$all_running" = true ]; then
    echo -e "${GREEN}🎉 所有服务启动成功！${NC}"
    echo -e "\n${YELLOW}访问地址：${NC}"
    echo "📱 前端界面: http://localhost:3000"
    echo "🔧 后端API:"
    echo "   - 关键词服务: http://localhost:4004/graphql"
    echo "   - 工作流服务: http://localhost:4005/graphql"
    echo "   - 集成服务: http://localhost:4006/graphql"
    echo "   - GEO核心服务: http://localhost:4007/graphql"
    
    echo -e "\n${YELLOW}Phase 2 智能化功能已就绪：${NC}"
    echo "🧠 AI搜索意图预测"
    echo "🎨 多模态内容优化"
    echo "💬 对话流优化"
    echo "🔄 实时内容演化"
    echo "🌐 语义知识图谱"
    
    echo -e "\n${BLUE}提示: 使用 './stop-all-services.sh' 停止所有服务${NC}"
else
    echo -e "${RED}⚠️  部分服务启动失败，请检查日志${NC}"
    echo "日志位置: /tmp/eufygeo3-logs/"
fi

# 保存进程信息
echo -e "\n📝 保存进程信息..."
ps aux | grep -E "node.*eufygeo3" | grep -v grep > /tmp/eufygeo3-processes.txt

echo -e "\n✨ 启动脚本执行完成"
#!/bin/bash

echo "🛑 停止 Eufy GEO3 全部服务..."
echo "=================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 停止指定端口的服务
stop_port() {
    local port=$1
    local name=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${YELLOW}停止 $name (端口: $port)...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null
        echo -e "${GREEN}✅ $name 已停止${NC}"
    else
        echo -e "${BLUE}ℹ️  $name (端口: $port) 未运行${NC}"
    fi
}

# 停止所有服务
echo -e "${RED}停止所有服务...${NC}"
echo "------------------------"

stop_port 3000 "前端服务"
stop_port 4004 "关键词服务"
stop_port 4005 "工作流服务"
stop_port 4006 "集成服务"
stop_port 4007 "GEO核心服务"

# 清理进程ID文件
echo -e "\n🧹 清理进程文件..."
rm -f /tmp/*.pid
rm -f /tmp/eufygeo3-processes.txt

# 清理日志文件（可选）
read -p "是否清理日志文件? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -f /tmp/*.log
    echo -e "${GREEN}✅ 日志文件已清理${NC}"
fi

echo -e "\n=================================="
echo -e "${GREEN}✅ 所有服务已停止${NC}"
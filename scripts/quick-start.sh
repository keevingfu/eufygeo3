#!/bin/bash

# Eufy GEO Platform Quick Start Script

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 标题
print_message "$BLUE" "
╔══════════════════════════════════════════════╗
║        Eufy GEO Platform Quick Start         ║
╚══════════════════════════════════════════════╝
"

# 检查 Docker 是否运行
print_message "$YELLOW" "🔍 检查 Docker 状态..."
if ! docker info > /dev/null 2>&1; then
    print_message "$RED" "❌ Docker 未运行，请先启动 Docker Desktop"
    exit 1
fi
print_message "$GREEN" "✅ Docker 运行正常"

# 检查端口占用
check_port() {
    local port=$1
    local service=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        print_message "$RED" "❌ 端口 $port ($service) 已被占用"
        return 1
    fi
    return 0
}

print_message "$YELLOW" "🔍 检查端口占用..."
ports_ok=true
check_port 3000 "Frontend" || ports_ok=false
check_port 4000 "Backend API" || ports_ok=false
check_port 5432 "PostgreSQL" || ports_ok=false
check_port 6379 "Redis" || ports_ok=false
check_port 7474 "Neo4j Browser" || ports_ok=false
check_port 7687 "Neo4j Bolt" || ports_ok=false
check_port 9200 "Elasticsearch" || ports_ok=false

if [ "$ports_ok" = false ]; then
    print_message "$RED" "请先关闭占用端口的服务"
    exit 1
fi
print_message "$GREEN" "✅ 端口检查通过"

# 创建必要的目录
print_message "$YELLOW" "📁 创建必要目录..."
mkdir -p backend/{logs,uploads}
mkdir -p frontend/{public/uploads}

# 启动 Docker 服务
print_message "$YELLOW" "🐳 启动 Docker 服务..."
docker-compose up -d

# 等待服务启动
print_message "$YELLOW" "⏳ 等待服务启动..."
sleep 10

# 检查服务健康状态
print_message "$YELLOW" "🏥 检查服务健康状态..."
services=("geo-postgres" "geo-redis" "geo-neo4j" "geo-elasticsearch" "geo-qdrant" "geo-minio")
all_healthy=true

for service in "${services[@]}"; do
    if docker ps --filter "name=$service" --filter "status=running" | grep -q $service; then
        print_message "$GREEN" "  ✅ $service 运行正常"
    else
        print_message "$RED" "  ❌ $service 启动失败"
        all_healthy=false
    fi
done

if [ "$all_healthy" = false ]; then
    print_message "$RED" "部分服务启动失败，请检查 Docker 日志: docker-compose logs"
    exit 1
fi

# 初始化数据库
if [ ! -f backend/.db-initialized ]; then
    print_message "$YELLOW" "🗄️  初始化数据库..."
    cd backend
    npx prisma generate
    npx prisma migrate deploy
    touch .db-initialized
    cd ..
    print_message "$GREEN" "✅ 数据库初始化完成"
fi

# 启动应用
print_message "$YELLOW" "🚀 启动应用服务..."

# 在新的终端窗口启动后端
if command -v osascript &> /dev/null; then
    # macOS
    osascript -e 'tell app "Terminal" to do script "cd '$(pwd)'/backend && npm run dev"'
elif command -v gnome-terminal &> /dev/null; then
    # Linux with GNOME
    gnome-terminal -- bash -c "cd backend && npm run dev; exec bash"
else
    # 其他系统，在后台启动
    cd backend && npm run dev &
    cd ..
fi

# 在新的终端窗口启动前端
if command -v osascript &> /dev/null; then
    # macOS
    osascript -e 'tell app "Terminal" to do script "cd '$(pwd)'/frontend && npm run dev"'
elif command -v gnome-terminal &> /dev/null; then
    # Linux with GNOME
    gnome-terminal -- bash -c "cd frontend && npm run dev; exec bash"
else
    # 其他系统，在后台启动
    cd frontend && npm run dev &
    cd ..
fi

# 显示访问信息
print_message "$GREEN" "
🎉 Eufy GEO 平台启动成功！

📋 服务访问地址：
  • 前端应用: http://localhost:3000
  • 后端 API: http://localhost:4000
  • GraphQL Playground: http://localhost:4000/graphql
  • Neo4j Browser: http://localhost:7474 (用户名: neo4j, 密码: geo_password)
  • MinIO Console: http://localhost:9001 (用户名: geo_admin, 密码: geo_password)
  • Prisma Studio: 运行 'cd backend && npm run db:studio'

📝 默认管理员账号：
  • 邮箱: admin@eufy-geo.com
  • 密码: Admin123!

🛠️  常用命令：
  • 查看日志: docker-compose logs -f
  • 停止服务: docker-compose down
  • 重启服务: docker-compose restart
  • 数据库迁移: cd backend && npm run db:migrate
  • 运行测试: npm test

📚 文档：
  • 系统架构: docs/architecture/SYSTEM_ARCHITECTURE.md
  • API 文档: docs/api/API_ARCHITECTURE.md
  • 数据库设计: docs/database/DATABASE_DESIGN.md

需要帮助？查看 IMPLEMENTATION_PLAN.md 了解更多信息。
"

# 保持脚本运行
print_message "$YELLOW" "按 Ctrl+C 停止所有服务..."
wait
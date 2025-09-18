#!/bin/bash

echo "🧪 Eufy GEO Platform 集成测试"
echo "======================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试结果统计
PASSED=0
FAILED=0

# 测试函数
test_service() {
    local name=$1
    local url=$2
    local query=$3
    
    echo -n "测试 $name... "
    
    response=$(curl -s -X POST "$url" \
        -H "Content-Type: application/json" \
        -d "$query" 2>/dev/null)
    
    if [[ $? -eq 0 && ! -z "$response" && "$response" != *"error"* ]]; then
        echo -e "${GREEN}✅ 通过${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ 失败${NC}"
        ((FAILED++))
        return 1
    fi
}

# 1. 测试前端服务
echo "1️⃣ 前端服务测试"
echo "----------------------------------------"
echo -n "检查前端服务... "
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ 运行中${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ 未运行${NC}"
    ((FAILED++))
fi
echo ""

# 2. 测试认证服务
echo "2️⃣ 认证服务测试 (端口 4003)"
echo "----------------------------------------"

# 健康检查
test_service "健康检查" \
    "http://localhost:4003/graphql" \
    '{"query":"{ authHealth }"}'

# 登录测试
echo -n "测试登录功能... "
login_response=$(curl -s -X POST http://localhost:4003/graphql \
    -H "Content-Type: application/json" \
    -d '{
        "query": "mutation { login(input: { email: \"admin@eufy.com\", password: \"password123\" }) { token user { email role } } }"
    }')

if [[ "$login_response" == *"token"* ]]; then
    echo -e "${GREEN}✅ 通过${NC}"
    ((PASSED++))
    TOKEN=$(echo "$login_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
else
    echo -e "${RED}❌ 失败${NC}"
    ((FAILED++))
fi
echo ""

# 3. 测试关键词 CRUD 服务
echo "3️⃣ 关键词管理服务测试 (端口 4004)"
echo "----------------------------------------"

test_service "健康检查" \
    "http://localhost:4004/graphql" \
    '{"query":"{ keywordHealth }"}'

test_service "获取关键词列表" \
    "http://localhost:4004/graphql" \
    '{"query":"{ keywords { total items { id text searchVolume } } }"}'

# 创建关键词测试
echo -n "测试创建关键词... "
create_response=$(curl -s -X POST http://localhost:4004/graphql \
    -H "Content-Type: application/json" \
    -d '{
        "query": "mutation { createKeyword(input: { text: \"test keyword\", searchVolume: 1000, cpc: 1.5, priority: \"P2\", status: \"ACTIVE\" }) { id text } }"
    }')

if [[ "$create_response" == *"test keyword"* ]]; then
    echo -e "${GREEN}✅ 通过${NC}"
    ((PASSED++))
    KEYWORD_ID=$(echo "$create_response" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
else
    echo -e "${RED}❌ 失败${NC}"
    ((FAILED++))
fi
echo ""

# 4. 测试内容生成服务
echo "4️⃣ AI 内容生成服务测试 (端口 4005)"
echo "----------------------------------------"

test_service "健康检查" \
    "http://localhost:4005/graphql" \
    '{"query":"{ contentHealth }"}'

test_service "获取模板列表" \
    "http://localhost:4005/graphql" \
    '{"query":"{ templates { id name type } }"}'

# AI 内容生成测试
echo -n "测试 AI 内容生成... "
generate_response=$(curl -s -X POST http://localhost:4005/graphql \
    -H "Content-Type: application/json" \
    -d '{
        "query": "mutation { generateContent(input: { keywords: [\"eufy test\"], type: BLOG_POST, tone: PROFESSIONAL }) { id title wordCount seoScore } }"
    }')

if [[ "$generate_response" == *"title"* && "$generate_response" == *"seoScore"* ]]; then
    echo -e "${GREEN}✅ 通过${NC}"
    ((PASSED++))
    CONTENT_ID=$(echo "$generate_response" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
else
    echo -e "${RED}❌ 失败${NC}"
    ((FAILED++))
fi

# 内容分析测试
if [[ ! -z "$CONTENT_ID" ]]; then
    echo -n "测试内容分析... "
    analysis_response=$(curl -s -X POST http://localhost:4005/graphql \
        -H "Content-Type: application/json" \
        -d "{
            \"query\": \"{ analyzeContent(contentId: \\\"$CONTENT_ID\\\") { readabilityScore seoScore estimatedReadTime } }\"
        }")
    
    if [[ "$analysis_response" == *"seoScore"* ]]; then
        echo -e "${GREEN}✅ 通过${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ 失败${NC}"
        ((FAILED++))
    fi
fi
echo ""

# 5. 测试分析服务（如果运行）
echo "5️⃣ 数据分析服务测试 (端口 4006)"
echo "----------------------------------------"
if lsof -i :4006 | grep -q LISTEN; then
    test_service "健康检查" \
        "http://localhost:4006/graphql" \
        '{"query":"{ analyticsHealth }"}'
else
    echo -e "${YELLOW}⏭️  分析服务未运行（使用前端模拟数据）${NC}"
fi
echo ""

# 6. 前端页面可访问性测试
echo "6️⃣ 前端页面路由测试"
echo "----------------------------------------"
pages=("/" "/login" "/keywords" "/content" "/analytics")
for page in "${pages[@]}"; do
    echo -n "测试页面 $page... "
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$page")
    if [[ "$status_code" == "200" || "$status_code" == "307" ]]; then
        echo -e "${GREEN}✅ 可访问${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ 不可访问 (状态码: $status_code)${NC}"
        ((FAILED++))
    fi
done
echo ""

# 7. GraphQL Playground 测试
echo "7️⃣ GraphQL Playground 测试"
echo "----------------------------------------"
services=("4003:认证" "4004:关键词" "4005:内容生成")
for service in "${services[@]}"; do
    port="${service%%:*}"
    name="${service##*:}"
    echo -n "检查 $name 服务 Playground... "
    status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port/graphql")
    if [[ "$status" == "200" ]]; then
        echo -e "${GREEN}✅ 可用${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ 不可用${NC}"
        ((FAILED++))
    fi
done
echo ""

# 测试总结
echo "======================================"
echo "📊 测试结果总结"
echo "======================================"
echo -e "✅ 通过: ${GREEN}$PASSED${NC} 项"
echo -e "❌ 失败: ${RED}$FAILED${NC} 项"
echo ""

if [[ $FAILED -eq 0 ]]; then
    echo -e "${GREEN}🎉 所有测试通过！平台功能正常。${NC}"
else
    echo -e "${RED}⚠️  部分测试失败，请检查相关服务。${NC}"
fi

echo ""
echo "📝 测试报告："
echo "- 前端服务：http://localhost:3000"
echo "- 认证服务：http://localhost:4003/graphql"
echo "- 关键词服务：http://localhost:4004/graphql"
echo "- 内容生成服务：http://localhost:4005/graphql"
echo "- 数据分析：集成在前端（模拟数据）"
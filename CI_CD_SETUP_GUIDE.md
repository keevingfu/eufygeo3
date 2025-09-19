# 🚀 Eufy GEO3 CI/CD 设置指南

## 📋 概览

本指南介绍如何为Eufy GEO3项目设置完整的持续集成/持续部署(CI/CD)流程，包括自动化GitHub同步和部署流程。

## 🛠️ 系统架构

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   本地开发环境    │ ─→ │   GitHub仓库      │ ─→ │   CI/CD流水线    │
│                │    │                  │    │                │
│ • 代码开发       │    │ • 代码存储        │    │ • 自动化测试     │
│ • 自动同步       │    │ • 版本控制        │    │ • 构建部署       │
│ • 本地测试       │    │ • Actions流程     │    │ • 质量检查       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🔧 环境配置

### 1. 创建环境文件

```bash
# 复制环境配置模板
cp .env.example .env

# 编辑配置文件
vim .env
```

### 2. 配置GitHub Token

1. 访问 [GitHub Personal Access Tokens](https://github.com/settings/tokens)
2. 点击 "Generate new token (classic)"
3. 设置权限：
   - ✅ `repo` (完整仓库访问)
   - ✅ `workflow` (GitHub Actions)
   - ✅ `write:packages` (包发布)
4. 将生成的token填入 `.env` 文件

### 3. 环境变量说明

| 变量名 | 描述 | 示例值 |
|--------|------|--------|
| `GITHUB_TOKEN` | GitHub访问令牌 | `ghp_xxxxxxxxxxxxx` |
| `GITHUB_REPO` | 仓库URL | `https://github.com/user/repo.git` |
| `ENABLE_AUTO_SYNC` | 启用自动同步 | `true/false` |
| `ENABLE_CI_CD` | 启用CI/CD | `true/false` |

## 🚀 使用方法

### 手动同步到GitHub

```bash
# 基本同步（使用默认提交消息）
./scripts/github-sync.sh

# 自定义提交消息
./scripts/github-sync.sh "feat: 添加新功能模块"

# 强制同步（覆盖远程更改）
./scripts/github-sync.sh "fix: 修复关键Bug" --force
```

### 自动化部署监控

```bash
# 启动持续监控模式（推荐在开发时使用）
./scripts/auto-deploy.sh --monitor

# 单次检查是否有变更
./scripts/auto-deploy.sh --check

# 强制执行同步
./scripts/auto-deploy.sh --force "Manual deployment"

# 查看系统状态
./scripts/auto-deploy.sh --status
```

## 📊 CI/CD流水线

### GitHub Actions工作流

每次推送到 `main` 或 `develop` 分支时，会自动触发以下流程：

1. **代码质量检查**
   - ESLint代码规范检查
   - TypeScript类型检查
   - 依赖项安全扫描

2. **前端测试与构建**
   - 单元测试执行
   - Next.js应用构建
   - 构建产物上传

3. **后端测试**
   - 后端服务测试
   - API接口验证
   - 服务构建检查

4. **端到端测试**
   - Playwright自动化测试
   - 完整用户流程验证
   - 屏幕截图记录

5. **安全扫描**
   - npm audit安全检查
   - 依赖项漏洞扫描
   - 代码安全分析

6. **部署准备**
   - 创建部署包
   - 生成部署信息
   - 打包发布产物

## 🔍 监控与日志

### 日志文件位置

- **同步日志**: `github-sync.log`
- **部署日志**: `deploy.log`
- **应用日志**: `/tmp/frontend-startup.log`

### 实时监控

```bash
# 查看同步日志
tail -f github-sync.log

# 查看部署日志
tail -f deploy.log

# 查看应用状态
./scripts/auto-deploy.sh --status
```

## 🔐 安全最佳实践

### 1. 敏感信息保护

- ✅ `.env` 文件已加入 `.gitignore`
- ✅ GitHub token使用环境变量
- ✅ 提供 `.env.example` 模板
- ❌ 永远不要提交真实的token

### 2. 访问控制

```bash
# 设置脚本权限
chmod +x scripts/*.sh

# 保护环境文件
chmod 600 .env
```

### 3. Token安全

- 🔄 定期更新GitHub token
- 🔒 使用最小权限原则
- 📱 启用双因素认证

## 🚨 故障排除

### 常见问题

#### 1. 同步失败

```bash
# 检查网络连接
curl -I https://github.com

# 验证token权限
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user

# 重置Git凭据
git config --global --unset credential.helper
rm ~/.git-credentials
```

#### 2. 权限问题

```bash
# 检查文件权限
ls -la scripts/

# 重新设置权限
chmod +x scripts/*.sh
```

#### 3. 环境变量未加载

```bash
# 检查环境文件
cat .env

# 手动加载环境变量
export $(cat .env | grep -v '^#' | xargs)
```

### 调试模式

```bash
# 启用详细日志
export DEBUG=true
./scripts/github-sync.sh

# 查看Git状态
git status
git log --oneline -10
```

## 📈 性能优化

### 1. 同步优化

- **增量同步**: 只同步变更的文件
- **并行处理**: 多任务并发执行
- **智能检测**: 避免不必要的同步

### 2. 监控优化

```bash
# 调整监控间隔（秒）
export SYNC_INTERVAL=180  # 3分钟检查一次

# 自定义监控目录
export WATCH_DIRS="frontend backend"
```

## 🔮 高级功能

### 1. 自定义钩子

创建 `scripts/hooks/` 目录添加自定义钩子：

```bash
# 同步前钩子
scripts/hooks/pre-sync.sh

# 同步后钩子
scripts/hooks/post-sync.sh
```

### 2. 多环境支持

```bash
# 开发环境
./scripts/github-sync.sh --env development

# 生产环境
./scripts/github-sync.sh --env production
```

### 3. 批量操作

```bash
# 批量提交多个更改
./scripts/batch-sync.sh "feat: 批量更新功能"
```

## 📚 相关文档

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Git 工作流指南](https://git-scm.com/book)
- [Playwright 测试文档](https://playwright.dev/)
- [Next.js 部署指南](https://nextjs.org/docs/deployment)

## 🆘 支持与反馈

如果遇到问题或需要帮助：

1. 📖 查看本文档的故障排除部分
2. 🔍 检查GitHub Actions的执行日志
3. 📝 查看项目的issue跟踪器
4. 💬 联系项目维护团队

---

## 🎯 快速开始检查清单

- [ ] 复制 `.env.example` 为 `.env`
- [ ] 配置GitHub token和仓库信息
- [ ] 测试手动同步: `./scripts/github-sync.sh`
- [ ] 启动自动监控: `./scripts/auto-deploy.sh --monitor`
- [ ] 验证GitHub Actions工作流
- [ ] 检查应用状态: `./scripts/auto-deploy.sh --status`

---

*最后更新: $(date '+%Y-%m-%d')*
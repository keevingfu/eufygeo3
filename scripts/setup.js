#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ANSI 颜色代码
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, options = {}) {
  try {
    log(`执行: ${command}`, 'blue');
    execSync(command, { stdio: 'inherit', ...options });
    return true;
  } catch (error) {
    log(`错误: ${error.message}`, 'red');
    return false;
  }
}

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function checkPrerequisites() {
  log('\n🔍 检查系统环境...', 'bright');
  
  const checks = [
    { 
      name: 'Node.js', 
      command: 'node --version',
      minVersion: '20.0.0',
      parseVersion: (output) => output.trim().replace('v', '')
    },
    {
      name: 'npm',
      command: 'npm --version',
      minVersion: '10.0.0',
      parseVersion: (output) => output.trim()
    },
    {
      name: 'Docker',
      command: 'docker --version',
      minVersion: '20.0.0',
      parseVersion: (output) => output.match(/Docker version (\d+\.\d+\.\d+)/)?.[1]
    }
  ];

  for (const check of checks) {
    try {
      const output = execSync(check.command, { encoding: 'utf8' });
      const version = check.parseVersion(output);
      log(`✅ ${check.name} ${version}`, 'green');
      
      if (version && check.minVersion) {
        const current = version.split('.').map(Number);
        const required = check.minVersion.split('.').map(Number);
        
        if (current[0] < required[0] || 
            (current[0] === required[0] && current[1] < required[1])) {
          log(`⚠️  ${check.name} 版本过低，需要 ${check.minVersion} 或更高版本`, 'yellow');
        }
      }
    } catch (error) {
      log(`❌ ${check.name} 未安装`, 'red');
      process.exit(1);
    }
  }
}

async function createEnvFiles() {
  log('\n📝 创建环境配置文件...', 'bright');
  
  const envExample = `# Database
DATABASE_URL="postgresql://geo_user:geo_password@localhost:5432/geo_platform"
NEO4J_URI="bolt://localhost:7687"
NEO4J_USER="neo4j"
NEO4J_PASSWORD="geo_password"
REDIS_URL="redis://localhost:6379"

# API Keys
OPENAI_API_KEY="your-openai-api-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
YOUTUBE_API_KEY="your-youtube-api-key"
REDDIT_CLIENT_ID="your-reddit-client-id"
REDDIT_CLIENT_SECRET="your-reddit-client-secret"

# Application
JWT_SECRET="your-super-secret-jwt-key"
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:4000"

# Cloud Storage
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_ACCESS_KEY="geo_admin"
MINIO_SECRET_KEY="geo_password"
MINIO_BUCKET="geo-uploads"`;

  // Backend .env
  fs.writeFileSync(path.join(__dirname, '../backend/.env.example'), envExample);
  
  // Frontend .env
  const frontendEnv = `NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:4000/graphql
NEXT_PUBLIC_WS_ENDPOINT=ws://localhost:4000/ws`;
  
  fs.writeFileSync(path.join(__dirname, '../frontend/.env.example'), frontendEnv);
  
  log('✅ 环境配置文件已创建', 'green');
}

async function installDependencies() {
  log('\n📦 安装项目依赖...', 'bright');
  
  const install = await question('是否安装 npm 依赖包？(y/n) ');
  if (install.toLowerCase() !== 'y') {
    return;
  }
  
  // Root dependencies
  log('\n安装根目录依赖...', 'yellow');
  execCommand('npm install');
  
  // Backend dependencies
  log('\n安装后端依赖...', 'yellow');
  execCommand('npm install', { cwd: path.join(__dirname, '../backend') });
  
  // Frontend dependencies
  log('\n安装前端依赖...', 'yellow');
  execCommand('npm install', { cwd: path.join(__dirname, '../frontend') });
  
  // Shared dependencies
  log('\n安装共享模块依赖...', 'yellow');
  execCommand('npm install', { cwd: path.join(__dirname, '../shared') });
}

async function setupDocker() {
  log('\n🐳 配置 Docker 服务...', 'bright');
  
  const useDocker = await question('是否启动 Docker 服务？(y/n) ');
  if (useDocker.toLowerCase() !== 'y') {
    return;
  }
  
  log('启动 Docker 容器...', 'yellow');
  execCommand('docker-compose up -d');
  
  log('等待服务启动...', 'yellow');
  await new Promise(resolve => setTimeout(resolve, 10000)); // 等待10秒
  
  log('检查服务状态...', 'yellow');
  execCommand('docker-compose ps');
}

async function initializeDatabase() {
  log('\n🗄️  初始化数据库...', 'bright');
  
  const initDb = await question('是否初始化数据库？(y/n) ');
  if (initDb.toLowerCase() !== 'y') {
    return;
  }
  
  // 创建 Prisma 客户端
  log('生成 Prisma 客户端...', 'yellow');
  execCommand('npx prisma generate', { cwd: path.join(__dirname, '../backend') });
  
  // 运行迁移
  log('运行数据库迁移...', 'yellow');
  execCommand('npx prisma migrate deploy', { cwd: path.join(__dirname, '../backend') });
  
  // 初始化种子数据
  const seedDb = await question('是否导入种子数据？(y/n) ');
  if (seedDb.toLowerCase() === 'y') {
    log('导入种子数据...', 'yellow');
    execCommand('npx prisma db seed', { cwd: path.join(__dirname, '../backend') });
  }
}

async function createInitialFiles() {
  log('\n📄 创建初始文件...', 'bright');
  
  // Backend package.json
  const backendPackage = {
    name: "@geo-platform/backend",
    version: "1.0.0",
    description: "GEO Platform Backend Service",
    scripts: {
      "dev": "nest start --watch",
      "build": "nest build",
      "start": "node dist/main",
      "test": "jest",
      "test:watch": "jest --watch",
      "test:cov": "jest --coverage",
      "test:e2e": "jest --config ./test/jest-e2e.json",
      "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
      "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
      "db:migrate": "prisma migrate dev",
      "db:push": "prisma db push",
      "db:seed": "prisma db seed",
      "db:studio": "prisma studio"
    },
    dependencies: {
      "@nestjs/apollo": "^12.0.0",
      "@nestjs/common": "^10.0.0",
      "@nestjs/config": "^3.1.0",
      "@nestjs/core": "^10.0.0",
      "@nestjs/graphql": "^12.0.0",
      "@nestjs/jwt": "^10.2.0",
      "@nestjs/passport": "^10.0.0",
      "@nestjs/platform-express": "^10.0.0",
      "@prisma/client": "^5.7.0",
      "apollo-server-express": "^3.13.0",
      "bcrypt": "^5.1.1",
      "bull": "^4.11.5",
      "class-transformer": "^0.5.1",
      "class-validator": "^0.14.0",
      "graphql": "^16.8.0",
      "ioredis": "^5.3.2",
      "passport": "^0.7.0",
      "passport-jwt": "^4.0.1",
      "passport-local": "^1.0.0"
    },
    devDependencies: {
      "@nestjs/cli": "^10.0.0",
      "@nestjs/schematics": "^10.0.0",
      "@nestjs/testing": "^10.0.0",
      "@types/bcrypt": "^5.0.2",
      "@types/express": "^4.17.17",
      "@types/jest": "^29.5.2",
      "@types/node": "^20.3.1",
      "@types/passport-jwt": "^4.0.0",
      "@types/passport-local": "^1.0.38",
      "@typescript-eslint/eslint-plugin": "^6.0.0",
      "@typescript-eslint/parser": "^6.0.0",
      "eslint": "^8.42.0",
      "eslint-config-prettier": "^9.0.0",
      "eslint-plugin-prettier": "^5.0.0",
      "jest": "^29.5.0",
      "prettier": "^3.0.0",
      "prisma": "^5.7.0",
      "source-map-support": "^0.5.21",
      "ts-jest": "^29.1.0",
      "ts-loader": "^9.4.3",
      "ts-node": "^10.9.1",
      "tsconfig-paths": "^4.2.0",
      "typescript": "^5.1.3"
    }
  };
  
  fs.writeFileSync(
    path.join(__dirname, '../backend/package.json'),
    JSON.stringify(backendPackage, null, 2)
  );
  
  // Frontend package.json
  const frontendPackage = {
    name: "@geo-platform/frontend",
    version: "1.0.0",
    description: "GEO Platform Frontend",
    scripts: {
      "dev": "next dev",
      "build": "next build",
      "start": "next start",
      "lint": "next lint",
      "test": "vitest",
      "test:ui": "vitest --ui",
      "test:e2e": "playwright test",
      "type-check": "tsc --noEmit",
      "format": "prettier --write ."
    },
    dependencies: {
      "@ant-design/icons": "^5.2.6",
      "@ant-design/pro-components": "^2.6.0",
      "@apollo/client": "^3.8.0",
      "@hookform/resolvers": "^3.3.0",
      "@lexical/react": "^0.12.0",
      "antd": "^5.12.0",
      "echarts": "^5.4.3",
      "echarts-for-react": "^3.0.2",
      "graphql": "^16.8.0",
      "lexical": "^0.12.0",
      "next": "14.0.0",
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "react-hook-form": "^7.48.0",
      "recharts": "^2.10.0",
      "zod": "^3.22.0",
      "zustand": "^4.4.0"
    },
    devDependencies: {
      "@playwright/test": "^1.40.0",
      "@testing-library/jest-dom": "^6.1.0",
      "@testing-library/react": "^14.1.0",
      "@types/node": "^20.0.0",
      "@types/react": "^18.2.0",
      "@types/react-dom": "^18.2.0",
      "@vitejs/plugin-react": "^4.2.0",
      "autoprefixer": "^10.4.0",
      "eslint": "^8.0.0",
      "eslint-config-next": "14.0.0",
      "postcss": "^8.4.0",
      "prettier": "^3.0.0",
      "tailwindcss": "^3.3.0",
      "typescript": "^5.0.0",
      "vitest": "^1.0.0"
    }
  };
  
  fs.writeFileSync(
    path.join(__dirname, '../frontend/package.json'),
    JSON.stringify(frontendPackage, null, 2)
  );
  
  // Shared package.json
  const sharedPackage = {
    name: "@geo-platform/shared",
    version: "1.0.0",
    description: "GEO Platform Shared Types and Utils",
    main: "dist/index.js",
    types: "dist/index.d.ts",
    scripts: {
      "build": "tsc",
      "watch": "tsc --watch"
    },
    devDependencies: {
      "typescript": "^5.0.0"
    }
  };
  
  fs.writeFileSync(
    path.join(__dirname, '../shared/package.json'),
    JSON.stringify(sharedPackage, null, 2)
  );
  
  log('✅ 初始文件已创建', 'green');
}

async function showNextSteps() {
  log('\n🎉 项目初始化完成！', 'bright');
  log('\n接下来的步骤：', 'yellow');
  log('1. 配置环境变量：复制 .env.example 为 .env 并填写必要的配置', 'blue');
  log('2. 启动开发服务器：npm run dev', 'blue');
  log('3. 访问应用：http://localhost:3000', 'blue');
  log('4. 查看文档：docs/ 目录', 'blue');
  log('\n常用命令：', 'yellow');
  log('npm run dev          - 启动所有服务', 'blue');
  log('npm run docker:up    - 启动 Docker 服务', 'blue');
  log('npm run db:migrate   - 运行数据库迁移', 'blue');
  log('npm run test         - 运行测试', 'blue');
  log('npm run build        - 构建生产版本', 'blue');
}

async function main() {
  log('🚀 Eufy GEO 平台安装向导', 'bright');
  log('============================\n', 'bright');
  
  try {
    await checkPrerequisites();
    await createEnvFiles();
    await createInitialFiles();
    await installDependencies();
    await setupDocker();
    await initializeDatabase();
    await showNextSteps();
  } catch (error) {
    log(`\n❌ 安装失败: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
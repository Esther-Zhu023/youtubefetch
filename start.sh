#!/bin/bash

echo "🚀 启动AI趋势发现平台..."

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 请先安装Node.js (https://nodejs.org/)"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"

# 安装后端依赖
echo "📦 安装后端依赖..."
npm install

# 检查前端目录
if [ ! -d "client" ]; then
    echo "📁 创建前端目录..."
    mkdir -p client/src/components client/src/pages client/public
fi

# 安装前端依赖
echo "📦 安装前端依赖..."
cd client && npm install && cd ..

# 复制环境变量文件
if [ ! -f .env ]; then
    echo "📝 创建环境变量文件..."
    cp .env.example .env
    echo "✅ 已创建 .env 文件"
fi

echo ""
echo "🎯 启动选项:"
echo "1. 仅启动后端服务器: npm run server:dev"
echo "2. 启动完整应用: npm run dev"
echo ""

# 先启动后端测试
echo "🔧 启动后端服务器..."
npm run server:dev
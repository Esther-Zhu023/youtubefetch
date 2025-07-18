# AI趋势发现平台 - 设置指南

## 🚀 快速开始

### 1. 环境要求
- Node.js >= 16.0.0
- MongoDB >= 4.4
- Redis >= 6.0 (可选，用于缓存)
- Git

### 2. 安装步骤

#### 第一步：克隆项目
```bash
git clone <your-repo-url>
cd ai-trend-discovery
```

#### 第二步：安装依赖
```bash
# 给启动脚本执行权限
chmod +x start.sh

# 运行自动安装脚本
./start.sh
```

或者手动安装：
```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd client && npm install && cd ..
```

#### 第三步：配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置文件
nano .env  # 或使用你喜欢的编辑器
```

### 3. 环境变量配置

编辑 `.env` 文件，配置以下参数：

```bash
# 数据库配置
MONGODB_URI=mongodb://localhost:27017/ai-trends
REDIS_URL=redis://localhost:6379

# GitHub API (必需 - 用于获取开源项目数据)
GITHUB_TOKEN=ghp_your_github_personal_access_token

# Product Hunt API (可选)
PRODUCTHUNT_TOKEN=your_producthunt_api_token

# Twitter API (可选)
TWITTER_BEARER_TOKEN=your_twitter_bearer_token

# 服务器配置
PORT=3001
NODE_ENV=development
```

### 4. 获取API密钥

#### GitHub Token (必需)
1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 选择权限：`public_repo`, `read:user`
4. 复制生成的token到 `GITHUB_TOKEN`

#### Product Hunt Token (可选)
1. 访问 https://api.producthunt.com/v2/oauth/applications
2. 创建应用获取API密钥
3. 复制到 `PRODUCTHUNT_TOKEN`

#### Twitter Bearer Token (可选)
1. 访问 https://developer.twitter.com/
2. 创建应用获取Bearer Token
3. 复制到 `TWITTER_BEARER_TOKEN`

### 5. 启动服务

#### 开发模式
```bash
npm run dev
```
这会同时启动：
- 后端服务器: http://localhost:3001
- 前端开发服务器: http://localhost:3000

#### 生产模式
```bash
# 构建前端
npm run build

# 启动生产服务器
npm start
```

## 🔧 详细配置

### MongoDB 设置

#### 本地安装MongoDB
```bash
# macOS
brew install mongodb-community

# Ubuntu
sudo apt-get install mongodb

# 启动MongoDB服务
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Ubuntu
```

#### 使用MongoDB Atlas (云数据库)
1. 访问 https://www.mongodb.com/atlas
2. 创建免费集群
3. 获取连接字符串
4. 更新 `MONGODB_URI` 为你的Atlas连接字符串

### Redis 设置 (可选)

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu
sudo apt-get install redis-server
sudo systemctl start redis
```

### 数据采集配置

在 `.env` 中可以配置数据采集参数：
```bash
# 数据采集间隔 (毫秒)
COLLECTION_INTERVAL=3600000  # 1小时

# API请求限制
MAX_REQUESTS_PER_MINUTE=60
```

## 📊 初始化数据

### 手动触发数据采集
```bash
# 启动服务器后，访问以下API触发数据采集
curl http://localhost:3001/api/admin/collect-data
```

### 或者在代码中添加初始数据
```javascript
// 可以在 src/scripts/seed.js 中添加种子数据
const seedData = [
  {
    name: "ChatGPT",
    description: "OpenAI开发的大型语言模型",
    category: "大模型",
    hotScore: 95,
    // ... 更多字段
  }
];
```

## 🚀 部署到生产环境

### 使用PM2部署
```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start src/server.js --name "ai-trends"

# 设置开机自启
pm2 startup
pm2 save
```

### 使用Docker部署
```bash
# 构建镜像
docker build -t ai-trend-discovery .

# 运行容器
docker run -d \
  --name ai-trends \
  -p 3001:3001 \
  -e MONGODB_URI=your_mongodb_uri \
  -e GITHUB_TOKEN=your_github_token \
  ai-trend-discovery
```

### Nginx反向代理配置
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔍 故障排除

### 常见问题

#### 1. MongoDB连接失败
```bash
# 检查MongoDB是否运行
brew services list | grep mongodb  # macOS
sudo systemctl status mongod       # Ubuntu

# 检查连接字符串格式
mongodb://localhost:27017/ai-trends
```

#### 2. GitHub API限制
- 确保GitHub Token有效
- 检查API请求限制 (每小时5000次)
- 考虑使用多个Token轮换

#### 3. 前端无法连接后端
- 检查 `client/package.json` 中的 `proxy` 设置
- 确保后端服务器在3001端口运行

#### 4. 数据采集失败
```bash
# 查看服务器日志
tail -f logs/app.log

# 检查网络连接
curl -I https://api.github.com
```

### 日志查看
```bash
# 开发模式日志
npm run dev

# 生产模式日志
pm2 logs ai-trends
```

## 📈 性能优化

### 数据库索引
```javascript
// 在MongoDB中创建索引
db.projects.createIndex({ "hotScore": -1 })
db.projects.createIndex({ "category": 1, "hotScore": -1 })
db.projects.createIndex({ "tags": 1 })
```

### Redis缓存
```javascript
// 缓存热门项目数据
const cacheKey = `hot_projects_${category}`;
const cachedData = await redis.get(cacheKey);
if (cachedData) {
  return JSON.parse(cachedData);
}
```

## 🔐 安全配置

### API限制
```javascript
// 添加速率限制
const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制每个IP 100次请求
});
app.use(limiter);
```

### 环境变量安全
- 不要将 `.env` 文件提交到Git
- 生产环境使用环境变量或密钥管理服务
- 定期轮换API密钥

## 📞 获取帮助

如果遇到问题：
1. 查看 [故障排除](#故障排除) 部分
2. 检查GitHub Issues
3. 查看项目文档
4. 联系维护者

---

🎉 恭喜！你的AI趋势发现平台已经准备就绪！
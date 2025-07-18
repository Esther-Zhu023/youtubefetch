# 使用Node.js官方镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json文件
COPY package*.json ./
COPY client/package*.json ./client/

# 安装依赖
RUN npm install
RUN cd client && npm install

# 复制源代码
COPY . .

# 构建前端
RUN cd client && npm run build

# 暴露端口
EXPOSE 3001

# 设置环境变量
ENV NODE_ENV=production

# 启动应用
CMD ["node", "src/server.js"]
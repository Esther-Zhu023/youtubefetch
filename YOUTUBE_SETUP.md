# YouTube API 配置指南

## 🎯 获取YouTube API密钥

### 1. 创建Google Cloud项目
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 点击"创建项目"或选择现有项目
3. 输入项目名称，如"AI趋势发现平台"

### 2. 启用YouTube Data API v3
1. 在Google Cloud Console中，转到"API和服务" > "库"
2. 搜索"YouTube Data API v3"
3. 点击进入并点击"启用"

### 3. 创建API密钥
1. 转到"API和服务" > "凭据"
2. 点击"创建凭据" > "API密钥"
3. 复制生成的API密钥
4. （可选）点击"限制密钥"来设置使用限制

### 4. 配置API密钥限制（推荐）
- **应用程序限制**: 选择"HTTP引用站点"或"IP地址"
- **API限制**: 选择"限制密钥"，然后选择"YouTube Data API v3"

## 🔧 配置项目

### 1. 更新环境变量
编辑 `.env` 文件：
```bash
# YouTube API配置
YOUTUBE_API_KEY=your_youtube_api_key_here
```

### 2. API配额限制
- **免费配额**: 每天10,000个单位
- **搜索请求**: 每次消耗100个单位
- **视频详情**: 每次消耗1个单位
- **频道详情**: 每次消耗1个单位

### 3. 优化建议
- 合理设置采集频率，避免超出配额
- 优先采集高质量内容
- 使用缓存减少重复请求

## 🚀 测试YouTube数据采集

### 1. 启动服务器
```bash
npm run server:dev
```

### 2. 手动触发YouTube数据采集
```bash
# 方法1: 使用curl
curl -X POST http://localhost:3001/api/admin/collect-youtube

# 方法2: 访问浏览器
# http://localhost:3001/api/admin/collect-youtube
```

### 3. 检查采集状态
```bash
curl http://localhost:3001/api/admin/status
```

## 📊 YouTube数据类型

### 采集的频道类型
- AI教育频道（Two Minute Papers, Lex Fridman等）
- 技术教程频道
- AI新闻和评测频道
- 开源项目演示频道

### 采集的视频类型
- AI工具教程
- 技术讲解视频
- 项目演示视频
- AI新闻和趋势分析

### 数据字段
- 视频/频道基本信息
- 播放量、点赞数、评论数
- 发布时间
- 标签和分类
- 频道订阅数

## 🔍 故障排除

### 常见错误

#### 1. API密钥无效
```
Error: The request cannot be completed because you have exceeded your quota.
```
**解决方案**: 检查API密钥是否正确，是否启用了YouTube Data API v3

#### 2. 配额超限
```
Error: quotaExceeded
```
**解决方案**: 
- 等待配额重置（每天重置）
- 减少采集频率
- 考虑升级到付费计划

#### 3. API密钥限制
```
Error: API key not valid
```
**解决方案**: 检查API密钥的IP限制或HTTP引用站点限制

### 调试技巧
```bash
# 查看详细日志
npm run server:dev

# 测试单个API调用
curl "https://www.googleapis.com/youtube/v3/search?key=YOUR_API_KEY&q=AI&type=video&part=snippet&maxResults=1"
```

## 💡 优化建议

### 1. 采集策略
- 优先采集订阅数高的频道
- 关注最近发布的视频
- 过滤低质量内容

### 2. 数据质量
- 设置最低播放量阈值
- 验证内容相关性
- 去重处理

### 3. 性能优化
- 批量处理请求
- 使用适当的延迟
- 缓存频道信息

---

配置完成后，你的平台将能够：
- 🎥 自动采集AI相关YouTube内容
- 📈 分析视频热度和趋势
- 🔍 发现新兴AI创作者
- 📊 提供YouTube数据分析
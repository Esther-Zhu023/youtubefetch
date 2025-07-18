const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/build')));

// 数据库连接
const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ MongoDB 连接成功');
    } else {
      console.log('⚠️  MongoDB URI 未配置，使用模拟数据');
    }
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error.message);
    console.log('📝 将使用模拟数据运行');
  }
};

connectDB();

// 路由
app.use('/api/trends', require('./routes/trends'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/keywords', require('./routes/keywords'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/admin', require('./routes/admin'));

// 基础路由
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'AI趋势发现平台运行正常',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// 初始化定时任务调度器
const scheduler = require('./config/scheduler');
scheduler.initializeScheduler();

// 模拟数据路由
app.get('/api/trends/hot', (req, res) => {
  const mockData = [
    {
      _id: '1',
      name: 'ChatGPT',
      description: 'OpenAI开发的大型语言模型，能够进行自然语言对话',
      category: '大模型',
      hotScore: 95,
      githubStars: 50000,
      tags: ['LLM', 'OpenAI', 'Chat'],
      isHot: true,
      lastUpdated: new Date()
    },
    {
      _id: '2', 
      name: 'LangChain',
      description: '用于构建LLM应用的框架',
      category: 'AI框架',
      hotScore: 88,
      githubStars: 45000,
      tags: ['Framework', 'LLM', 'Python'],
      isHot: true,
      lastUpdated: new Date()
    }
  ];
  
  res.json({
    success: true,
    data: mockData,
    pagination: { page: 1, limit: 10, total: 2 }
  });
});

app.get('/api/trends/niche', (req, res) => {
  const mockData = [
    {
      _id: '3',
      name: 'LocalAI',
      description: '本地部署的AI模型服务',
      category: '本地AI',
      hotScore: 45,
      innovationScore: 75,
      githubStars: 8000,
      tags: ['Local', 'Privacy', 'Self-hosted'],
      isNiche: true,
      lastUpdated: new Date()
    }
  ];
  
  res.json({ success: true, data: mockData });
});

app.get('/api/keywords/trending', (req, res) => {
  const mockData = [
    { keyword: 'RAG', count: 25 },
    { keyword: 'Agent', count: 20 },
    { keyword: 'LLM', count: 35 },
    { keyword: 'Transformer', count: 15 }
  ];
  
  res.json({ success: true, data: mockData });
});

app.get('/api/analytics/overview', (req, res) => {
  const mockData = {
    overview: {
      totalProjects: 150,
      hotProjects: 25,
      nicheProjects: 45,
      emergingProjects: 30
    },
    categoryStats: [
      { _id: '大模型', count: 35, avgHotScore: 75 },
      { _id: 'AI框架', count: 28, avgHotScore: 65 },
      { _id: 'AI工具', count: 42, avgHotScore: 55 }
    ]
  };
  
  res.json({ success: true, data: mockData });
});

// 前端路由处理
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`);
  console.log(`📊 访问 http://localhost:${PORT} 查看应用`);
  console.log(`🔧 API健康检查: http://localhost:${PORT}/api/health`);
});
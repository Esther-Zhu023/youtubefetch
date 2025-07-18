const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  category: String,
  tags: [String],
  
  // 基本信息
  website: String,
  github: String,
  founded: Date,
  team: [{
    name: String,
    role: String,
    background: String
  }],
  
  // 技术栈
  techStack: [String],
  aiTechnologies: [String], // RAG, Agent, MCP等
  
  // 热度指标
  hotScore: { type: Number, default: 0 },
  trendScore: { type: Number, default: 0 },
  innovationScore: { type: Number, default: 0 },
  
  // 社交指标
  githubStars: Number,
  githubForks: Number,
  twitterFollowers: Number,
  
  // YouTube数据
  youtubeData: {
    videoId: String,
    channelId: String,
    channelTitle: String,
    viewCount: Number,
    likeCount: Number,
    commentCount: Number,
    subscriberCount: Number,
    videoCount: Number,
    publishedAt: Date,
    type: { type: String, enum: ['video', 'channel'] }
  },
  
  // 其他平台数据
  votesCount: Number, // ProductHunt投票数
  commentsCount: Number,
  
  // 分类标记
  isHot: { type: Boolean, default: false },
  isNiche: { type: Boolean, default: false },
  isEmerging: { type: Boolean, default: false },
  
  // 元数据
  lastUpdated: { type: Date, default: Date.now },
  dataSource: String,
  verified: { type: Boolean, default: false }
});

// 索引优化
projectSchema.index({ hotScore: -1 });
projectSchema.index({ category: 1, hotScore: -1 });
projectSchema.index({ tags: 1 });
projectSchema.index({ dataSource: 1 });
projectSchema.index({ 'youtubeData.channelId': 1 });
projectSchema.index({ 'youtubeData.videoId': 1 });

module.exports = mongoose.model('Project', projectSchema);
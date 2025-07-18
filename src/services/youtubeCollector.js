const axios = require('axios');
const Project = require('../models/Project');
const { calculateHotScore } = require('./hotScoreAlgorithm');
const nlpAnalyzer = require('./nlpAnalyzer');

class YouTubeCollector {
  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY;
    this.baseUrl = 'https://www.googleapis.com/youtube/v3';
    
    // AI相关搜索关键词
    this.aiKeywords = [
      'AI tutorial', 'machine learning', 'deep learning', 'ChatGPT',
      'artificial intelligence', 'neural network', 'LLM', 'GPT',
      'computer vision', 'NLP', 'transformer', 'AI tools',
      'AI coding', 'AI programming', 'OpenAI', 'AI news',
      'AI projects', 'AI startup', 'AI innovation', 'RAG',
      'AI agent', 'langchain', 'vector database', 'embedding'
    ];
  }

  async collectYouTubeData() {
    console.log('开始采集YouTube AI相关数据...');
    
    if (!this.apiKey) {
      console.error('YouTube API密钥未配置');
      return;
    }

    try {
      // 采集热门AI频道
      await this.collectPopularChannels();
      
      // 采集AI相关视频
      await this.collectAIVideos();
      
      // 采集AI工具和项目相关视频
      await this.collectAIToolVideos();
      
      console.log('YouTube数据采集完成');
    } catch (error) {
      console.error('YouTube数据采集失败:', error.message);
    }
  }

  async collectPopularChannels() {
    const aiChannels = [
      'Two Minute Papers', 'Lex Fridman', 'AI Explained', 
      'Machine Learning Street Talk', 'Yannic Kilcher',
      'CodeEmporium', 'sentdex', '3Blue1Brown',
      'DeepLearningAI', 'OpenAI'
    ];

    for (const channelName of aiChannels) {
      try {
        await this.sleep(1000); // API限制
        
        // 搜索频道
        const searchResponse = await axios.get(`${this.baseUrl}/search`, {
          params: {
            key: this.apiKey,
            q: channelName,
            type: 'channel',
            part: 'snippet',
            maxResults: 1
          }
        });

        if (searchResponse.data.items.length > 0) {
          const channel = searchResponse.data.items[0];
          
          // 获取频道详细信息
          const channelResponse = await axios.get(`${this.baseUrl}/channels`, {
            params: {
              key: this.apiKey,
              id: channel.id.channelId,
              part: 'snippet,statistics'
            }
          });

          if (channelResponse.data.items.length > 0) {
            await this.saveChannelAsProject(channelResponse.data.items[0]);
          }
        }
      } catch (error) {
        console.error(`采集频道 ${channelName} 失败:`, error.message);
      }
    }
  }

  async collectAIVideos() {
    for (const keyword of this.aiKeywords.slice(0, 10)) { // 限制搜索数量
      try {
        await this.sleep(1000);
        
        const response = await axios.get(`${this.baseUrl}/search`, {
          params: {
            key: this.apiKey,
            q: keyword,
            type: 'video',
            part: 'snippet',
            maxResults: 20,
            order: 'relevance',
            publishedAfter: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 最近30天
            videoDuration: 'medium' // 中等长度视频
          }
        });

        for (const video of response.data.items) {
          await this.processVideo(video, keyword);
        }
      } catch (error) {
        console.error(`搜索关键词 ${keyword} 失败:`, error.message);
      }
    }
  }

  async collectAIToolVideos() {
    const toolKeywords = [
      'ChatGPT tutorial', 'Midjourney guide', 'Stable Diffusion',
      'LangChain tutorial', 'OpenAI API', 'Hugging Face',
      'AI coding tools', 'GitHub Copilot', 'AI productivity'
    ];

    for (const keyword of toolKeywords) {
      try {
        await this.sleep(1000);
        
        const response = await axios.get(`${this.baseUrl}/search`, {
          params: {
            key: this.apiKey,
            q: keyword,
            type: 'video',
            part: 'snippet',
            maxResults: 15,
            order: 'viewCount'
          }
        });

        for (const video of response.data.items) {
          await this.processVideo(video, keyword, 'AI工具');
        }
      } catch (error) {
        console.error(`搜索AI工具 ${keyword} 失败:`, error.message);
      }
    }
  }

  async processVideo(video, searchKeyword, category = null) {
    try {
      // 获取视频详细统计信息
      const statsResponse = await axios.get(`${this.baseUrl}/videos`, {
        params: {
          key: this.apiKey,
          id: video.id.videoId,
          part: 'statistics,snippet'
        }
      });

      if (statsResponse.data.items.length > 0) {
        const videoData = statsResponse.data.items[0];
        await this.saveVideoAsProject(videoData, searchKeyword, category);
      }
    } catch (error) {
      console.error(`处理视频失败:`, error.message);
    }
  }

  async saveChannelAsProject(channel) {
    const stats = channel.statistics;
    const snippet = channel.snippet;
    
    // 分析频道描述
    const aiTech = nlpAnalyzer.detectAITechnologies(snippet.description);
    const category = nlpAnalyzer.classifyProject(snippet.description);
    
    const projectData = {
      name: snippet.title,
      description: snippet.description,
      category: category || 'AI频道',
      website: `https://www.youtube.com/channel/${channel.id}`,
      
      // YouTube特有数据
      youtubeData: {
        channelId: channel.id,
        subscriberCount: parseInt(stats.subscriberCount) || 0,
        videoCount: parseInt(stats.videoCount) || 0,
        viewCount: parseInt(stats.viewCount) || 0,
        type: 'channel'
      },
      
      // 转换为通用指标
      githubStars: Math.floor((parseInt(stats.subscriberCount) || 0) / 1000), // 订阅数转换
      twitterFollowers: parseInt(stats.subscriberCount) || 0,
      
      tags: [
        'YouTube', 'AI教育', 'AI频道',
        ...aiTech,
        ...this.extractTagsFromTitle(snippet.title)
      ],
      
      aiTechnologies: aiTech,
      dataSource: 'YouTube',
      lastUpdated: new Date(),
      
      // 计算热度分数
      hotScore: this.calculateYouTubeHotScore({
        subscriberCount: parseInt(stats.subscriberCount) || 0,
        viewCount: parseInt(stats.viewCount) || 0,
        videoCount: parseInt(stats.videoCount) || 0
      })
    };

    await this.saveProject(projectData);
  }

  async saveVideoAsProject(video, searchKeyword, category) {
    const stats = video.statistics;
    const snippet = video.snippet;
    
    // 只保存高质量视频
    const viewCount = parseInt(stats.viewCount) || 0;
    const likeCount = parseInt(stats.likeCount) || 0;
    
    if (viewCount < 1000) return; // 过滤低播放量视频
    
    const aiTech = nlpAnalyzer.detectAITechnologies(
      `${snippet.title} ${snippet.description}`
    );
    
    const projectData = {
      name: snippet.title,
      description: snippet.description,
      category: category || nlpAnalyzer.classifyProject(snippet.description) || 'AI视频',
      website: `https://www.youtube.com/watch?v=${video.id}`,
      
      youtubeData: {
        videoId: video.id,
        channelId: snippet.channelId,
        channelTitle: snippet.channelTitle,
        viewCount: viewCount,
        likeCount: likeCount,
        commentCount: parseInt(stats.commentCount) || 0,
        publishedAt: snippet.publishedAt,
        type: 'video'
      },
      
      // 转换指标
      githubStars: Math.floor(viewCount / 10000), // 播放量转换
      twitterFollowers: likeCount,
      
      tags: [
        'YouTube', 'AI视频', searchKeyword,
        ...aiTech,
        ...this.extractTagsFromTitle(snippet.title)
      ],
      
      aiTechnologies: aiTech,
      dataSource: 'YouTube',
      lastUpdated: new Date(),
      
      hotScore: this.calculateYouTubeHotScore({
        viewCount,
        likeCount,
        commentCount: parseInt(stats.commentCount) || 0,
        publishedAt: snippet.publishedAt
      })
    };

    await this.saveProject(projectData);
  }

  calculateYouTubeHotScore(metrics) {
    const {
      subscriberCount = 0,
      viewCount = 0,
      videoCount = 0,
      likeCount = 0,
      commentCount = 0,
      publishedAt
    } = metrics;

    let score = 0;
    
    // 订阅数/播放量评分 (0-40分)
    if (subscriberCount > 0) {
      score += Math.min(40, Math.log10(subscriberCount + 1) * 4);
    } else {
      score += Math.min(40, Math.log10(viewCount + 1) * 3);
    }
    
    // 互动评分 (0-30分)
    score += Math.min(30, Math.log10(likeCount + 1) * 3);
    score += Math.min(10, Math.log10(commentCount + 1) * 2);
    
    // 内容质量评分 (0-20分)
    if (videoCount > 0) {
      score += Math.min(20, Math.log10(videoCount + 1) * 2);
    }
    
    // 时间新鲜度 (0-10分)
    if (publishedAt) {
      const daysSincePublished = (new Date() - new Date(publishedAt)) / (1000 * 60 * 60 * 24);
      if (daysSincePublished <= 7) score += 10;
      else if (daysSincePublished <= 30) score += 7;
      else if (daysSincePublished <= 90) score += 5;
    }
    
    return Math.min(100, Math.max(0, Math.round(score)));
  }

  extractTagsFromTitle(title) {
    const commonTags = [];
    const lowerTitle = title.toLowerCase();
    
    const tagMap = {
      'tutorial': '教程',
      'guide': '指南', 
      'review': '评测',
      'news': '新闻',
      'tips': '技巧',
      'beginner': '入门',
      'advanced': '进阶',
      'project': '项目',
      'coding': '编程',
      'python': 'Python',
      'javascript': 'JavaScript'
    };
    
    Object.entries(tagMap).forEach(([en, zh]) => {
      if (lowerTitle.includes(en)) {
        commonTags.push(zh);
      }
    });
    
    return commonTags;
  }

  async saveProject(projectData) {
    try {
      // 检查是否已存在（基于YouTube ID或标题）
      let existingProject;
      
      if (projectData.youtubeData?.videoId) {
        existingProject = await Project.findOne({
          'youtubeData.videoId': projectData.youtubeData.videoId
        });
      } else if (projectData.youtubeData?.channelId) {
        existingProject = await Project.findOne({
          'youtubeData.channelId': projectData.youtubeData.channelId,
          'youtubeData.type': 'channel'
        });
      }
      
      if (!existingProject) {
        existingProject = await Project.findOne({ 
          name: projectData.name,
          dataSource: 'YouTube'
        });
      }
      
      if (existingProject) {
        // 更新现有项目
        Object.assign(existingProject, projectData);
        existingProject.lastUpdated = new Date();
        await existingProject.save();
        console.log(`更新YouTube项目: ${projectData.name}`);
      } else {
        // 创建新项目
        const project = new Project(projectData);
        await project.save();
        console.log(`新增YouTube项目: ${projectData.name}`);
      }
    } catch (error) {
      console.error('保存YouTube项目失败:', error.message);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new YouTubeCollector();
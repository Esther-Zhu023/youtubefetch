const axios = require('axios');
const cheerio = require('cheerio');
const Project = require('../models/Project');
const { calculateHotScore } = require('./hotScoreAlgorithm');
const youtubeCollector = require('./youtubeCollector');

class DataCollector {
  constructor() {
    this.sources = [
      { name: 'YouTube', handler: this.collectFromYouTube },
      { name: 'GitHub', handler: this.collectFromGitHub },
      { name: 'ProductHunt', handler: this.collectFromProductHunt },
      { name: 'HuggingFace', handler: this.collectFromHuggingFace }
    ];
  }

  async runCollection() {
    console.log('🚀 开始数据采集...');
    
    for (const source of this.sources) {
      try {
        console.log(`📊 采集 ${source.name} 数据...`);
        await source.handler.call(this);
        await this.sleep(2000); // 避免请求过频
      } catch (error) {
        console.error(`❌ 采集 ${source.name} 失败:`, error.message);
      }
    }
    
    // 更新热度分数
    await this.updateHotScores();
    console.log('✅ 数据采集完成');
  }

  async collectFromYouTube() {
    await youtubeCollector.collectYouTubeData();
  }

  async collectFromGitHub() {
    if (!process.env.GITHUB_TOKEN) {
      console.log('⚠️  GitHub Token未配置，跳过GitHub数据采集');
      return;
    }

    const queries = [
      'AI+agent', 'RAG', 'LLM', 'ChatGPT', 'GPT', 
      'machine+learning', 'deep+learning', 'neural+network'
    ];
    
    for (const query of queries) {
      try {
        const response = await axios.get(`https://api.github.com/search/repositories`, {
          params: {
            q: query + '+language:python+language:javascript',
            sort: 'stars',
            order: 'desc',
            per_page: 20
          },
          headers: {
            'Authorization': `token ${process.env.GITHUB_TOKEN}`,
            'User-Agent': 'AI-Trend-Discovery'
          }
        });

        for (const repo of response.data.items) {
          await this.saveProject({
            name: repo.name,
            description: repo.description,
            website: repo.html_url,
            github: repo.html_url,
            githubStars: repo.stargazers_count,
            githubForks: repo.forks_count,
            tags: repo.topics || [],
            dataSource: 'GitHub',
            category: this.categorizeProject(repo.description, repo.topics)
          });
        }
        
        await this.sleep(1000); // GitHub API限制
      } catch (error) {
        console.error(`GitHub查询失败 ${query}:`, error.message);
      }
    }
  }

  async collectFromProductHunt() {
    if (!process.env.PRODUCTHUNT_TOKEN) {
      console.log('⚠️  ProductHunt Token未配置，跳过ProductHunt数据采集');
      return;
    }

    try {
      const response = await axios.post('https://api.producthunt.com/v2/api/graphql', {
        query: `
          query {
            posts(first: 50, topic: "artificial-intelligence") {
              edges {
                node {
                  name
                  tagline
                  description
                  website
                  votesCount
                  commentsCount
                  topics {
                    edges {
                      node {
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        `
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.PRODUCTHUNT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data?.data?.posts?.edges) {
        for (const edge of response.data.data.posts.edges) {
          const post = edge.node;
          await this.saveProject({
            name: post.name,
            description: post.tagline,
            website: post.website,
            tags: post.topics.edges.map(t => t.node.name),
            dataSource: 'ProductHunt',
            category: this.categorizeProject(post.description)
          });
        }
      }
    } catch (error) {
      console.error('ProductHunt采集失败:', error.message);
    }
  }

  async collectFromHuggingFace() {
    try {
      const response = await axios.get('https://huggingface.co/api/models', {
        params: {
          sort: 'downloads',
          direction: -1,
          limit: 50,
          filter: 'text-generation'
        }
      });

      for (const model of response.data) {
        await this.saveProject({
          name: model.modelId,
          description: model.pipeline_tag || 'AI模型',
          website: `https://huggingface.co/${model.modelId}`,
          tags: model.tags || [],
          dataSource: 'HuggingFace',
          category: 'AI模型'
        });
      }
    } catch (error) {
      console.error('HuggingFace采集失败:', error.message);
    }
  }

  async saveProject(projectData) {
    try {
      const existingProject = await Project.findOne({ 
        name: projectData.name,
        dataSource: projectData.dataSource 
      });
      
      if (existingProject) {
        // 更新现有项目
        Object.assign(existingProject, projectData);
        existingProject.lastUpdated = new Date();
        await existingProject.save();
      } else {
        // 创建新项目
        const project = new Project(projectData);
        await project.save();
      }
    } catch (error) {
      console.error('保存项目失败:', error.message);
    }
  }

  async updateHotScores() {
    console.log('🔄 更新热度分数...');
    const projects = await Project.find({});
    
    for (const project of projects) {
      const hotScore = calculateHotScore({
        githubStars: project.githubStars || 0,
        githubForks: project.githubForks || 0,
        twitterFollowers: project.twitterFollowers || 0,
        lastUpdated: project.lastUpdated,
        category: project.category,
        viewCount: project.youtubeData?.viewCount || 0,
        votesCount: project.votesCount || 0
      });
      
      project.hotScore = hotScore;
      project.isHot = hotScore > 70;
      project.isNiche = hotScore < 40 && hotScore > 15;
      project.isEmerging = this.isEmerging(project);
      
      await project.save();
    }
  }

  categorizeProject(description, topics = []) {
    if (!description) return '其他';
    
    const categories = {
      '大模型': ['llm', 'gpt', 'language model', 'transformer', 'chatgpt'],
      'AI搜索': ['search', 'retrieval', 'rag', 'vector'],
      'AI办公': ['office', 'productivity', 'automation', 'workflow'],
      'AI编程': ['code', 'programming', 'developer', 'copilot'],
      'AI内容': ['content', 'generation', 'creative', 'image', 'video'],
      'AI Agent': ['agent', 'autonomous', 'multi-agent'],
      'AI教育': ['tutorial', 'course', 'learning', 'education'],
      'AI工具': ['tool', 'api', 'platform', 'service']
    };

    const text = (description + ' ' + topics.join(' ')).toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }
    
    return '其他';
  }

  isEmerging(project) {
    const recentDate = new Date();
    recentDate.setMonth(recentDate.getMonth() - 6);
    return project.lastUpdated > recentDate && project.hotScore > 20;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new DataCollector();
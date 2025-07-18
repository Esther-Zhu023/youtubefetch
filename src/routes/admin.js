const express = require('express');
const router = express.Router();
const dataCollector = require('../services/dataCollector');
const youtubeCollector = require('../services/youtubeCollector');
const Project = require('../models/Project');

// 手动触发数据采集
router.post('/collect-data', async (req, res) => {
  try {
    console.log('🚀 手动触发数据采集...');
    
    // 异步执行数据采集，不阻塞响应
    dataCollector.runCollection().catch(error => {
      console.error('数据采集过程中出错:', error);
    });
    
    res.json({
      success: true,
      message: '数据采集已开始，请稍后查看结果'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 仅采集YouTube数据
router.post('/collect-youtube', async (req, res) => {
  try {
    console.log('📺 开始采集YouTube数据...');
    
    youtubeCollector.collectYouTubeData().catch(error => {
      console.error('YouTube数据采集出错:', error);
    });
    
    res.json({
      success: true,
      message: 'YouTube数据采集已开始'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取数据采集状态
router.get('/status', async (req, res) => {
  try {
    const stats = await Project.aggregate([
      {
        $group: {
          _id: '$dataSource',
          count: { $sum: 1 },
          avgHotScore: { $avg: '$hotScore' },
          lastUpdated: { $max: '$lastUpdated' }
        }
      }
    ]);
    
    const totalProjects = await Project.countDocuments();
    
    res.json({
      success: true,
      data: {
        totalProjects,
        bySource: stats,
        lastCollection: stats.reduce((latest, source) => {
          return source.lastUpdated > latest ? source.lastUpdated : latest;
        }, new Date(0))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 清理重复数据
router.post('/cleanup-duplicates', async (req, res) => {
  try {
    const duplicates = await Project.aggregate([
      {
        $group: {
          _id: { name: '$name', dataSource: '$dataSource' },
          count: { $sum: 1 },
          docs: { $push: '$_id' }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);
    
    let removedCount = 0;
    
    for (const duplicate of duplicates) {
      // 保留第一个，删除其余的
      const toRemove = duplicate.docs.slice(1);
      await Project.deleteMany({ _id: { $in: toRemove } });
      removedCount += toRemove.length;
    }
    
    res.json({
      success: true,
      message: `已清理 ${removedCount} 个重复项目`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取定时任务状态
router.get('/scheduler/status', async (req, res) => {
  try {
    const scheduler = require('../config/scheduler');
    const tasks = scheduler.getTasksStatus();
    
    res.json({
      success: true,
      data: {
        enabled: scheduler.isEnabled,
        tasks
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 手动执行定时任务
router.post('/scheduler/execute/:taskName', async (req, res) => {
  try {
    const { taskName } = req.params;
    const scheduler = require('../config/scheduler');
    
    // 异步执行任务
    scheduler.executeTask(taskName).catch(error => {
      console.error(`手动执行任务 ${taskName} 失败:`, error);
    });
    
    res.json({
      success: true,
      message: `任务 ${taskName} 已开始执行`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 启动/停止定时任务
router.post('/scheduler/:action/:taskName', async (req, res) => {
  try {
    const { action, taskName } = req.params;
    const scheduler = require('../config/scheduler');
    
    if (action === 'start') {
      scheduler.startTask(taskName);
    } else if (action === 'stop') {
      scheduler.stopTask(taskName);
    } else {
      return res.status(400).json({
        success: false,
        error: '无效的操作，只支持 start 或 stop'
      });
    }
    
    res.json({
      success: true,
      message: `任务 ${taskName} 已${action === 'start' ? '启动' : '停止'}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 添加示例数据
router.post('/add-sample-data', async (req, res) => {
  try {
    const sampleProjects = [
      {
        name: 'ChatGPT',
        description: 'OpenAI开发的大型语言模型，能够进行自然语言对话和文本生成',
        category: '大模型',
        website: 'https://chat.openai.com',
        hotScore: 95,
        githubStars: 0,
        tags: ['LLM', 'OpenAI', 'Chat', 'AI对话'],
        aiTechnologies: ['GPT', 'Transformer', 'LLM'],
        dataSource: 'Manual',
        isHot: true,
        lastUpdated: new Date()
      },
      {
        name: 'Midjourney',
        description: 'AI图像生成工具，通过文本描述生成高质量艺术作品',
        category: 'AI内容',
        website: 'https://midjourney.com',
        hotScore: 88,
        tags: ['图像生成', 'AI艺术', 'Text-to-Image'],
        aiTechnologies: ['Diffusion Model', 'Image Generation'],
        dataSource: 'Manual',
        isHot: true,
        lastUpdated: new Date()
      },
      {
        name: 'LangChain',
        description: '用于构建LLM应用的开发框架，简化AI应用开发流程',
        category: 'AI框架',
        website: 'https://langchain.com',
        github: 'https://github.com/langchain-ai/langchain',
        hotScore: 82,
        githubStars: 45000,
        tags: ['Framework', 'LLM', 'Python', 'AI开发'],
        aiTechnologies: ['LLM', 'RAG', 'Agent'],
        dataSource: 'Manual',
        isHot: true,
        lastUpdated: new Date()
      },
      {
        name: 'Ollama',
        description: '本地运行大型语言模型的工具，支持多种开源模型',
        category: '本地AI',
        website: 'https://ollama.ai',
        github: 'https://github.com/ollama/ollama',
        hotScore: 65,
        githubStars: 25000,
        tags: ['本地部署', 'LLM', '开源', '隐私保护'],
        aiTechnologies: ['LLM', 'Local Deployment'],
        dataSource: 'Manual',
        isNiche: true,
        lastUpdated: new Date()
      },
      {
        name: 'AutoGPT',
        description: '自主AI代理，能够自动执行复杂任务和决策',
        category: 'AI Agent',
        website: 'https://agpt.co',
        github: 'https://github.com/Significant-Gravitas/AutoGPT',
        hotScore: 78,
        githubStars: 155000,
        tags: ['AI Agent', '自动化', 'GPT', '任务执行'],
        aiTechnologies: ['Agent', 'GPT', 'Autonomous AI'],
        dataSource: 'Manual',
        isEmerging: true,
        lastUpdated: new Date()
      }
    ];
    
    for (const projectData of sampleProjects) {
      const existingProject = await Project.findOne({ 
        name: projectData.name,
        dataSource: projectData.dataSource 
      });
      
      if (!existingProject) {
        const project = new Project(projectData);
        await project.save();
      }
    }
    
    res.json({
      success: true,
      message: `已添加 ${sampleProjects.length} 个示例项目`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
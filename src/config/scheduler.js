const cron = require('node-cron');
const dataCollector = require('../services/dataCollector');
const youtubeCollector = require('../services/youtubeCollector');

class SchedulerConfig {
  constructor() {
    this.tasks = new Map();
    this.isEnabled = process.env.ENABLE_SCHEDULER !== 'false';
    
    // 默认配置
    this.config = {
      // 全量数据采集 - 每6小时
      fullCollection: {
        schedule: process.env.FULL_COLLECTION_SCHEDULE || '0 */6 * * *',
        enabled: process.env.ENABLE_FULL_COLLECTION !== 'false',
        description: '全量数据采集（所有数据源）'
      },
      
      // YouTube专项采集 - 每2小时
      youtubeCollection: {
        schedule: process.env.YOUTUBE_COLLECTION_SCHEDULE || '0 */2 * * *',
        enabled: process.env.ENABLE_YOUTUBE_COLLECTION !== 'false',
        description: 'YouTube数据专项采集'
      },
      
      // 热度分数更新 - 每小时
      scoreUpdate: {
        schedule: process.env.SCORE_UPDATE_SCHEDULE || '0 * * * *',
        enabled: process.env.ENABLE_SCORE_UPDATE !== 'false',
        description: '更新项目热度分数'
      },
      
      // 数据清理 - 每天凌晨3点
      dataCleanup: {
        schedule: process.env.DATA_CLEANUP_SCHEDULE || '0 3 * * *',
        enabled: process.env.ENABLE_DATA_CLEANUP !== 'false',
        description: '清理过期和重复数据'
      }
    };
  }

  // 初始化所有定时任务
  initializeScheduler() {
    if (!this.isEnabled) {
      console.log('⏸️  定时任务已禁用');
      return;
    }

    console.log('⏰ 初始化定时任务调度器...');
    
    // 全量数据采集
    if (this.config.fullCollection.enabled) {
      this.scheduleTask('fullCollection', 
        this.config.fullCollection.schedule,
        this.runFullCollection.bind(this),
        this.config.fullCollection.description
      );
    }

    // YouTube专项采集
    if (this.config.youtubeCollection.enabled) {
      this.scheduleTask('youtubeCollection',
        this.config.youtubeCollection.schedule,
        this.runYouTubeCollection.bind(this),
        this.config.youtubeCollection.description
      );
    }

    // 热度分数更新
    if (this.config.scoreUpdate.enabled) {
      this.scheduleTask('scoreUpdate',
        this.config.scoreUpdate.schedule,
        this.runScoreUpdate.bind(this),
        this.config.scoreUpdate.description
      );
    }

    // 数据清理
    if (this.config.dataCleanup.enabled) {
      this.scheduleTask('dataCleanup',
        this.config.dataCleanup.schedule,
        this.runDataCleanup.bind(this),
        this.config.dataCleanup.description
      );
    }

    this.logSchedulerStatus();
  }

  // 调度单个任务
  scheduleTask(name, schedule, handler, description) {
    try {
      const task = cron.schedule(schedule, async () => {
        console.log(`🚀 开始执行定时任务: ${description}`);
        const startTime = Date.now();
        
        try {
          await handler();
          const duration = Date.now() - startTime;
          console.log(`✅ 任务完成: ${description} (耗时: ${duration}ms)`);
        } catch (error) {
          console.error(`❌ 任务失败: ${description}`, error.message);
        }
      }, {
        scheduled: true,
        timezone: process.env.TIMEZONE || 'Asia/Shanghai'
      });

      this.tasks.set(name, {
        task,
        schedule,
        description,
        enabled: true
      });

      console.log(`📅 已调度任务: ${description} (${schedule})`);
    } catch (error) {
      console.error(`❌ 调度任务失败: ${description}`, error.message);
    }
  }

  // 全量数据采集
  async runFullCollection() {
    await dataCollector.runCollection();
  }

  // YouTube专项采集
  async runYouTubeCollection() {
    if (!process.env.YOUTUBE_API_KEY) {
      console.log('⚠️  YouTube API密钥未配置，跳过YouTube采集');
      return;
    }
    await youtubeCollector.collectYouTubeData();
  }

  // 热度分数更新
  async runScoreUpdate() {
    const Project = require('../models/Project');
    const { calculateHotScore } = require('../services/hotScoreAlgorithm');
    
    console.log('🔄 开始更新热度分数...');
    
    try {
      const projects = await Project.find({});
      let updatedCount = 0;
      
      for (const project of projects) {
        const newHotScore = calculateHotScore({
          githubStars: project.githubStars || 0,
          githubForks: project.githubForks || 0,
          twitterFollowers: project.twitterFollowers || 0,
          lastUpdated: project.lastUpdated,
          category: project.category,
          viewCount: project.youtubeData?.viewCount || 0,
          votesCount: project.votesCount || 0
        });
        
        if (Math.abs(project.hotScore - newHotScore) > 1) {
          project.hotScore = newHotScore;
          project.isHot = newHotScore > 70;
          project.isNiche = newHotScore < 40 && newHotScore > 15;
          await project.save();
          updatedCount++;
        }
      }
      
      console.log(`✅ 已更新 ${updatedCount} 个项目的热度分数`);
    } catch (error) {
      console.error('❌ 更新热度分数失败:', error.message);
    }
  }

  // 数据清理
  async runDataCleanup() {
    const Project = require('../models/Project');
    
    console.log('🧹 开始数据清理...');
    
    try {
      // 清理重复项目
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
        const toRemove = duplicate.docs.slice(1);
        await Project.deleteMany({ _id: { $in: toRemove } });
        removedCount += toRemove.length;
      }
      
      // 清理过期数据（超过1年未更新的项目）
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      const expiredResult = await Project.deleteMany({
        lastUpdated: { $lt: oneYearAgo },
        hotScore: { $lt: 10 } // 只删除低热度的过期项目
      });
      
      console.log(`✅ 数据清理完成: 删除 ${removedCount} 个重复项目, ${expiredResult.deletedCount} 个过期项目`);
    } catch (error) {
      console.error('❌ 数据清理失败:', error.message);
    }
  }

  // 启动任务
  startTask(taskName) {
    const taskInfo = this.tasks.get(taskName);
    if (taskInfo) {
      taskInfo.task.start();
      taskInfo.enabled = true;
      console.log(`▶️  已启动任务: ${taskInfo.description}`);
    }
  }

  // 停止任务
  stopTask(taskName) {
    const taskInfo = this.tasks.get(taskName);
    if (taskInfo) {
      taskInfo.task.stop();
      taskInfo.enabled = false;
      console.log(`⏸️  已停止任务: ${taskInfo.description}`);
    }
  }

  // 停止所有任务
  stopAllTasks() {
    this.tasks.forEach((taskInfo, name) => {
      this.stopTask(name);
    });
    console.log('⏹️  已停止所有定时任务');
  }

  // 获取任务状态
  getTasksStatus() {
    const status = [];
    this.tasks.forEach((taskInfo, name) => {
      status.push({
        name,
        description: taskInfo.description,
        schedule: taskInfo.schedule,
        enabled: taskInfo.enabled,
        running: taskInfo.task.running
      });
    });
    return status;
  }

  // 记录调度器状态
  logSchedulerStatus() {
    console.log('\n📋 定时任务调度器状态:');
    this.tasks.forEach((taskInfo, name) => {
      const status = taskInfo.enabled ? '✅ 启用' : '❌ 禁用';
      console.log(`  ${status} ${taskInfo.description} (${taskInfo.schedule})`);
    });
    console.log('');
  }

  // 手动执行任务
  async executeTask(taskName) {
    const taskInfo = this.tasks.get(taskName);
    if (!taskInfo) {
      throw new Error(`任务不存在: ${taskName}`);
    }

    console.log(`🔧 手动执行任务: ${taskInfo.description}`);
    
    switch (taskName) {
      case 'fullCollection':
        await this.runFullCollection();
        break;
      case 'youtubeCollection':
        await this.runYouTubeCollection();
        break;
      case 'scoreUpdate':
        await this.runScoreUpdate();
        break;
      case 'dataCleanup':
        await this.runDataCleanup();
        break;
      default:
        throw new Error(`未知任务: ${taskName}`);
    }
  }
}

module.exports = new SchedulerConfig();
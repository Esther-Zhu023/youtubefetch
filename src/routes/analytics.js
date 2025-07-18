const express = require('express');
const router = express.Router();
const Project = require('../models/Project');

// 获取总体统计数据
router.get('/overview', async (req, res) => {
  try {
    const totalProjects = await Project.countDocuments();
    const hotProjects = await Project.countDocuments({ isHot: true });
    const nicheProjects = await Project.countDocuments({ isNiche: true });
    const emergingProjects = await Project.countDocuments({ isEmerging: true });
    
    // 分类分布
    const categoryStats = await Project.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgHotScore: { $avg: '$hotScore' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // 热度分布
    const hotScoreDistribution = await Project.aggregate([
      {
        $bucket: {
          groupBy: '$hotScore',
          boundaries: [0, 20, 40, 60, 80, 100],
          default: 'other',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        overview: {
          totalProjects,
          hotProjects,
          nicheProjects,
          emergingProjects
        },
        categoryStats,
        hotScoreDistribution
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取趋势数据
router.get('/trends', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let dateFilter = new Date();
    switch (period) {
      case '7d':
        dateFilter.setDate(dateFilter.getDate() - 7);
        break;
      case '30d':
        dateFilter.setDate(dateFilter.getDate() - 30);
        break;
      case '90d':
        dateFilter.setDate(dateFilter.getDate() - 90);
        break;
      default:
        dateFilter.setDate(dateFilter.getDate() - 30);
    }
    
    // 按日期聚合项目数量
    const trendData = await Project.aggregate([
      {
        $match: {
          lastUpdated: { $gte: dateFilter }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$lastUpdated'
            }
          },
          count: { $sum: 1 },
          avgHotScore: { $avg: '$hotScore' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      success: true,
      data: trendData
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取技术栈统计
router.get('/tech-stack', async (req, res) => {
  try {
    const techStats = await Project.aggregate([
      { $unwind: '$aiTechnologies' },
      {
        $group: {
          _id: '$aiTechnologies',
          count: { $sum: 1 },
          avgHotScore: { $avg: '$hotScore' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);
    
    res.json({
      success: true,
      data: techStats
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取竞争分析数据
router.get('/competition/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    const projects = await Project.find({ category })
      .sort({ hotScore: -1 })
      .limit(20);
    
    // 计算竞争指标
    const competition = {
      totalProjects: projects.length,
      avgHotScore: projects.reduce((sum, p) => sum + p.hotScore, 0) / projects.length,
      topProjects: projects.slice(0, 5),
      marketConcentration: this.calculateMarketConcentration(projects)
    };
    
    res.json({
      success: true,
      data: competition
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 计算市场集中度
function calculateMarketConcentration(projects) {
  const totalScore = projects.reduce((sum, p) => sum + p.hotScore, 0);
  const top5Score = projects.slice(0, 5).reduce((sum, p) => sum + p.hotScore, 0);
  
  return totalScore > 0 ? (top5Score / totalScore) * 100 : 0;
}

module.exports = router;
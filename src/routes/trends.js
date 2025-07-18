const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const nlpAnalyzer = require('../services/nlpAnalyzer');

// 获取热门趋势
router.get('/hot', async (req, res) => {
  try {
    const { category, limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    let query = { isHot: true };
    if (category && category !== 'all') {
      query.category = category;
    }
    
    const projects = await Project.find(query)
      .sort({ hotScore: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Project.countDocuments(query);
    
    res.json({
      success: true,
      data: projects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取小众创新项目
router.get('/niche', async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    const projects = await Project.find({ 
      $or: [
        { isNiche: true },
        { isEmerging: true }
      ]
    })
    .sort({ innovationScore: -1, hotScore: -1 })
    .skip(skip)
    .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取新兴技术趋势
router.get('/emerging', async (req, res) => {
  try {
    const projects = await Project.find({ isEmerging: true })
      .sort({ trendScore: -1 })
      .limit(50);
    
    // 统计技术关键词频率
    const techFrequency = {};
    projects.forEach(project => {
      (project.aiTechnologies || []).forEach(tech => {
        techFrequency[tech] = (techFrequency[tech] || 0) + 1;
      });
    });
    
    const trendingTech = Object.entries(techFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tech, count]) => ({ tech, count }));
    
    res.json({
      success: true,
      data: {
        projects: projects.slice(0, 20),
        trendingTechnologies: trendingTech
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 搜索项目
router.get('/search', async (req, res) => {
  try {
    const { q, category, sortBy = 'hotScore' } = req.query;
    
    let query = {};
    
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    const projects = await Project.find(query)
      .sort({ [sortBy]: -1 })
      .limit(50);
    
    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取项目详情
router.get('/project/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: '项目未找到' });
    }
    
    // 获取相似项目
    const allProjects = await Project.find({}).limit(100);
    const similarProjects = nlpAnalyzer.findSimilarProjects(project, allProjects);
    
    res.json({
      success: true,
      data: {
        project,
        similarProjects: similarProjects.map(s => s.project)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取分类统计
router.get('/categories', async (req, res) => {
  try {
    const categories = await Project.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgHotScore: { $avg: '$hotScore' },
          hotProjects: {
            $sum: { $cond: [{ $eq: ['$isHot', true] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
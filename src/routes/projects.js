const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { calculateInnovationScore } = require('../services/hotScoreAlgorithm');

// 获取所有项目
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      sortBy = 'hotScore',
      order = 'desc'
    } = req.query;
    
    const skip = (page - 1) * limit;
    let query = {};
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    const sortOrder = order === 'desc' ? -1 : 1;
    const projects = await Project.find(query)
      .sort({ [sortBy]: sortOrder })
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

// 创建新项目
router.post('/', async (req, res) => {
  try {
    const projectData = req.body;
    
    // 计算创新度分数
    projectData.innovationScore = calculateInnovationScore(projectData);
    
    const project = new Project(projectData);
    await project.save();
    
    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// 更新项目
router.put('/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastUpdated: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!project) {
      return res.status(404).json({ success: false, error: '项目未找到' });
    }
    
    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// 删除项目
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    
    if (!project) {
      return res.status(404).json({ success: false, error: '项目未找到' });
    }
    
    res.json({
      success: true,
      message: '项目已删除'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 批量更新项目分数
router.post('/batch-update-scores', async (req, res) => {
  try {
    const projects = await Project.find({});
    let updated = 0;
    
    for (const project of projects) {
      const innovationScore = calculateInnovationScore(project);
      
      if (project.innovationScore !== innovationScore) {
        project.innovationScore = innovationScore;
        await project.save();
        updated++;
      }
    }
    
    res.json({
      success: true,
      message: `已更新 ${updated} 个项目的分数`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
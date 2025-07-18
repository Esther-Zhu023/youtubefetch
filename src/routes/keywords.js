const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const nlpAnalyzer = require('../services/nlpAnalyzer');

// 获取热门关键词
router.get('/trending', async (req, res) => {
  try {
    const projects = await Project.find({ isHot: true }).limit(100);
    
    // 提取所有项目的关键词
    const allKeywords = [];
    projects.forEach(project => {
      const keywords = nlpAnalyzer.extractKeywords(
        `${project.name} ${project.description}`, 5
      );
      allKeywords.push(...keywords);
    });
    
    // 统计关键词频率
    const keywordFreq = {};
    allKeywords.forEach(keyword => {
      keywordFreq[keyword] = (keywordFreq[keyword] || 0) + 1;
    });
    
    // 排序并返回前20个
    const trendingKeywords = Object.entries(keywordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([keyword, count]) => ({ keyword, count }));
    
    res.json({
      success: true,
      data: trendingKeywords
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取新兴技术关键词
router.get('/emerging-tech', async (req, res) => {
  try {
    const projects = await Project.find({ isEmerging: true });
    
    const techCount = {};
    projects.forEach(project => {
      (project.aiTechnologies || []).forEach(tech => {
        techCount[tech] = (techCount[tech] || 0) + 1;
      });
    });
    
    const emergingTech = Object.entries(techCount)
      .sort(([,a], [,b]) => b - a)
      .map(([tech, count]) => ({ tech, count }));
    
    res.json({
      success: true,
      data: emergingTech
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 分析文本关键词
router.post('/analyze', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        success: false, 
        error: '请提供要分析的文本' 
      });
    }
    
    const keywords = nlpAnalyzer.extractKeywords(text);
    const aiTech = nlpAnalyzer.detectAITechnologies(text);
    const sentiment = nlpAnalyzer.analyzeSentiment(text);
    const category = nlpAnalyzer.classifyProject(text);
    
    res.json({
      success: true,
      data: {
        keywords,
        aiTechnologies: aiTech,
        sentiment,
        category
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 关键词搜索建议
router.get('/suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }
    
    // 从项目标签中搜索匹配的关键词
    const projects = await Project.find({
      tags: { $regex: q, $options: 'i' }
    }).limit(20);
    
    const suggestions = new Set();
    projects.forEach(project => {
      project.tags.forEach(tag => {
        if (tag.toLowerCase().includes(q.toLowerCase())) {
          suggestions.add(tag);
        }
      });
    });
    
    res.json({
      success: true,
      data: Array.from(suggestions).slice(0, 10)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
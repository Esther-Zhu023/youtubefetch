/**
 * 热度评分算法
 * 综合多维度指标计算项目热度分数 (0-100)
 */

function calculateHotScore(metrics) {
  const {
    githubStars = 0,
    githubForks = 0,
    twitterFollowers = 0,
    lastUpdated,
    category,
    votesCount = 0,
    commentsCount = 0,
    viewCount = 0
  } = metrics;

  // 1. GitHub活跃度评分 (0-30分)
  const githubScore = Math.min(30, 
    Math.log10(githubStars + 1) * 3 + Math.log10(githubForks + 1) * 2
  );

  // 2. 社交媒体影响力评分 (0-20分)
  const socialScore = Math.min(20, 
    Math.log10(twitterFollowers + 1) * 2 + 
    Math.log10(votesCount + 1) * 1.5 +
    Math.log10(commentsCount + 1) * 1
  );

  // 3. 时间衰减因子 (0-25分)
  const timeScore = calculateTimeScore(lastUpdated);

  // 4. 分类权重调整 (0-15分)
  const categoryScore = getCategoryWeight(category);

  // 5. 用户互动评分 (0-10分)
  const interactionScore = Math.min(10, 
    Math.log10(viewCount + 1) * 1.5
  );

  const totalScore = githubScore + socialScore + timeScore + categoryScore + interactionScore;
  
  return Math.min(100, Math.max(0, Math.round(totalScore)));
}

function calculateTimeScore(lastUpdated) {
  if (!lastUpdated) return 5;
  
  const now = new Date();
  const diffDays = (now - new Date(lastUpdated)) / (1000 * 60 * 60 * 24);
  
  if (diffDays <= 7) return 25;      // 一周内
  if (diffDays <= 30) return 20;     // 一月内
  if (diffDays <= 90) return 15;     // 三月内
  if (diffDays <= 180) return 10;    // 半年内
  if (diffDays <= 365) return 5;     // 一年内
  return 0;                          // 超过一年
}

function getCategoryWeight(category) {
  const weights = {
    '大模型': 15,
    'AI Agent': 14,
    'AI搜索': 13,
    'AI编程': 12,
    'AI内容': 11,
    'AI办公': 10,
    '其他': 8
  };
  
  return weights[category] || 8;
}

// 计算趋势分数 - 基于增长率
function calculateTrendScore(currentMetrics, previousMetrics) {
  if (!previousMetrics) return 50;
  
  const starGrowth = calculateGrowthRate(currentMetrics.githubStars, previousMetrics.githubStars);
  const forkGrowth = calculateGrowthRate(currentMetrics.githubForks, previousMetrics.githubForks);
  const socialGrowth = calculateGrowthRate(currentMetrics.twitterFollowers, previousMetrics.twitterFollowers);
  
  const avgGrowth = (starGrowth + forkGrowth + socialGrowth) / 3;
  
  return Math.min(100, Math.max(0, 50 + avgGrowth * 10));
}

function calculateGrowthRate(current, previous) {
  if (previous === 0) return current > 0 ? 5 : 0;
  return ((current - previous) / previous) * 100;
}

// 创新度评分算法
function calculateInnovationScore(project) {
  let score = 50; // 基础分
  
  // 技术栈新颖性
  const emergingTech = ['RAG', 'Agent', 'MCP', 'AutoGPT', 'GraphRAG', 'LangChain'];
  const techCount = project.aiTechnologies?.filter(tech => 
    emergingTech.includes(tech)
  ).length || 0;
  
  score += techCount * 5;
  
  // 小众领域加分
  if (project.isNiche) score += 10;
  
  // 垂直行业应用加分
  const verticalKeywords = ['医疗', '法律', '教育', '工业', '金融'];
  const hasVertical = verticalKeywords.some(keyword => 
    project.description?.includes(keyword)
  );
  if (hasVertical) score += 15;
  
  return Math.min(100, Math.max(0, score));
}

module.exports = {
  calculateHotScore,
  calculateTrendScore,
  calculateInnovationScore
};
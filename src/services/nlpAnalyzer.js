const natural = require('natural');
const sentiment = require('sentiment');

class NLPAnalyzer {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    this.sentiment = new sentiment();
    
    // AI领域关键词词典
    this.aiKeywords = [
      'artificial intelligence', 'machine learning', 'deep learning',
      'neural network', 'transformer', 'gpt', 'llm', 'rag', 'agent',
      'computer vision', 'nlp', 'chatbot', 'automation', 'robotics'
    ];
    
    // 新兴技术关键词
    this.emergingTech = [
      'RAG', 'Agent', 'MCP', 'AutoGPT', 'GraphRAG', 'LangChain',
      'Vector Database', 'Embedding', 'Fine-tuning', 'RLHF',
      'Multimodal', 'Edge AI', 'Federated Learning'
    ];
  }

  // 提取关键词
  extractKeywords(text, maxKeywords = 10) {
    if (!text) return [];
    
    const tokens = this.tokenizer.tokenize(text.toLowerCase());
    const filtered = tokens.filter(token => 
      token.length > 2 && 
      !natural.stopwords.includes(token) &&
      /^[a-zA-Z]+$/.test(token)
    );
    
    // 词频统计
    const frequency = {};
    filtered.forEach(token => {
      const stemmed = this.stemmer.stem(token);
      frequency[stemmed] = (frequency[stemmed] || 0) + 1;
    });
    
    // 按频率排序
    const sorted = Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, maxKeywords)
      .map(([word]) => word);
    
    return sorted;
  }

  // 检测AI技术类型
  detectAITechnologies(text) {
    if (!text) return [];
    
    const detected = [];
    const lowerText = text.toLowerCase();
    
    this.emergingTech.forEach(tech => {
      if (lowerText.includes(tech.toLowerCase())) {
        detected.push(tech);
      }
    });
    
    return detected;
  }

  // 情感分析
  analyzeSentiment(text) {
    if (!text) return { score: 0, comparative: 0, positive: [], negative: [] };
    
    const result = this.sentiment.analyze(text);
    return {
      score: result.score,
      comparative: result.comparative,
      positive: result.positive,
      negative: result.negative,
      label: this.getSentimentLabel(result.comparative)
    };
  }

  getSentimentLabel(comparative) {
    if (comparative > 0.1) return 'positive';
    if (comparative < -0.1) return 'negative';
    return 'neutral';
  }

  // 文本分类
  classifyProject(description, tags = []) {
    const text = (description + ' ' + tags.join(' ')).toLowerCase();
    
    const categories = {
      '大模型': ['llm', 'language model', 'gpt', 'transformer', 'bert'],
      'AI搜索': ['search', 'retrieval', 'rag', 'vector', 'embedding'],
      'AI办公': ['office', 'productivity', 'automation', 'workflow'],
      'AI编程': ['code', 'programming', 'developer', 'copilot'],
      'AI内容': ['content', 'generation', 'creative', 'image', 'video'],
      'AI Agent': ['agent', 'autonomous', 'multi-agent', 'workflow'],
      '计算机视觉': ['vision', 'image', 'detection', 'recognition'],
      '自然语言处理': ['nlp', 'text', 'language', 'translation'],
      '语音技术': ['speech', 'voice', 'audio', 'tts', 'asr']
    };
    
    const scores = {};
    
    for (const [category, keywords] of Object.entries(categories)) {
      scores[category] = keywords.reduce((score, keyword) => {
        return score + (text.includes(keyword) ? 1 : 0);
      }, 0);
    }
    
    // 返回得分最高的分类
    const bestCategory = Object.entries(scores)
      .sort(([,a], [,b]) => b - a)[0];
    
    return bestCategory[1] > 0 ? bestCategory[0] : '其他';
  }

  // 趋势预测
  predictTrend(historicalData) {
    if (!historicalData || historicalData.length < 3) {
      return { trend: 'stable', confidence: 0.5 };
    }
    
    // 简单线性回归预测
    const n = historicalData.length;
    const x = Array.from({length: n}, (_, i) => i);
    const y = historicalData.map(d => d.hotScore);
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    let trend = 'stable';
    if (slope > 2) trend = 'rising';
    else if (slope < -2) trend = 'declining';
    
    const confidence = Math.min(1, Math.abs(slope) / 10);
    
    return { trend, confidence, slope };
  }

  // 相似项目推荐
  findSimilarProjects(targetProject, allProjects, limit = 5) {
    const targetVector = this.createProjectVector(targetProject);
    
    const similarities = allProjects
      .filter(p => p._id.toString() !== targetProject._id.toString())
      .map(project => ({
        project,
        similarity: this.cosineSimilarity(targetVector, this.createProjectVector(project))
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
    
    return similarities;
  }

  createProjectVector(project) {
    const features = [
      project.hotScore || 0,
      project.githubStars || 0,
      project.category === '大模型' ? 1 : 0,
      project.category === 'AI Agent' ? 1 : 0,
      project.isNiche ? 1 : 0,
      project.isEmerging ? 1 : 0,
      (project.aiTechnologies || []).length
    ];
    
    return features;
  }

  cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    
    return magnitudeA && magnitudeB ? dotProduct / (magnitudeA * magnitudeB) : 0;
  }
}

module.exports = new NLPAnalyzer();
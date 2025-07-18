import React, { useState, useEffect } from 'react';
import { 
  Card, Tag, Space, Typography, Row, Col, List, 
  Input, Button, Spin, Statistic 
} from 'antd';
import { 
  TagsOutlined, RocketOutlined, FireOutlined, 
  SearchOutlined, BarChartOutlined 
} from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

const TechKeywords = () => {
  const [loading, setLoading] = useState(true);
  const [trendingKeywords, setTrendingKeywords] = useState([]);
  const [emergingTech, setEmergingTech] = useState([]);
  const [techStats, setTechStats] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchKeywordData();
  }, []);

  const fetchKeywordData = async () => {
    try {
      setLoading(true);
      
      const [trendingRes, emergingRes, statsRes] = await Promise.all([
        axios.get('/api/keywords/trending'),
        axios.get('/api/keywords/emerging-tech'),
        axios.get('/api/analytics/tech-stack')
      ]);

      setTrendingKeywords(trendingRes.data.data);
      setEmergingTech(emergingRes.data.data);
      setTechStats(statsRes.data.data);
      
    } catch (error) {
      console.error('获取关键词数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeText = async (text) => {
    if (!text.trim()) return;
    
    try {
      setAnalyzing(true);
      const response = await axios.post('/api/keywords/analyze', { text });
      setAnalysisResult(response.data.data);
    } catch (error) {
      console.error('文本分析失败:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const getKeywordSize = (count, maxCount) => {
    const ratio = count / maxCount;
    if (ratio > 0.8) return 'large';
    if (ratio > 0.5) return 'default';
    return 'small';
  };

  const getKeywordColor = (count, maxCount) => {
    const ratio = count / maxCount;
    if (ratio > 0.8) return 'red';
    if (ratio > 0.6) return 'orange';
    if (ratio > 0.4) return 'blue';
    if (ratio > 0.2) return 'green';
    return 'default';
  };

  const maxTrendingCount = Math.max(...trendingKeywords.map(k => k.count));
  const maxTechCount = Math.max(...emergingTech.map(t => t.count));

  return (
    <div>
      <Title level={2}>🏷️ 技术关键词追踪</Title>
      <Paragraph>
        实时追踪AI领域的热门关键词和新兴技术趋势，帮助你把握技术发展脉搏。
      </Paragraph>

      {/* 文本分析工具 */}
      <Card title="🔍 AI文本分析工具" style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Search
            placeholder="输入项目描述或技术文档，分析其中的AI技术关键词..."
            allowClear
            enterButton={
              <Button type="primary" icon={<SearchOutlined />} loading={analyzing}>
                分析
              </Button>
            }
            size="large"
            onSearch={handleAnalyzeText}
          />
          
          {analysisResult && (
            <Card size="small" style={{ backgroundColor: '#f6ffed' }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title="识别分类"
                    value={analysisResult.category}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="情感倾向"
                    value={analysisResult.sentiment.label}
                    valueStyle={{ 
                      color: analysisResult.sentiment.label === 'positive' ? '#52c41a' : 
                             analysisResult.sentiment.label === 'negative' ? '#f5222d' : '#666'
                    }}
                  />
                </Col>
                <Col span={12}>
                  <div>
                    <Text strong>AI技术: </Text>
                    <Space wrap>
                      {analysisResult.aiTechnologies.map(tech => (
                        <Tag key={tech} color="blue">{tech}</Tag>
                      ))}
                    </Space>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <Text strong>关键词: </Text>
                    <Space wrap>
                      {analysisResult.keywords.slice(0, 8).map(keyword => (
                        <Tag key={keyword} color="default">{keyword}</Tag>
                      ))}
                    </Space>
                  </div>
                </Col>
              </Row>
            </Card>
          )}
        </Space>
      </Card>

      <Row gutter={16}>
        {/* 热门关键词云 */}
        <Col span={12}>
          <Card 
            title={
              <Space>
                <FireOutlined />
                热门关键词
              </Space>
            }
            loading={loading}
          >
            <div style={{ padding: '16px 0', minHeight: 200 }}>
              <Space wrap>
                {trendingKeywords.map(item => (
                  <Tag
                    key={item.keyword}
                    color={getKeywordColor(item.count, maxTrendingCount)}
                    style={{ 
                      margin: '4px',
                      padding: '4px 8px',
                      fontSize: getKeywordSize(item.count, maxTrendingCount) === 'large' ? '16px' : 
                               getKeywordSize(item.count, maxTrendingCount) === 'default' ? '14px' : '12px'
                    }}
                  >
                    {item.keyword} ({item.count})
                  </Tag>
                ))}
              </Space>
            </div>
          </Card>
        </Col>

        {/* 新兴技术 */}
        <Col span={12}>
          <Card 
            title={
              <Space>
                <RocketOutlined />
                新兴技术趋势
              </Space>
            }
            loading={loading}
          >
            <div style={{ padding: '16px 0', minHeight: 200 }}>
              <Space wrap>
                {emergingTech.slice(0, 15).map((item, index) => (
                  <Tag
                    key={item.tech}
                    color={index < 3 ? 'red' : index < 6 ? 'orange' : index < 9 ? 'blue' : 'green'}
                    style={{ 
                      margin: '4px',
                      padding: '6px 10px',
                      fontSize: index < 3 ? '16px' : '14px',
                      fontWeight: index < 3 ? 'bold' : 'normal'
                    }}
                  >
                    {item.tech} ({item.count})
                  </Tag>
                ))}
              </Space>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 技术栈统计图表 */}
      <Card 
        title={
          <Space>
            <BarChartOutlined />
            技术栈使用统计
          </Space>
        }
        style={{ marginTop: 24 }}
        loading={loading}
      >
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={techStats.slice(0, 15)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="_id" 
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [value, '项目数量']}
              labelFormatter={(label) => `技术: ${label}`}
            />
            <Bar dataKey="count" fill="#1890ff" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* 技术详细列表 */}
      <Card 
        title="📋 技术详细统计"
        style={{ marginTop: 24 }}
        loading={loading}
      >
        <List
          dataSource={techStats}
          renderItem={(item, index) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <div style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: '50%',
                    backgroundColor: index < 5 ? '#f5222d' : index < 10 ? '#fa8c16' : '#1890ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold'
                  }}>
                    #{index + 1}
                  </div>
                }
                title={
                  <Space>
                    <Text strong style={{ fontSize: '16px' }}>
                      {item._id}
                    </Text>
                    <Tag color="blue">{item.count} 个项目</Tag>
                  </Space>
                }
                description={
                  <Space>
                    <Text>平均热度: {Math.round(item.avgHotScore)}/100</Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default TechKeywords;
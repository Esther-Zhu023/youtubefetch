import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, List, Tag, Space, Typography, Spin } from 'antd';
import { FireOutlined, BulbOutlined, RocketOutlined, TrophyOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';

const { Title, Text } = Typography;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({});
  const [hotProjects, setHotProjects] = useState([]);
  const [nicheProjects, setNicheProjects] = useState([]);
  const [trendingTech, setTrendingTech] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 并行获取数据
      const [overviewRes, hotRes, nicheRes, techRes] = await Promise.all([
        axios.get('/api/analytics/overview'),
        axios.get('/api/trends/hot?limit=5'),
        axios.get('/api/trends/niche?limit=5'),
        axios.get('/api/keywords/emerging-tech')
      ]);

      setOverview(overviewRes.data.data.overview);
      setCategoryStats(overviewRes.data.data.categoryStats);
      setHotProjects(hotRes.data.data);
      setNicheProjects(nicheRes.data.data);
      setTrendingTech(techRes.data.data.slice(0, 8));
      
    } catch (error) {
      console.error('获取仪表板数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Title level={2}>AI趋势发现 - 总览仪表板</Title>
      
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总项目数"
              value={overview.totalProjects}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="热门项目"
              value={overview.hotProjects}
              prefix={<FireOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="小众创新"
              value={overview.nicheProjects}
              prefix={<BulbOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="新兴项目"
              value={overview.emergingProjects}
              prefix={<RocketOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        {/* 热门项目列表 */}
        <Col span={12}>
          <Card title="🔥 热门项目" extra={<a href="/hot-trends">查看更多</a>}>
            <List
              dataSource={hotProjects}
              renderItem={(item, index) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<span style={{ fontSize: '18px' }}>#{index + 1}</span>}
                    title={
                      <Space>
                        <a href={`/project/${item._id}`}>{item.name}</a>
                        <Tag color="red">{item.hotScore}分</Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <Text ellipsis style={{ width: 300 }}>
                          {item.description}
                        </Text>
                        <div style={{ marginTop: 4 }}>
                          <Tag color="blue">{item.category}</Tag>
                          {item.tags?.slice(0, 2).map(tag => (
                            <Tag key={tag} size="small">{tag}</Tag>
                          ))}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 小众创新项目 */}
        <Col span={12}>
          <Card title="💡 小众创新" extra={<a href="/niche-projects">查看更多</a>}>
            <List
              dataSource={nicheProjects}
              renderItem={(item, index) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<span style={{ fontSize: '18px' }}>#{index + 1}</span>}
                    title={
                      <Space>
                        <a href={`/project/${item._id}`}>{item.name}</a>
                        <Tag color="green">{item.innovationScore}分</Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <Text ellipsis style={{ width: 300 }}>
                          {item.description}
                        </Text>
                        <div style={{ marginTop: 4 }}>
                          <Tag color="purple">{item.category}</Tag>
                          {item.isEmerging && <Tag color="orange">新兴</Tag>}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        {/* 分类分布图 */}
        <Col span={12}>
          <Card title="📊 项目分类分布">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {categoryStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* 新兴技术关键词 */}
        <Col span={12}>
          <Card title="🚀 新兴技术关键词" extra={<a href="/tech-keywords">查看更多</a>}>
            <div style={{ padding: '16px 0' }}>
              {trendingTech.map((tech, index) => (
                <Tag
                  key={tech.tech}
                  color={index < 3 ? 'red' : index < 6 ? 'orange' : 'blue'}
                  style={{ 
                    margin: '4px',
                    padding: '4px 8px',
                    fontSize: '14px'
                  }}
                >
                  {tech.tech} ({tech.count})
                </Tag>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
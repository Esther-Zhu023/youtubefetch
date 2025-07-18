import React, { useState, useEffect } from 'react';
import { 
  Card, List, Tag, Space, Select, Input, Button, Row, Col, 
  Statistic, Typography, Avatar, Pagination, Spin 
} from 'antd';
import { 
  FireOutlined, StarOutlined, ForkOutlined, EyeOutlined,
  GithubOutlined, LinkOutlined, SearchOutlined 
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

const HotTrends = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    category: 'all',
    search: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchHotProjects();
    fetchCategories();
  }, [filters]);

  const fetchHotProjects = async () => {
    try {
      setLoading(true);
      const params = {
        category: filters.category,
        page: filters.page,
        limit: filters.limit
      };
      
      if (filters.search) {
        const response = await axios.get('/api/trends/search', {
          params: { q: filters.search, ...params }
        });
        setProjects(response.data.data);
        setPagination({});
      } else {
        const response = await axios.get('/api/trends/hot', { params });
        setProjects(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('获取热门项目失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/trends/categories');
      setCategories(response.data.data);
    } catch (error) {
      console.error('获取分类失败:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // 重置页码
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const getHotScoreColor = (score) => {
    if (score >= 80) return '#f5222d';
    if (score >= 60) return '#fa8c16';
    if (score >= 40) return '#fadb14';
    return '#52c41a';
  };

  return (
    <div>
      <Title level={2}>🔥 热门趋势</Title>
      <Paragraph>
        实时追踪AI领域最热门的项目和技术趋势，基于GitHub星标、社交媒体影响力等多维度指标评估。
      </Paragraph>

      {/* 筛选器 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Search
              placeholder="搜索项目名称或描述..."
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={(value) => handleFilterChange('search', value)}
            />
          </Col>
          <Col span={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="选择分类"
              value={filters.category}
              onChange={(value) => handleFilterChange('category', value)}
            >
              <Option value="all">全部分类</Option>
              {categories.map(cat => (
                <Option key={cat._id} value={cat._id}>
                  {cat._id} ({cat.count})
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              style={{ width: '100%' }}
              value={filters.limit}
              onChange={(value) => handleFilterChange('limit', value)}
            >
              <Option value={10}>每页 10 条</Option>
              <Option value={20}>每页 20 条</Option>
              <Option value={50}>每页 50 条</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* 项目列表 */}
      <Card>
        <Spin spinning={loading}>
          <List
            dataSource={projects}
            renderItem={(project, index) => (
              <List.Item
                key={project._id}
                actions={[
                  <Space key="stats">
                    <Statistic
                      title="热度"
                      value={project.hotScore}
                      suffix="/100"
                      valueStyle={{ 
                        color: getHotScoreColor(project.hotScore),
                        fontSize: '16px'
                      }}
                    />
                  </Space>,
                  <Space key="links">
                    {project.github && (
                      <Button 
                        type="link" 
                        icon={<GithubOutlined />}
                        href={project.github}
                        target="_blank"
                      >
                        GitHub
                      </Button>
                    )}
                    {project.website && (
                      <Button 
                        type="link" 
                        icon={<LinkOutlined />}
                        href={project.website}
                        target="_blank"
                      >
                        官网
                      </Button>
                    )}
                  </Space>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      size={48}
                      style={{ 
                        backgroundColor: getHotScoreColor(project.hotScore),
                        fontSize: '18px',
                        fontWeight: 'bold'
                      }}
                    >
                      #{(filters.page - 1) * filters.limit + index + 1}
                    </Avatar>
                  }
                  title={
                    <Space>
                      <a 
                        href={`/project/${project._id}`}
                        style={{ fontSize: '18px', fontWeight: 'bold' }}
                      >
                        {project.name}
                      </a>
                      <Tag color="red" icon={<FireOutlined />}>
                        热门
                      </Tag>
                      {project.isEmerging && (
                        <Tag color="orange">新兴</Tag>
                      )}
                    </Space>
                  }
                  description={
                    <div>
                      <Paragraph 
                        ellipsis={{ rows: 2, expandable: true }}
                        style={{ marginBottom: 12 }}
                      >
                        {project.description}
                      </Paragraph>
                      
                      <Space wrap>
                        <Tag color="blue">{project.category}</Tag>
                        {project.tags?.slice(0, 3).map(tag => (
                          <Tag key={tag} color="default">{tag}</Tag>
                        ))}
                      </Space>
                      
                      <div style={{ marginTop: 8 }}>
                        <Space>
                          {project.githubStars && (
                            <span>
                              <StarOutlined /> {project.githubStars.toLocaleString()}
                            </span>
                          )}
                          {project.githubForks && (
                            <span>
                              <ForkOutlined /> {project.githubForks.toLocaleString()}
                            </span>
                          )}
                          <Text type="secondary">
                            更新于 {new Date(project.lastUpdated).toLocaleDateString()}
                          </Text>
                        </Space>
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
          
          {pagination.total && (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Pagination
                current={pagination.page}
                total={pagination.total}
                pageSize={pagination.limit}
                showSizeChanger={false}
                showQuickJumper
                showTotal={(total, range) => 
                  `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                }
                onChange={handlePageChange}
              />
            </div>
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default HotTrends;
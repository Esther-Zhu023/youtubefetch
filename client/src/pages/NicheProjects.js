import React, { useState, useEffect } from 'react';
import { 
  Card, List, Tag, Space, Typography, Avatar, Button, Row, Col,
  Statistic, Spin, Alert, Tooltip
} from 'antd';
import { 
  BulbOutlined, RocketOutlined, StarOutlined, 
  GithubOutlined, LinkOutlined, TrophyOutlined 
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;

const NicheProjects = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetchNicheProjects();
  }, []);

  const fetchNicheProjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/trends/niche?limit=50');
      setProjects(response.data.data);
    } catch (error) {
      console.error('获取小众项目失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInnovationColor = (score) => {
    if (score >= 80) return '#722ed1';
    if (score >= 60) return '#1890ff';
    if (score >= 40) return '#13c2c2';
    return '#52c41a';
  };

  const getProjectTypeTag = (project) => {
    if (project.isEmerging) {
      return <Tag color="orange" icon={<RocketOutlined />}>新兴项目</Tag>;
    }
    if (project.isNiche) {
      return <Tag color="purple" icon={<BulbOutlined />}>小众创新</Tag>;
    }
    return null;
  };

  return (
    <div>
      <Title level={2}>💡 小众创新发现</Title>
      <Paragraph>
        发现那些尚未被大厂垄断、具备创新潜力的AI项目。这些项目可能是下一个独角兽的起点。
      </Paragraph>

      <Alert
        message="发现策略"
        description="我们通过创新度评分、技术栈新颖性、垂直领域应用等多个维度，筛选出具备差异化优势和发展潜力的AI项目。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="小众项目总数"
              value={projects.filter(p => p.isNiche).length}
              prefix={<BulbOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="新兴项目"
              value={projects.filter(p => p.isEmerging).length}
              prefix={<RocketOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="平均创新度"
              value={Math.round(
                projects.reduce((sum, p) => sum + (p.innovationScore || 0), 0) / projects.length
              )}
              suffix="/100"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 项目列表 */}
      <Card>
        <Spin spinning={loading}>
          <List
            dataSource={projects}
            renderItem={(project, index) => (
              <List.Item
                key={project._id}
                actions={[
                  <Space key="scores" direction="vertical" align="center">
                    <Tooltip title="创新度评分">
                      <Statistic
                        title="创新度"
                        value={project.innovationScore || 0}
                        suffix="/100"
                        valueStyle={{ 
                          color: getInnovationColor(project.innovationScore),
                          fontSize: '14px'
                        }}
                      />
                    </Tooltip>
                    <Tooltip title="热度评分">
                      <Statistic
                        title="热度"
                        value={project.hotScore || 0}
                        suffix="/100"
                        valueStyle={{ 
                          color: '#666',
                          fontSize: '12px'
                        }}
                      />
                    </Tooltip>
                  </Space>,
                  <Space key="links" direction="vertical">
                    {project.github && (
                      <Button 
                        size="small"
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
                        size="small"
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
                        backgroundColor: getInnovationColor(project.innovationScore),
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}
                    >
                      #{index + 1}
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
                      {getProjectTypeTag(project)}
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
                      
                      {/* 分类和标签 */}
                      <Space wrap style={{ marginBottom: 8 }}>
                        <Tag color="blue">{project.category}</Tag>
                        {project.tags?.slice(0, 3).map(tag => (
                          <Tag key={tag} color="default">{tag}</Tag>
                        ))}
                      </Space>
                      
                      {/* AI技术栈 */}
                      {project.aiTechnologies && project.aiTechnologies.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                          <Text strong>技术栈: </Text>
                          <Space wrap>
                            {project.aiTechnologies.slice(0, 4).map(tech => (
                              <Tag key={tech} color="green" size="small">
                                {tech}
                              </Tag>
                            ))}
                            {project.aiTechnologies.length > 4 && (
                              <Tag color="default" size="small">
                                +{project.aiTechnologies.length - 4}
                              </Tag>
                            )}
                          </Space>
                        </div>
                      )}
                      
                      {/* 统计信息 */}
                      <Space>
                        {project.githubStars && (
                          <span>
                            <StarOutlined /> {project.githubStars.toLocaleString()}
                          </span>
                        )}
                        <Text type="secondary">
                          数据源: {project.dataSource}
                        </Text>
                        <Text type="secondary">
                          更新于 {new Date(project.lastUpdated).toLocaleDateString()}
                        </Text>
                      </Space>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default NicheProjects;
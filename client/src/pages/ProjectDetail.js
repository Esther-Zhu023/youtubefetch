import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Descriptions, Tag, Space, Button, Spin, Typography } from 'antd';
import { GithubOutlined, LinkOutlined, StarOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Paragraph } = Typography;

const ProjectDetail = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);

  useEffect(() => {
    fetchProjectDetail();
  }, [id]);

  const fetchProjectDetail = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/trends/project/${id}`);
      setProject(response.data.data.project);
    } catch (error) {
      console.error('获取项目详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!project) {
    return <div>项目未找到</div>;
  }

  return (
    <div>
      <Title level={2}>{project.name}</Title>
      
      <Card>
        <Descriptions title="项目信息" bordered>
          <Descriptions.Item label="描述" span={3}>
            {project.description}
          </Descriptions.Item>
          <Descriptions.Item label="分类">
            <Tag color="blue">{project.category}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="热度评分">
            <Tag color="red">{project.hotScore}/100</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="GitHub Stars">
            <StarOutlined /> {project.githubStars?.toLocaleString() || 'N/A'}
          </Descriptions.Item>
        </Descriptions>
        
        <div style={{ marginTop: 16 }}>
          <Space>
            {project.github && (
              <Button 
                type="primary" 
                icon={<GithubOutlined />}
                href={project.github}
                target="_blank"
              >
                GitHub
              </Button>
            )}
            {project.website && (
              <Button 
                icon={<LinkOutlined />}
                href={project.website}
                target="_blank"
              >
                官网
              </Button>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default ProjectDetail;
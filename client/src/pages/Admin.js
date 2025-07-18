import React, { useState, useEffect } from 'react';
import { 
  Card, Button, Space, Statistic, Row, Col, Table, 
  message, Typography, Tag, Progress, Alert 
} from 'antd';
import { 
  PlayCircleOutlined, YoutubeOutlined, GithubOutlined,
  ReloadOutlined, DeleteOutlined, PlusOutlined, BarChartOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const Admin = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [collecting, setCollecting] = useState(false);
  const [schedulerStatus, setSchedulerStatus] = useState(null);

  useEffect(() => {
    fetchStatus();
    fetchSchedulerStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await axios.get('/api/admin/status');
      setStatus(response.data.data);
    } catch (error) {
      console.error('获取状态失败:', error);
    }
  };

  const fetchSchedulerStatus = async () => {
    try {
      const response = await axios.get('/api/admin/scheduler/status');
      setSchedulerStatus(response.data.data);
    } catch (error) {
      console.error('获取定时任务状态失败:', error);
    }
  };

  const handleCollectAll = async () => {
    try {
      setCollecting(true);
      const response = await axios.post('/api/admin/collect-data');
      message.success(response.data.message);
      
      // 5秒后刷新状态
      setTimeout(() => {
        fetchStatus();
        setCollecting(false);
      }, 5000);
    } catch (error) {
      message.error('数据采集失败: ' + error.message);
      setCollecting(false);
    }
  };

  const handleCollectYouTube = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/admin/collect-youtube');
      message.success(response.data.message);
      
      setTimeout(() => {
        fetchStatus();
        setLoading(false);
      }, 3000);
    } catch (error) {
      message.error('YouTube数据采集失败: ' + error.message);
      setLoading(false);
    }
  };

  const handleAddSampleData = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/admin/add-sample-data');
      message.success(response.data.message);
      fetchStatus();
    } catch (error) {
      message.error('添加示例数据失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupDuplicates = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/admin/cleanup-duplicates');
      message.success(response.data.message);
      fetchStatus();
    } catch (error) {
      message.error('清理重复数据失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteTask = async (taskName) => {
    try {
      setLoading(true);
      const response = await axios.post(`/api/admin/scheduler/execute/${taskName}`);
      message.success(response.data.message);
      fetchSchedulerStatus();
    } catch (error) {
      message.error(`执行任务失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskName, action) => {
    try {
      const response = await axios.post(`/api/admin/scheduler/${action}/${taskName}`);
      message.success(response.data.message);
      fetchSchedulerStatus();
    } catch (error) {
      message.error(`${action === 'start' ? '启动' : '停止'}任务失败: ${error.message}`);
    }
  };

  const dataSourceColumns = [
    {
      title: '数据源',
      dataIndex: '_id',
      key: 'source',
      render: (source) => {
        const icons = {
          'YouTube': <YoutubeOutlined style={{ color: '#ff0000' }} />,
          'GitHub': <GithubOutlined style={{ color: '#333' }} />,
          'Manual': <PlusOutlined style={{ color: '#52c41a' }} />
        };
        return (
          <Space>
            {icons[source] || <BarChartOutlined />}
            {source}
          </Space>
        );
      }
    },
    {
      title: '项目数量',
      dataIndex: 'count',
      key: 'count',
      render: (count) => <Tag color="blue">{count}</Tag>
    },
    {
      title: '平均热度',
      dataIndex: 'avgHotScore',
      key: 'avgHotScore',
      render: (score) => (
        <Space>
          <Progress 
            percent={Math.round(score)} 
            size="small" 
            style={{ width: 100 }}
          />
          <Text>{Math.round(score)}</Text>
        </Space>
      )
    },
    {
      title: '最后更新',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      render: (date) => new Date(date).toLocaleString()
    }
  ];

  return (
    <div>
      <Title level={2}>🔧 系统管理</Title>
      
      {/* 系统状态 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总项目数"
              value={status?.totalProjects || 0}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="数据源数量"
              value={status?.bySource?.length || 0}
              prefix={<ReloadOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="最后采集时间"
              value={status?.lastCollection ? 
                new Date(status.lastCollection).toLocaleString() : 
                '暂无数据'
              }
              prefix={<PlayCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 操作按钮 */}
      <Card title="数据采集操作" style={{ marginBottom: 24 }}>
        <Alert
          message="数据采集说明"
          description="首次使用建议先添加示例数据，然后配置API密钥后进行数据采集。YouTube采集需要配置YOUTUBE_API_KEY。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Space wrap>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddSampleData}
            loading={loading}
          >
            添加示例数据
          </Button>
          
          <Button
            type="primary"
            icon={<YoutubeOutlined />}
            onClick={handleCollectYouTube}
            loading={loading}
            danger
          >
            采集YouTube数据
          </Button>
          
          <Button
            icon={<ReloadOutlined />}
            onClick={handleCollectAll}
            loading={collecting}
          >
            全量数据采集
          </Button>
          
          <Button
            icon={<DeleteOutlined />}
            onClick={handleCleanupDuplicates}
            loading={loading}
          >
            清理重复数据
          </Button>
          
          <Button
            icon={<BarChartOutlined />}
            onClick={fetchStatus}
          >
            刷新状态
          </Button>
        </Space>
      </Card>

      {/* 数据源统计 */}
      <Card title="数据源统计">
        <Table
          dataSource={status?.bySource || []}
          columns={dataSourceColumns}
          rowKey="_id"
          pagination={false}
          size="small"
        />
      </Card>

      {/* API配置提示 */}
      <Card title="API配置" style={{ marginTop: 24 }}>
        <Alert
          message="配置API密钥"
          description={
            <div>
              <p>为了获取更多数据，请在 .env 文件中配置以下API密钥：</p>
              <ul>
                <li><strong>YOUTUBE_API_KEY</strong>: YouTube Data API v3 密钥</li>
                <li><strong>GITHUB_TOKEN</strong>: GitHub Personal Access Token</li>
                <li><strong>PRODUCTHUNT_TOKEN</strong>: Product Hunt API Token</li>
              </ul>
              <p>详细配置说明请查看 YOUTUBE_SETUP.md 和 SETUP.md 文件。</p>
            </div>
          }
          type="warning"
          showIcon
        />
      </Card>
    </div>
  );
};

export default Admin;
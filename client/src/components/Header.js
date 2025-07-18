import React from 'react';
import { Layout, Typography, Space, Input, Button } from 'antd';
import { SearchOutlined, GithubOutlined } from '@ant-design/icons';

const { Header: AntHeader } = Layout;
const { Title } = Typography;
const { Search } = Input;

const Header = () => {
  const handleSearch = (value) => {
    console.log('搜索:', value);
  };

  return (
    <AntHeader style={{ 
      background: '#fff', 
      padding: '0 24px',
      borderBottom: '1px solid #f0f0f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <Space align="center">
        <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
          🤖 AI趋势发现
        </Title>
      </Space>
      
      <Space>
        <Search
          placeholder="搜索AI项目、技术关键词..."
          allowClear
          enterButton={<SearchOutlined />}
          size="middle"
          style={{ width: 300 }}
          onSearch={handleSearch}
        />
        
        <Button 
          type="text" 
          icon={<GithubOutlined />}
          href="https://github.com"
          target="_blank"
        >
          GitHub
        </Button>
      </Space>
    </AntHeader>
  );
};

export default Header;
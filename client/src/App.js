import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import HotTrends from './pages/HotTrends';
import NicheProjects from './pages/NicheProjects';
import TechKeywords from './pages/TechKeywords';
import ProjectDetail from './pages/ProjectDetail';
import Analytics from './pages/Analytics';
import Admin from './pages/Admin';
import './App.css';

const { Content } = Layout;

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <Layout style={{ minHeight: '100vh' }}>
          <Header />
          <Layout>
            <Sidebar />
            <Layout style={{ padding: '24px' }}>
              <Content
                style={{
                  padding: 24,
                  margin: 0,
                  minHeight: 280,
                  background: '#fff',
                  borderRadius: 8,
                }}
              >
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/hot-trends" element={<HotTrends />} />
                  <Route path="/niche-projects" element={<NicheProjects />} />
                  <Route path="/tech-keywords" element={<TechKeywords />} />
                  <Route path="/project/:id" element={<ProjectDetail />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/admin" element={<Admin />} />
                </Routes>
              </Content>
            </Layout>
          </Layout>
        </Layout>
      </Router>
    </ConfigProvider>
  );
}

export default App;
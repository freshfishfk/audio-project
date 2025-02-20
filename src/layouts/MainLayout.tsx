import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  SoundOutlined,
  UploadOutlined,
  BookOutlined,
  InfoCircleOutlined,
  MessageOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    {
      key: '/',
      label: '首页',
      icon: <HomeOutlined />
    },
    {
      key: '/audio-list',
      label: '音色列表',
      icon: <SoundOutlined />
    },
    {
      key: '/audio-upload',
      label: '上传音频',
      icon: <UploadOutlined />
    },
    {
      key: '/audio-book',
      label: '有声书阅读',
      icon: <BookOutlined />
    },
    {
      key: '/emotional-chat',
      label: '情感聊天',
      icon: <MessageOutlined />
    },
    {
      key: '/about',
      label: '关于',
      icon: <InfoCircleOutlined />
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)' }} />
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['/']}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: '#fff' }}>
          {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
            className: 'trigger',
            onClick: () => setCollapsed(!collapsed),
            style: {
              padding: '0 24px',
              fontSize: '18px',
              lineHeight: '64px',
              cursor: 'pointer',
              transition: 'color 0.3s',
            },
          })}
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: '#fff',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
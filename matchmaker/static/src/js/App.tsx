import React, { useState } from 'react';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UploadOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { Layout, Menu, Button, theme } from 'antd';
const { Header, Sider, Content } = Layout;

import Resume from './components/Resume';
import Matcher from './components/Matcher';


const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState('1');
  const [resumeJson, setResumeJson] = useState({});

  const handleMenuClick = e => {
    setSelectedKey(e.key);
  };

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <Layout>
      <Sider trigger={null} collapsible collapsed={collapsed}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div className="demo-logo-vertical" />
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setCollapsed(!collapsed)}
        />
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['1']}
          onClick={handleMenuClick}
          items={[
            {
              key: '1',
              icon: <UserOutlined />,
              label: 'Resume',
            },
            {
              key: '2',
              icon: <VideoCameraOutlined />,
              label: 'Matches',
            },
            {
              key: '3',
              icon: <UploadOutlined />,
              label: 'Optimize',
            },
          ]}
        />
      </Sider>
      <Layout
        style={{
          marginLeft: collapsed ? 80 : 200,  // adjust based on the width of your collapsed and expanded Sider
          transition: 'margin-left .3s',  // this line adds the transition
        }}
      >
        <Header style={{ margin: "0px 0px 20px 0px", padding: "20px 64px", background: colorBgContainer }}>
          <h1>Header</h1>
        </Header>
        <Content
          style={{
            background: colorBgContainer,
          }}
        >
          {selectedKey === '1' && <Resume resumeJson={resumeJson} setResumeJson={setResumeJson} />}
          {selectedKey === '2' && <Matcher resumeJson={resumeJson}/>}
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
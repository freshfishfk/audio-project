import React from 'react';
import { Table, Space, Button } from 'antd';

const AudioList: React.FC = () => {
  const columns = [
    {
      title: '音频名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '时长',
      dataIndex: 'duration',
      key: 'duration',
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
    },
    {
      title: '上传时间',
      dataIndex: 'uploadTime',
      key: 'uploadTime',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button type="link">播放</Button>
          <Button type="link">编辑</Button>
          <Button type="link" danger>删除</Button>
        </Space>
      ),
    },
  ];

  const data = [
    {
      key: '1',
      name: '示例音频1.mp3',
      duration: '3:45',
      size: '5.2MB',
      uploadTime: '2024-01-20 10:30:00',
    },
    {
      key: '2',
      name: '示例音频2.wav',
      duration: '2:30',
      size: '3.8MB',
      uploadTime: '2024-01-19 15:20:00',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">音频列表</h1>
      <Table columns={columns} dataSource={data} />
    </div>
  );
};

export default AudioList;
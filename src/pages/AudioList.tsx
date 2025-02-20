import React, { useEffect, useState } from 'react';
import { Table, Space, Button, message } from 'antd';

interface AudioItem {
  customName: string;
  model: string;
  text: string;
  uri: string;
}

const AudioList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [audioList, setAudioList] = useState<AudioItem[]>([]);

  const fetchAudioList = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://api.siliconflow.cn/v1/audio/voice/list', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_API_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error('获取音色列表失败');
      }

      const data = await response.json();
      setAudioList(data.result || []);
    } catch (error) {
      message.error('获取音色列表失败：' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (uri: string) => {
    try {
      const response = await fetch(`https://api.siliconflow.cn/v1/audio/voice/${uri}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_API_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error('删除音频失败');
      }

      message.success('删除成功');
      fetchAudioList();
    } catch (error) {
      message.error('删除失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  useEffect(() => {
    fetchAudioList();
  }, []);

  const columns = [
    {
      title: '音频标题',
      dataIndex: 'customName',
      key: 'customName',
    },
    {
      title: '模型',
      dataIndex: 'model',
      key: 'model',
    },
    {
      title: '文本内容',
      dataIndex: 'text',
      key: 'text',
      width: '30%',
      render: (text: string) => (
        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{text}</div>
      )
    },
    {
      title: '音频标识',
      dataIndex: 'uri',
      key: 'uri',
      width: '25%',
      render: (text: string) => (
        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{text}</div>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: AudioItem) => (
        <Space size="middle">
          <Button
            type="link"
            danger
            onClick={() => handleDelete(record.uri)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">音色列表</h1>
        <Button type="primary" onClick={fetchAudioList}>刷新</Button>
      </div>
      <Table
        columns={columns}
        dataSource={audioList}
        loading={loading}
        rowKey="uri"
      />
    </div>
  );
};

export default AudioList;
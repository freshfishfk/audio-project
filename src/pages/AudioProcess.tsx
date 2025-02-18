import React from 'react';
import { Card, Row, Col, Button, Upload, message } from 'antd';
import { UploadOutlined, ScissorOutlined, SwapOutlined, SoundOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';

const AudioProcess: React.FC = () => {
  const uploadProps: UploadProps = {
    name: 'audio',
    action: '/api/upload',
    accept: '.mp3,.wav,.ogg,.m4a',
    maxCount: 1,
    onChange(info) {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} 上传成功`);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} 上传失败`);
      }
    },
  };

  const processCards = [
    {
      title: '音频剪辑',
      icon: <ScissorOutlined style={{ fontSize: '24px' }} />,
      description: '剪辑音频片段，调整音频长度',
    },
    {
      title: '格式转换',
      icon: <SwapOutlined style={{ fontSize: '24px' }} />,
      description: '转换音频格式（支持 MP3, WAV, OGG, M4A）',
    },
    {
      title: '音量调节',
      icon: <SoundOutlined style={{ fontSize: '24px' }} />,
      description: '调整音频音量，标准化音量水平',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">音频处理</h1>
      
      <div className="mb-8">
        <Upload {...uploadProps}>
          <Button icon={<UploadOutlined />} size="large">
            选择要处理的音频文件
          </Button>
        </Upload>
      </div>

      <Row gutter={[16, 16]}>
        {processCards.map((card, index) => (
          <Col xs={24} sm={12} md={8} key={index}>
            <Card
              hoverable
              className="text-center"
              actions={[<Button type="primary">开始处理</Button>]}
            >
              <div className="mb-4">{card.icon}</div>
              <Card.Meta
                title={<span className="text-lg font-medium">{card.title}</span>}
                description={card.description}
              />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default AudioProcess;
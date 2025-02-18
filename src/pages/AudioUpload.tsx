import React from 'react';
import { Upload, Button, Form, Input, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';

const AudioUpload: React.FC = () => {
  const [form] = Form.useForm();

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

  const onFinish = (values: any) => {
    console.log('表单提交:', values);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">上传音频</h1>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item
          label="音频标题"
          name="title"
          rules={[{ required: true, message: '请输入音频标题' }]}
        >
          <Input placeholder="请输入音频标题" />
        </Form.Item>

        <Form.Item
          label="音频描述"
          name="description"
        >
          <Input.TextArea rows={4} placeholder="请输入音频描述（选填）" />
        </Form.Item>

        <Form.Item
          label="音频文件"
          name="audioFile"
          rules={[{ required: true, message: '请上传音频文件' }]}
        >
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />}>选择音频文件</Button>
          </Upload>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            上传
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default AudioUpload;
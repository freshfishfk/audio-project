import React, { useState } from 'react';
import { Upload, Button, Form, Input, message, Tabs } from 'antd';
import { UploadOutlined, AudioOutlined } from '@ant-design/icons';
import { useReactMediaRecorder } from 'react-media-recorder';
import type { UploadProps } from 'antd';

interface UploadFormData {
  title: string;
  description?: string;
  audioFile?: File;
  text: string;
}

const AudioUpload: React.FC = () => {
  const [form] = Form.useForm();
  const [audioBase64, setAudioBase64] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);

  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl
  } = useReactMediaRecorder({
    audio: true,
    onStop: async (blobUrl, blob) => {
      if (blob) {
        const base64 = await fileToBase64(new File([blob], 'recording.wav', { type: 'audio/wav' }));
        setAudioBase64(base64);
      }
    }
  });

  // 将文件转换为base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };


  const uploadProps: UploadProps = {
    name: 'audio',
    accept: '.mp3,.wav',
    maxCount: 1,
    beforeUpload: async (file) => {
      try {
        const base64 = await fileToBase64(file);
        setAudioBase64(base64);
        return false; // 阻止自动上传
      } catch (error) {
        message.error('文件读取失败', error);
        return false;
      }
    },
    onChange(info) {
      if (info.file.status === 'removed') {
        setAudioBase64('');
      }
    },
  };

  const onFinish = async (values: UploadFormData) => {
    if (!audioBase64) {
      message.error('请先上传或录制音频文件');
      return;
    }

    try {
      const response = await fetch('https://api.siliconflow.cn/v1/uploads/audio/voice', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'FunAudioLLM/CosyVoice2-0.5B',
          customName: values.title,
          audio: audioBase64,
          text: values.text
        })
      });

      const data = await response.json();

      if (response.ok) {
        message.success('音频上传成功');
        form.resetFields();
        setAudioBase64('');
      } else {
        message.error(`上传失败: ${data.message || '未知错误'}`);
      }
    } catch (error) {
      message.error('上传过程中发生错误');
      console.error('上传错误:', error);
    }
  };

  const handleRecordingClick = () => {
    if (!isRecording) {
      startRecording();
      setIsRecording(true);
    } else {
      stopRecording();
      setIsRecording(false);
    }
  };

  const renderForm = () => (
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
        label="音频文本"
        name="text"
        rules={[{ required: true, message: '请输入音频对应的文本内容' }]}
      >
        <Input.TextArea rows={4} placeholder="请输入音频对应的文本内容" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          上传
        </Button>
      </Form.Item>
    </Form>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">音频上传</h1>
      <Tabs
        defaultActiveKey="upload"
        items={[
          {
            key: 'upload',
            label: '上传音频',
            children: (
              <>
                <Form.Item
                  label="音频文件"
                  required
                  className="mb-6"
                >
                  <Upload {...uploadProps}>
                    <Button icon={<UploadOutlined />}>选择音频文件</Button>
                  </Upload>
                </Form.Item>
                {renderForm()}
              </>
            ),
          },
          {
            key: 'record',
            label: '录制音频',
            children: (
              <>
                <div className="mb-6">
                  <Button
                    type={isRecording ? 'primary' : 'default'}
                    icon={<AudioOutlined />}
                    onClick={handleRecordingClick}
                    danger={isRecording}
                  >
                    {isRecording ? '停止录音' : '开始录音'}
                  </Button>
                  {status === 'recording' && (
                    <span className="ml-4 text-red-500">正在录音...</span>
                  )}
                  {mediaBlobUrl && !isRecording && (
                    <div className="mt-4">
                      <audio src={mediaBlobUrl} controls className="w-full" />
                    </div>
                  )}
                </div>
                {renderForm()}
              </>
            ),
          },
        ]}
      />
    </div>
  );
};

export default AudioUpload;
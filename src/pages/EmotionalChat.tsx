import React, { useState, useRef, useEffect } from 'react';
import { Layout, Input, Button, List, Avatar, Card, Skeleton } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined, AudioOutlined } from '@ant-design/icons';

const { Content } = Layout;

interface ChatMessage {
  id: number;
  content: string;
  type: 'user' | 'bot';
  timestamp: Date;
  audioUrl?: string;
  thinkingProcess?: string;
  isLoading?: boolean;
}

const EmotionalChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const API_KEY = 'sk-bmpnjwoudgongymjxddhuwzgllfrszdbfsgygjkhhgfwizvz';

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now(),
      content: inputValue,
      type: 'user',
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputValue('');
    await processUserInput(inputValue);
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current);
          await processAudio(audioBlob);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error accessing microphone:', error);
      }
    } else if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append("model", "FunAudioLLM/SenseVoiceSmall");
    formData.append('file', audioBlob, 'recording.wav');

    try {
      // 语音转文本
      const transcriptionResponse = await fetch('https://api.siliconflow.cn/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
        body: formData
      });
      const transcriptionResult = await transcriptionResponse.json();

      if (transcriptionResult.text) {
        const newMessage: ChatMessage = {
          id: Date.now(),
          content: transcriptionResult.text,
          type: 'user',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, newMessage]);
        await processUserInput(transcriptionResult.text);
      }
    } catch (error) {
      console.error('Error processing audio:', error);
    }
  };

  // 移除未使用的 thinkingProcess state，因为它的值已经包含在每个消息中

  const processUserInput = async (input: string) => {
    // 添加一个加载状态的消息
    const loadingMessage: ChatMessage = {
      id: Date.now(),
      content: '',
      type: 'bot',
      timestamp: new Date(),
      isLoading: true
    };
    setMessages(prev => [...prev, loadingMessage]);
    try {
      // 生成对话响应
      const chatResponse = await fetch('http://127.0.0.1:11434/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "deepseek-r1:8b",
          messages: [{
            role: "user",
            content: input
          }]
        })
      });
      const chatResult = await chatResponse.json();
      if (!chatResult?.choices?.[0]?.message?.content) {
        throw new Error('无效的响应数据格式');
      }
      const botReply = chatResult.choices[0].message.content;

      // 提取思维过程
      let displayReply = botReply;
      let currentThinkingProcess = '';

      // 使用正则表达式提取所有的思维过程
      const thinkRegex = /<think>(.*?)<\/think>/gs;
      const thinkMatches = [...botReply.matchAll(thinkRegex)];
      
      if (thinkMatches.length > 0) {
        // 合并所有思维过程
        currentThinkingProcess = thinkMatches
          .map(match => match[1].trim())
          .filter(process => process)
          .join('\n');
        
        // 移除所有 <think> 标签及其内容
        displayReply = botReply.replace(/<think>.*?<\/think>/gs, '').trim();
      }

      // 合成语音响应
      const ttsResponse = await fetch('https://api.siliconflow.cn/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "FunAudioLLM/CosyVoice2-0.5B",
          voice: "FunAudioLLM/CosyVoice2-0.5B:anna",
          response_format: "mp3",
          gain: 0,
          stream: false,
          input: displayReply
        })
      });

      const audioBlob = await ttsResponse.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const botMessage: ChatMessage = {
        id: Date.now(),
        content: displayReply,
        type: 'bot',
        timestamp: new Date(),
        audioUrl: audioUrl,
        thinkingProcess: currentThinkingProcess
      };

      setMessages(prev => prev.map(msg => 
        msg.isLoading ? botMessage : msg
      ));

      // 自动滚动到最新消息
      const chatList = document.querySelector('.chat-list');
      if (chatList) {
        setTimeout(() => {
          chatList.scrollTop = chatList.scrollHeight;
        }, 100);
      }
    } catch (error) {
      console.error('Error processing chat:', error);
    }
  };

  // 添加 useEffect 来监听消息列表变化并保存到 localStorage
  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);
  return (
    <Layout className="chat-container" style={{ height: '100%', background: '#fff' }}>
      <Content style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <Card title="情感聊天" style={{ flex: 1, marginBottom: '20px' }}>
          <List
            className="chat-list"
            itemLayout="horizontal"
            dataSource={messages}
            renderItem={(message) => (
              <List.Item style={{
                textAlign: message.type === 'user' ? 'right' : 'left',
                padding: '8px 20px',
                display: 'flex',
                justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: message.type === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                  gap: '8px',
                  maxWidth: '80%'
                }}>
                  <Avatar
                    icon={message.type === 'user' ? <UserOutlined /> : <RobotOutlined />}
                    style={{
                      backgroundColor: message.type === 'user' ? '#1890ff' : '#52c41a',
                      flexShrink: 0
                    }}
                  />
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    width: '100%'
                  }}>
                    <span style={{
                      fontSize: '12px',
                      color: '#999',
                      textAlign: message.type === 'user' ? 'right' : 'left',
                      marginBottom: '4px'
                    }}>
                      {new Date(message.timestamp).toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </span>
                    {message.isLoading ? (
                      <div style={{ padding: '8px 12px', minWidth: '200px' }}>
                        <Skeleton active paragraph={{ rows: 1 }} title={false} />
                      </div>
                    ) : (
                      <>
                        {message.type === 'bot' && message.thinkingProcess && (
                          <div style={{
                            padding: '10px',
                            background: '#f9f9f9',
                            border: '1px solid #e8e8e8',
                            borderRadius: '4px',
                            marginBottom: '8px'
                          }}>
                            <div style={{ color: '#666', marginBottom: '4px' }}>思维过程：</div>
                            <div style={{ color: '#333' }}>{message.thinkingProcess}</div>
                          </div>
                        )}
                        <div style={{
                          background: message.type === 'user' ? '#1890ff' : '#f0f2f5',
                          color: message.type === 'user' ? '#fff' : '#000',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          wordBreak: 'break-word'
                        }}>
                          {message.content}
                        </div>
                        {message.audioUrl && message.type === 'bot' && (
                          <audio controls src={message.audioUrl} style={{ maxWidth: '200px' }} />
                        )}
                      </>
                    )}
                  </div>
                </div>
              </List.Item>
            )}
            style={{
              height: 'calc(100vh - 280px)',
              overflowY: 'auto',
              padding: '0 20px'
            }}
          />
        </Card>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Input
            placeholder="输入你想说的话..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onPressEnter={handleSend}
            style={{ flex: 1 }}
          />
          <Button
            type="primary"
            icon={<AudioOutlined />}
            onClick={toggleRecording}
            danger={isRecording}
          >
            {isRecording ? '停止录音' : '开始录音'}
          </Button>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
          >
            发送
          </Button>
        </div>
      </Content>
    </Layout>
  );
};

export default EmotionalChat;
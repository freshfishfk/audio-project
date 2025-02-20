import React, { useState, useRef, useEffect } from 'react';
import { Layout, Input, Button, List, Avatar, Card, Skeleton, Select } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined, AudioOutlined, DeleteOutlined } from '@ant-design/icons';

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

interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
}

const EmotionalChat: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const savedConversations = localStorage.getItem('conversations');
    return savedConversations ? JSON.parse(savedConversations) : [];
  });
  const [currentConversationId, setCurrentConversationId] = useState<string>(() => {
    if (conversations.length > 0) {
      return conversations[0].id;
    }
    return '';
  });
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState('neutral');
  const [selectedDialect, setSelectedDialect] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('');
  const [voiceOptions, setVoiceOptions] = useState<Array<{ value: string; label: string }>>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const currentConversation = conversations.find(conv => conv.id === currentConversationId);
  const messages = currentConversation?.messages || [];

  const emotionOptions = [
    { value: 'neutral', label: '中性' },
    { value: 'happy', label: '快乐' },
    { value: 'sad', label: '悲伤' },
    { value: 'surprise', label: '惊喜' },
    { value: 'angry', label: '愤怒' }
  ];

  const dialectOptions = [
    { value: '', label: '普通话' },
    { value: '四川话', label: '四川话' },
    { value: '上海话', label: '上海话' },
    { value: '天津话', label: '天津话' }
  ];
  const API_KEY = 'sk-bmpnjwoudgongymjxddhuwzgllfrszdbfsgygjkhhgfwizvz';

  // 获取可用音色列表
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await fetch('https://api.siliconflow.cn/v1/audio/voice/list', {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
          }
        });
        const data = await response.json();
        if (data.result) {
          const options = data.result.map((voice: { model: string; customName: string; text: string; uri: string }) => ({
            value: voice.uri,
            label: voice.customName
          }));
          setVoiceOptions(options);
        }
      } catch (error) {
        console.error('Error fetching voices:', error);
      }
    };
    fetchVoices();
  }, []);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    if (!currentConversationId) {
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: inputValue.slice(0, 20) + (inputValue.length > 20 ? '...' : ''),
        messages: [],
        createdAt: new Date()
      };
      setConversations(prev => [...prev, newConversation]);
      setCurrentConversationId(newConversation.id);
    }

    const newMessage: ChatMessage = {
      id: Date.now(),
      content: inputValue,
      type: 'user',
      timestamp: new Date(),
    };

    setConversations(prev => prev.map(conv => {
      if (conv.id === currentConversationId) {
        return {
          ...conv,
          messages: [...conv.messages, newMessage]
        };
      }
      return conv;
    }));
    setInputValue('');
    await processUserInput(inputValue);
  };

  const processUserInput = async (input: string) => {
    const loadingMessage: ChatMessage = {
      id: Date.now(),
      content: '',
      type: 'bot',
      timestamp: new Date(),
      isLoading: true
    };

    setConversations(prev => prev.map(conv => {
      if (conv.id === currentConversationId) {
        return {
          ...conv,
          messages: [...conv.messages, loadingMessage]
        };
      }
      return conv;
    }));

    const speechPrompt = `请以${emotionOptions.find(e => e.value === selectedEmotion)?.label + '的语气'}表达<|endofprompt|>`
    try {
      // 生成对话响应
      const chatResponse = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        // const chatResponse = await fetch('http://127.0.0.1:11434/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-ai/DeepSeek-V3",
          messages: [
            {
              role: "system",
              content: "你是一个专家"
            },
            ...messages.slice(-5).map(msg => ({
              role: msg.type === 'user' ? 'user' : 'assistant',
              content: msg.content
            })),
            {
              role: "user",
              content: input
            }
          ]
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
          voice: selectedVoice || "FunAudioLLM/CosyVoice2-0.5B:anna",
          response_format: "mp3",
          gain: 0,
          stream: false,
          input: `${speechPrompt}${displayReply}`
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

      setConversations(prev => prev.map(conv => {
        if (conv.id === currentConversationId) {
          return {
            ...conv,
            messages: conv.messages.map(msg =>
              msg.isLoading ? botMessage : msg
            )
          };
        }
        return conv;
      }));
    } catch (error) {
      console.error('Error processing chat:', error);
    }
  };

  // 添加 useEffect 来监听消息列表变化并保存到 localStorage
  useEffect(() => {
    localStorage.setItem('conversations', JSON.stringify(conversations));
  }, [conversations]);

  const handleNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: '新对话',
      messages: [],
      createdAt: new Date()
    };
    setConversations(prev => [...prev, newConversation]);
    setCurrentConversationId(newConversation.id);
  };

  const handleDeleteConversation = (convId: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== convId));
    if (currentConversationId === convId) {
      setCurrentConversationId(conversations[0]?.id || '');
    }
  };

  const handleClearAllMessages = () => {
    if (!currentConversationId) return;
    setConversations(prev => prev.map(conv => {
      if (conv.id === currentConversationId) {
        return {
          ...conv,
          messages: []
        };
      }
      return conv;
    }));
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          try {
            const formData = new FormData();
            formData.append('file', audioBlob, 'recording.wav');
            formData.append('model', 'whisper-1');
            formData.append('language', 'zh');

            const response = await fetch('https://api.siliconflow.cn/v1/audio/transcriptions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${API_KEY}`,
              },
              body: formData
            });

            const data = await response.json();
            if (data.text) {
              setInputValue(data.text);
            }
          } catch (error) {
            console.error('Error transcribing audio:', error);
          }

          // 清理资源
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
  return (
    <Layout className="chat-container" style={{ height: '100%', background: '#fff' }}>
      <Layout.Sider width={250} style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}>
        <div style={{ padding: '20px' }}>
          <Button type="primary" block onClick={handleNewConversation}>
            新建对话
          </Button>
        </div>
        <List
          dataSource={conversations}
          renderItem={conversation => (
            <List.Item
              key={conversation.id}
              onClick={() => setCurrentConversationId(conversation.id)}
              style={{
                padding: '12px 20px',
                cursor: 'pointer',
                background: currentConversationId === conversation.id ? '#e6f7ff' : 'transparent'
              }}
              actions={[
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteConversation(conversation.id);
                  }}
                />
              ]}
            >
              <div>
                <div style={{ fontWeight: 500 }}>{conversation.title}</div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  {new Date(conversation.createdAt).toLocaleDateString()}
                </div>
              </div>
            </List.Item>
          )}
          style={{ height: 'calc(100vh - 80px)', overflowY: 'auto' }}
        />
      </Layout.Sider>
      <Content style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <Card
          title="情感聊天"
          style={{ flex: 1, marginBottom: '20px' }}
          extra={<Button danger onClick={handleClearAllMessages}>清空对话</Button>}
        >
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
                  maxWidth: '80%',
                  position: 'relative'
                }}>
                  <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    size="small"
                    onClick={() => handleDeleteMessage(message.id)}
                    className="delete-button"
                    style={{
                      position: 'absolute',
                      [message.type === 'user' ? 'left' : 'right']: '-24px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      opacity: 0,
                      transition: 'opacity 0.3s'
                    }}
                  />
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
                        {message.type === 'bot' && message.audioUrl && (
                          <audio controls src={message.audioUrl} style={{ width: '100%', maxWidth: '400px', marginTop: '8px' }} />
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
        <div style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
          <Select
            style={{ width: 120 }}
            value={selectedEmotion}
            onChange={setSelectedEmotion}
            options={emotionOptions}
            placeholder="选择情绪"
          />
          <Select
            style={{ width: 120 }}
            value={selectedDialect}
            onChange={setSelectedDialect}
            options={dialectOptions}
            placeholder="选择方言"
          />
          <Select
            style={{ width: 120 }}
            value={selectedVoice}
            onChange={setSelectedVoice}
            options={voiceOptions}
            placeholder="选择音色"
          />
        </div>
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
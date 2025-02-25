import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Upload, List, Button, Typography, Space, message, Select, Spin } from 'antd';
import { UploadOutlined, BookOutlined, PlayCircleOutlined, PauseCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { UploadProps } from 'antd';

const { Title } = Typography;

const endString = '<|endofprompt|>';
interface Chapter {
  id: number;
  title: string;
  content: string[];
}

interface Book {
  id: number;
  title: string;
  chapters: Chapter[];
}

type ThemeType = 'light' | 'dark' | 'sepia';

const AudioBook: React.FC = () => {
  const navigate = useNavigate();
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const bookId = searchParams.get('id');

  useEffect(() => {
    if (bookId) {
      const books = JSON.parse(localStorage.getItem('books') || '[]');
      const book = books.find((b: Book) => b.id === Number(bookId));
      if (book) {
        setCurrentBook(book);
      }
    }
  }, [bookId]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [playingSentence, setPlayingSentence] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [theme] = useState<ThemeType>('light');
  const [selectedEmotion, setSelectedEmotion] = useState('neutral');
  const [selectedDialect, setSelectedDialect] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('');
  const [voiceOptions, setVoiceOptions] = useState<Array<{ value: string; label: string }>>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const nextAudioRef = useRef<HTMLAudioElement | null>(null);

  // 监听声音配置变化
  useEffect(() => {
    // 清除音频缓存
    Array.from(audioCache.current.values()).forEach(url => {
      URL.revokeObjectURL(url);
    });
    audioCache.current.clear();

    // 如果正在播放，停止当前播放
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (nextAudioRef.current) {
      nextAudioRef.current.pause();
    }

    // 如果在自动播放模式下，使用新配置继续播放
    if (isAutoPlaying && playingSentence && selectedChapter) {
      const currentContent = selectedChapter.content;
      handlePlayClick(currentContent[currentSentenceIndex], currentSentenceIndex, currentContent);
    }
  }, [selectedEmotion, selectedDialect, selectedVoice]);
  const emotionOptions = [
    { value: 'neutral', label: '中性' },
    { value: 'happy', label: '快乐' },
    { value: 'sad', label: '悲伤' },
    { value: 'surprise', label: '惊喜' },
    { value: 'angry', label: '愤怒' }
  ];

  const dialectoptions = [
    { value: '', label: '普通话' },
    { value: '四川话', label: '四川话' },
    { value: '上海话', label: '上海话' },
    { value: '天津话', label: '天津话' }
  ];

  // 获取可用音色列表
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await fetch('https://api.siliconflow.cn/v1/audio/voice/list', {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_API_KEY}`,
          }
        });
        const data = await response.json();
        if (data.result) {
          const options = data.result.map((voice: { model: string; customName: string; text: string; uri: string }) => ({
            value: voice.uri,
            label: voice.customName
          }));
          setVoiceOptions([
            {
              value: '',
              label: '默认音色'
            },
            ...options,
          ]);
        }
      } catch (error) {
        console.error('Error fetching voices:', error);
      }
    };
    fetchVoices();
  }, []);

  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const audioCache = useRef<Map<string, string>>(new Map());

  // 预加载指定句子的音频
  const preloadAudio = async (sentences: string[]) => {
    const results: { [key: string]: string } = {};
    // 生成缓存键，包含所有参数信息
    const getCacheKey = (sentence: string) => {
      return `${sentence}_${selectedVoice}_${selectedEmotion}_${selectedDialect}`;
    };

    // 过滤需要重新获取的句子
    const toFetch = sentences.filter(sentence => !audioCache.current.has(getCacheKey(sentence)));

    if (toFetch.length > 0) {
      try {
        const responses = await Promise.all(toFetch.map(sentence =>
          fetch('https://api.siliconflow.cn/v1/audio/speech', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: "FunAudioLLM/CosyVoice2-0.5B",
              voice: selectedVoice || "FunAudioLLM/CosyVoice2-0.5B:anna",
              response_format: "mp3",
              gain: 0,
              stream: false,
              input: `请以${emotionOptions.find(e => e.value === selectedEmotion)?.label + '的语气'}${selectedDialect ? `，用${selectedDialect}` : ''}表达${endString}${sentence}`
            })
          })
        ));

        const blobs = await Promise.all(responses.map(res => res.blob()));
        toFetch.forEach((sentence, index) => {
          const audioUrl = URL.createObjectURL(blobs[index]);
          audioCache.current.set(getCacheKey(sentence), audioUrl);
          results[sentence] = audioUrl;
        });
      } catch (error) {
        console.error('Error preloading audio:', error);
      }
    }

    // 返回所有句子的音频URL（包括缓存的）
    return sentences.map(sentence => ({
      sentence,
      audioUrl: results[sentence] || audioCache.current.get(getCacheKey(sentence)) || null
    }));
  };

  // 更新预加载队列
  const updatePreloadQueue = async (currentIndex: number, content: string[]) => {
    const maxPreloadCount = 3; // 预加载窗口大小
    const endIndex = Math.min(currentIndex + maxPreloadCount, content.length);
    const preloadSentences = content.slice(currentIndex, endIndex);

    // 清理过期的缓存
    const maxCacheSize = 10;
    if (audioCache.current.size > maxCacheSize) {
      const entries = Array.from(audioCache.current.entries());
      entries.slice(0, entries.length - maxCacheSize).forEach(([key]) => {
        const url = audioCache.current.get(key);
        if (url) {
          URL.revokeObjectURL(url);
          audioCache.current.delete(key);
        }
      });
    }

    // 预加载音频
    await preloadAudio(preloadSentences);
  };

  const handlePlayClick = async (sentence: string, index: number, content: string[]) => {
    if (isLoading) return;
    setIsLoading(true);
    setPlayingSentence(sentence);
    setCurrentSentenceIndex(index);
    setIsAutoPlaying(true);

    try {
      // 预加载当前及后续句子
      const audioResults = await preloadAudio([sentence]);
      const audioUrl = audioResults[0]?.audioUrl;

      if (!audioUrl) {
        throw new Error('无法加载音频');
      }

      // 更新预加载队列
      updatePreloadQueue(index + 1, content);

      // 播放当前句子的语音
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
      } else {
        audioRef.current = new Audio(audioUrl);
      }

      // 监听当前音频播放结束事件
      audioRef.current.onended = async () => {
        setPlayingSentence(null);
        // 如果有下一句，自动播放下一句
        const nextSentence = content[index + 1];
        if (nextSentence) {
          setPlayingSentence(nextSentence);
          handlePlayClick(nextSentence, index + 1, content);
        } else {
          setIsAutoPlaying(false);
          message.success('本章播放完成');
        }
      };

      audioRef.current.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      message.error('播放音频失败');
      setPlayingSentence(null);
      setIsAutoPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 主题配置
  const themeStyles = {
    light: {
      background: '#ffffff',
      text: '#333333',
      border: '#e8e8e8'
    },
    dark: {
      background: '#1a1a1a',
      text: '#e0e0e0',
      border: '#333333'
    },
    sepia: {
      background: '#f4ecd8',
      text: '#5b4636',
      border: '#d3c4b4'
    }
  };

  // 解析章节标题的正则表达式
  const chapterRegex = /^(第[一二三四五六七八九十百千万]+章|Chapter\s+\d+|第\d+章)[：:\s]*(.*?)$/;

  // 解析文本文件
  const parseTextFile = (text: string): Book => {
    const lines = text.split('\n').filter(line => line.trim());
    const chapters: Chapter[] = [];
    let currentChapter: Chapter | null = null;
    let chapterId = 1;

    lines.forEach(line => {
      const match = line.match(chapterRegex);
      if (match) {
        if (currentChapter) {
          chapters.push(currentChapter);
        }
        currentChapter = {
          id: chapterId++,
          title: line.trim(),
          content: []
        };
      } else if (currentChapter) {
        // 按句号、问号、感叹号分割句子
        const sentences = line.match(/[^。！？.!?]+[。！？.!?]/g) || [line];
        currentChapter.content.push(...sentences);
      } else {
        // 如果还没有章节，创建一个默认章节
        currentChapter = {
          id: chapterId++,
          title: '第一章',
          content: [line]
        };
      }
    });

    if (currentChapter) {
      chapters.push(currentChapter);
    }

    return {
      id: Date.now(),
      title: '上传的电子书',
      chapters
    };
  };

  const uploadProps: UploadProps = {
    accept: '.txt',
    showUploadList: false,
    beforeUpload: file => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const text = e.target?.result as string;
          const book = parseTextFile(text);
          setCurrentBook(book);
          setSelectedChapter(null);

          // 保存到localStorage
          const existingBooks = JSON.parse(localStorage.getItem('books') || '[]');
          existingBooks.push(book);
          localStorage.setItem('books', JSON.stringify(existingBooks));

          message.success('电子书解析成功');
        } catch (error) {
          message.error('文件解析失败');
        }
      };
      reader.readAsText(file);
      return false;
    }
  };

  const renderUpload = () => (
    <div className="text-center py-12">
      <Upload {...uploadProps}>
        <Button icon={<UploadOutlined />} size="large">
          上传TXT电子书
        </Button>
      </Upload>
    </div>
  );

  const renderChapterList = () => {
    if (!currentBook) return null;

    return (
      <div className="mb-8" style={{ borderRight: `1px solid ${themeStyles[theme].border}` }}>
        <Space className="mb-4" size="middle">
          <BookOutlined style={{ fontSize: '24px', color: themeStyles[theme].text }} />
          <Title level={3} style={{ margin: 0, color: themeStyles[theme].text }}>{currentBook.title}</Title>
        </Space>
        <List
          className="chapter-list"
          itemLayout="horizontal"
          dataSource={currentBook.chapters}
          renderItem={(chapter) => (
            <List.Item
              className="cursor-pointer hover:bg-opacity-10"
              style={{
                background: selectedChapter?.id === chapter.id ? `${themeStyles[theme].border}40` : 'transparent',
                color: themeStyles[theme].text
              }}
              onClick={() => {
                setSelectedChapter(chapter);
              }}
            >
              <List.Item.Meta
                title={<span style={{ color: themeStyles[theme].text }}>{chapter.title}</span>}
                description={<span style={{ color: `${themeStyles[theme].text}99` }}>{`${chapter.content.length} 个句子`}</span>}
              />
            </List.Item>
          )}
        />
      </div>
    );
  };

  const renderChapterContent = () => {
    if (!selectedChapter) return null;

    const contentStyle = {
      maxHeight: '70vh',
      overflowY: 'auto' as const,
      padding: '20px',
      background: themeStyles[theme].background,
      color: themeStyles[theme].text,
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      transition: 'all 0.3s ease'
    };

    const content = selectedChapter.content;

    return (
      <div style={contentStyle}>
        {content.map((sentence, index) => (
          <span
            key={index}
            style={{
              cursor: 'pointer',
              backgroundColor: playingSentence === sentence ? 'rgba(0,0,0,0.1)' : 'transparent',
              padding: '2px 4px',
              margin: '0 2px',
              borderRadius: '4px',
              display: 'inline-block'
            }}
            onClick={() => handlePlayClick(sentence, index, content)}
          >
            {sentence}
            {playingSentence === sentence && isLoading && <Spin size="small" style={{ marginLeft: '5px' }} />}
            {playingSentence === sentence && !isLoading && (
              <PauseCircleOutlined style={{ marginLeft: '5px' }} />
            )}
            {playingSentence !== sentence && (
              <PlayCircleOutlined style={{ marginLeft: '5px', opacity: 0.5 }} />
            )}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto" style={{
      background: themeStyles[theme].background,
      minHeight: '90vh',
      padding: '20px',
      transition: 'all 0.3s ease'
    }}>
      <div className="flex items-center gap-4 mb-6">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/book-list')}
          style={{ color: themeStyles[theme].text }}
        >
          返回列表
        </Button>
        <Title level={2} style={{ margin: 0, color: themeStyles[theme].text }}>电子书阅读</Title>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <Select
            value={selectedEmotion}
            onChange={setSelectedEmotion}
            style={{ width: 120 }}
            options={emotionOptions}
            placeholder="选择情感"
          />
          <Select
            value={selectedDialect}
            onChange={setSelectedDialect}
            style={{ width: 120 }}
            options={dialectoptions}
            placeholder="选择方言"
          />
          <Select
            value={selectedVoice}
            onChange={setSelectedVoice}
            style={{ width: 120 }}
            options={voiceOptions}
            placeholder="选择音色"
          />
        </div>
      </div>
      {!currentBook && renderUpload()}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          {renderChapterList()}
        </div>
        <div className="md:col-span-2">
          {renderChapterContent()}
        </div>
      </div>
    </div>
  );
};

export default AudioBook;
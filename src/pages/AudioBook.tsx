import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Upload, List, Button, Typography, Space, message, Radio, Segmented } from 'antd';
import { UploadOutlined, BookOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { UploadProps } from 'antd';

const { Title } = Typography;

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
type ReadingModeType = 'scroll' | 'book';

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
  const [hoveredSentence, setHoveredSentence] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeType>('light');
  const [readingMode, setReadingMode] = useState<ReadingModeType>('scroll');
  const [currentPage, setCurrentPage] = useState(0);

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
                setCurrentPage(0);
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
      overflowY: readingMode === 'scroll' ? 'auto' : 'hidden',
      padding: '20px',
      background: themeStyles[theme].background,
      color: themeStyles[theme].text,
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      transition: 'all 0.3s ease'
    };

    const pageSize = 500; // 每页显示的字符数
    const content = selectedChapter.content;
    const totalPages = Math.ceil(content.join('').length / pageSize);
    const startIndex = currentPage * pageSize;
    const endIndex = startIndex + pageSize;

    let displayContent;
    if (readingMode === 'book') {
      let currentText = '';
      let currentPageContent = [];

      for (const sentence of content) {
        if ((currentText + sentence).length <= pageSize) {
          currentText += sentence;
          currentPageContent.push(sentence);
        } else {
          break;
        }
      }

      displayContent = currentPageContent;
    } else {
      displayContent = content;
    }

    return (
      <div className="chapter-content">
        <div className="mb-6 flex justify-between items-center">
          <Title level={4} style={{ margin: 0, color: themeStyles[theme].text }}>{selectedChapter.title}</Title>
          <Space>
            <Radio.Group value={theme} onChange={e => setTheme(e.target.value)}>
              <Radio.Button value="light">浅色</Radio.Button>
              <Radio.Button value="dark">深色</Radio.Button>
              <Radio.Button value="sepia">护眼</Radio.Button>
            </Radio.Group>
            <Segmented
              options={[{ value: 'scroll', label: '滚动' }, { value: 'book', label: '翻页' }]}
              value={readingMode}
              onChange={value => setReadingMode(value as ReadingModeType)}
            />
          </Space>
        </div>
        <div style={{ ...contentStyle, overflowY: readingMode === 'scroll' ? 'auto' as const : 'hidden' as const }}>
          <div className="text-lg leading-relaxed">
            {displayContent.map((sentence, index) => (
              <span
                key={index}
                className={`sentence inline cursor-pointer transition-colors`}
                style={{
                  background: hoveredSentence === sentence ? `${themeStyles[theme].border}80` : 'transparent',
                  padding: '2px 4px',
                  margin: '0 2px',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease-in-out'
                }}
                onMouseEnter={() => setHoveredSentence(sentence)}
                onMouseLeave={() => setHoveredSentence(null)}
              >
                {sentence}
              </span>
            ))}
          </div>
        </div>
        {readingMode === 'book' && (
          <div className="mt-4 flex justify-between">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
            >
              上一页
            </Button>
            <span style={{ color: themeStyles[theme].text }}>
              {currentPage + 1} / {totalPages}
            </span>
            <Button
              onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
              disabled={currentPage >= totalPages - 1}
            >
              下一页
            </Button>
          </div>
        )}
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
      </div>
      {!currentBook && renderUpload()}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {currentBook && (
          <>
            <div className="md:col-span-1">
              {renderChapterList()}
            </div>
            <div className="md:col-span-2">
              {renderChapterContent()}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AudioBook;
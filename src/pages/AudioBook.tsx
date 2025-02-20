import React, { useState } from 'react';
import { Card, List, Button, Typography, Space, Progress } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, BookOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface Chapter {
  id: number;
  title: string;
  duration: string;
  progress: number;
}

interface Book {
  id: number;
  title: string;
  author: string;
  cover: string;
  chapters: Chapter[];
}

const AudioBook: React.FC = () => {
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // 模拟数据
  const books: Book[] = [
    {
      id: 1,
      title: '三体',
      author: '刘慈欣',
      cover: 'https://example.com/santi-cover.jpg',
      chapters: [
        { id: 1, title: '第一章：科学边界', duration: '45:30', progress: 100 },
        { id: 2, title: '第二章：射手与农场', duration: '42:15', progress: 60 },
        { id: 3, title: '第三章：红岸基地', duration: '38:45', progress: 0 },
      ]
    },
    {
      id: 2,
      title: '活着',
      author: '余华',
      cover: 'https://example.com/huozhe-cover.jpg',
      chapters: [
        { id: 1, title: '第一章：福贵家境', duration: '35:20', progress: 100 },
        { id: 2, title: '第二章：家道中落', duration: '33:45', progress: 0 },
      ]
    },
  ];

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const renderBookList = () => (
    <div className="mb-8">
      <Title level={2}>有声书库</Title>
      <List
        grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
        dataSource={books}
        renderItem={(book) => (
          <List.Item>
            <Card
              hoverable
              cover={<img alt={book.title} src={book.cover} style={{ height: 200, objectFit: 'cover' }} />}
              onClick={() => setCurrentBook(book)}
            >
              <Card.Meta
                title={book.title}
                description={`作者：${book.author}`}
              />
            </Card>
          </List.Item>
        )}
      />
    </div>
  );

  const renderChapterList = () => {
    if (!currentBook) return null;

    return (
      <div className="mb-8">
        <Space className="mb-4" size="middle">
          <BookOutlined style={{ fontSize: '24px' }} />
          <Title level={3} style={{ margin: 0 }}>{currentBook.title}</Title>
        </Space>
        <List
          className="chapter-list"
          itemLayout="horizontal"
          dataSource={currentBook.chapters}
          renderItem={(chapter) => (
            <List.Item
              actions={[
                <Button
                  type="link"
                  icon={isPlaying && currentBook.chapters[0].id === chapter.id ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                  onClick={handlePlayPause}
                >
                  {isPlaying && currentBook.chapters[0].id === chapter.id ? '暂停' : '播放'}
                </Button>
              ]}
            >
              <List.Item.Meta
                title={chapter.title}
                description={
                  <div>
                    <Space>
                      <span>时长：{chapter.duration}</span>
                      <Progress percent={chapter.progress} size="small" style={{ width: 100 }} />
                    </Space>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Title level={2} className="mb-6">有声书阅读</Title>
      {currentBook ? renderChapterList() : renderBookList()}
    </div>
  );
};

export default AudioBook;
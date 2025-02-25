import React from 'react';
import { Card, Row, Col, Typography, Empty, Upload, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { BookOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';

const { Title } = Typography;

interface Book {
  id: number;
  title: string;
  chapters: Array<{
    id: number;
    title: string;
    content: string[];
  }>;
}

const BookList: React.FC = () => {
  const navigate = useNavigate();
  // 从localStorage获取已上传的电子书列表
  const books = JSON.parse(localStorage.getItem('books') || '[]');

  const handleBookClick = (bookId: number) => {
    navigate(`/audio-book?id=${bookId}`);
  };

  // 解析章节标题的正则表达式
  const chapterRegex = /^(第[一二三四五六七八九十百千万]+章|Chapter\s+\d+|第\d+章)[：:\s]*(.*?)$/;

  // 解析文本文件
  const parseTextFile = (text: string): Book => {
    const lines = text.split('\n').filter(line => line.trim());
    const chapters: Book['chapters'] = [];
    let currentChapter: Book['chapters'][0] | null = null;
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
      // 设置文件编码
      const blob = new Blob([file], { type: 'text/plain;charset=UTF-8' });
      reader.onload = e => {
        try {
          const text = e.target?.result as string;
          const book = parseTextFile(text);

          // 使用文件名作为书籍标题
          book.title = file.name.replace(/\.txt$/i, '');

          // 保存到localStorage
          const existingBooks = JSON.parse(localStorage.getItem('books') || '[]');
          existingBooks.push(book);
          localStorage.setItem('books', JSON.stringify(existingBooks));

          message.success('电子书上传成功');
          // 刷新页面以显示新上传的书籍
          window.location.reload();
        } catch (error) {
          message.error('文件解析失败');
        }
      };
      reader.readAsText(blob, 'UTF-8');
      return false;
    }
  };

  const handleDeleteBook = (e: React.MouseEvent, bookId: number) => {
    e.stopPropagation();
    const updatedBooks = books.filter((book: Book) => book.id !== bookId);
    localStorage.setItem('books', JSON.stringify(updatedBooks));
    message.success('电子书删除成功');
    window.location.reload();
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>电子书列表</Title>
        <Upload {...uploadProps}>
          <Button type="primary" icon={<UploadOutlined />}>
            上传电子书
          </Button>
        </Upload>
      </div>
      {books.length === 0 ? (
        <Empty
          image={<BookOutlined style={{ fontSize: 64 }} />}
          description="暂无电子书，请先上传"
        />
      ) : (
        <Row gutter={[16, 16]}>
          {books.map((book: Book) => (
            <Col xs={24} sm={12} md={8} lg={6} key={book.id}>
              <Card
                hoverable
                cover={
                  <div
                    style={{
                      height: 200,
                      background: '#f5f5f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <BookOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                  </div>
                }
                onClick={() => handleBookClick(book.id)}
                actions={[
                  <Button
                    type="text"
                    danger
                    onClick={(e) => handleDeleteBook(e, book.id)}
                    icon={<DeleteOutlined />}
                  >
                    删除
                  </Button>
                ]}
              >
                <Card.Meta
                  title={book.title}
                  description={`${book.chapters.length} 章节`}
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default BookList;
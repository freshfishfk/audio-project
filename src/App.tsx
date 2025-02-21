import './App.css'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'
import MainLayout from './layouts/MainLayout'
import AudioList from './pages/AudioList'
import AudioUpload from './pages/AudioUpload'
import AudioBook from './pages/AudioBook'
import EmotionalChat from './pages/EmotionalChat'
import BookList from './pages/BookList'

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/audio-list" element={<AudioList />} />
        <Route path="/audio-upload" element={<AudioUpload />} />
        <Route path="/book-list" element={<BookList />} />
        <Route path="/audio-book" element={<AudioBook />} />
        <Route path="/emotional-chat" element={<EmotionalChat />} />
      </Route>
    </Routes>
  )
}

export default App

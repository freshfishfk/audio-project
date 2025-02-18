import './App.css'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'
import MainLayout from './layouts/MainLayout'
import AudioList from './pages/AudioList'
import AudioUpload from './pages/AudioUpload'
import AudioProcess from './pages/AudioProcess'
import EmotionalChat from './pages/EmotionalChat'

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/audio-list" element={<AudioList />} />
        <Route path="/audio-upload" element={<AudioUpload />} />
        <Route path="/audio-process" element={<AudioProcess />} />
        <Route path="/emotional-chat" element={<EmotionalChat />} />
      </Route>
    </Routes>
  )
}

export default App

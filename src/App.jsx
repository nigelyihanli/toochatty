import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import ModuleSelect from './pages/ModuleSelect'
import Shadowing from './pages/Shadowing'
import ConversationSelect from './pages/ConversationSelect'
import Game2 from './pages/Game2'
import Conversation from './pages/Conversation'
import Feedback from './pages/Feedback'
import Pretest from './pages/Pretest'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/module-select" element={<ProtectedRoute><ModuleSelect /></ProtectedRoute>} />
        <Route path="/shadowing" element={<ProtectedRoute><Shadowing /></ProtectedRoute>} />
        <Route path="/conversation-select" element={<ProtectedRoute><ConversationSelect /></ProtectedRoute>} />
        <Route path="/game2" element={<ProtectedRoute><Game2 /></ProtectedRoute>} />
        <Route path="/conversation" element={<ProtectedRoute><Conversation /></ProtectedRoute>} />
        <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
        <Route path="/pretest" element={<ProtectedRoute><Pretest /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

import { useNavigate } from 'react-router-dom'
import Footer from '../components/Footer'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(to bottom, #e0f2fe, #f0f9ff, #ddeeff, #e8f4fd)' }}>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 pb-8">
        <h1
          className="text-8xl md:text-[9rem] leading-none mb-6"
          style={{ fontFamily: "'Daruma Drop One', cursive", color: '#2F4780' }}
        >
          TooChatty
        </h1>

        <p className="font-mono text-base md:text-lg text-slate-600 mb-10 tracking-tight">
          natural Spanish made easier through practice
        </p>

        <div className="flex gap-3">
          <button
            className="px-9 py-3 text-sm font-semibold border-2 border-indigo-300 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200"
            style={{ color: '#2F4780' }}
          >
            Learn More
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-9 py-3 text-sm font-semibold border-2 border-indigo-300 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200"
            style={{ color: '#2F4780' }}
          >
            Log In
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="px-9 py-3 text-sm font-bold text-white rounded-xl transition-colors hover:opacity-90"
            style={{ backgroundColor: '#2F4780' }}
          >
            Sign Up
          </button>
        </div>
      </div>

      {/* GIF */}
      <div style={{ background: 'transparent', border: 'none', borderRadius: 0, boxShadow: 'none' }}>
        <img
          src="/animation.gif"
          alt=""
          style={{ width: '75%', display: 'block', margin: '0 auto', mixBlendMode: 'multiply' }}
        />
      </div>

      <Footer />
    </div>
  )
}

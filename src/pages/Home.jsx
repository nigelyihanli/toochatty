import { useNavigate } from 'react-router-dom'

function ChalkButton({ children, onClick, rotate = 0, textTilt = -6 }) {
  return (
    <button
      onClick={onClick}
      className="chalk-btn relative px-9 py-4"
      style={{ '--chalk-rotate': `${rotate}deg`, '--chalk-text-tilt': `${textTilt}deg` }}
    >
      <svg
        className="chalk-circle absolute inset-0 w-full h-full"
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
      >
        <path
          d="M 10,22 C 6,10 20,3 42,2 C 68,1 94,4 96,16 C 98,26 88,36 60,38 C 35,40 8,37 5,26 C 4,21 8,20 12,23"
          fill="none"
          stroke="#2F4780"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span
        className="chalk-text relative text-xl md:text-2xl"
        style={{ fontFamily: "'Daruma Drop One', cursive", color: '#2F4780' }}
      >
        {children}
      </span>
    </button>
  )
}

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

        <div className="flex items-center flex-wrap justify-center gap-2">
          <ChalkButton rotate={-1.5} textTilt={-7}>Sign Up</ChalkButton>
          <ChalkButton rotate={1} textTilt={6} onClick={() => navigate('/dashboard')}>Log In</ChalkButton>
          <ChalkButton rotate={-1} textTilt={-5}>Learn More</ChalkButton>
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

    </div>
  )
}

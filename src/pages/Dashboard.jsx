import { useNavigate } from 'react-router-dom'

const stats = [
  {
    label: 'Sessions Completed',
    value: '0',
    bg: 'bg-indigo-50',
    iconBg: 'bg-indigo-600',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    label: 'Vowels Mastered',
    value: '0',
    bg: 'bg-green-50',
    iconBg: 'bg-green-500',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: 'Day Streak',
    value: '0',
    bg: 'bg-amber-50',
    iconBg: 'bg-amber-400',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
]

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <span
          className="text-xl font-black tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          TooChatty
        </span>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600">
            U
          </div>
          <span className="text-sm text-gray-600 font-medium">User Name</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-10">

        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-black text-gray-900">Welcome back 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Keep practicing — every session counts.</p>
        </div>

        {/* Stats */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Your Progress</h2>
          <div className="grid grid-cols-3 gap-4">
            {stats.map(({ label, value, bg, iconBg, icon }) => (
              <div key={label} className={`${bg} rounded-2xl p-5`}>
                <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center mb-4 shadow-sm`}>
                  {icon}
                </div>
                <p className="text-4xl font-black text-gray-900 leading-none">{value}</p>
                <p className="text-xs text-gray-500 mt-2 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Practice modes */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Choose a Mode</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Mode 1 — active */}
            <button
              onClick={() => navigate('/conversation')}
              className="bg-white border-2 border-indigo-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-indigo-400 hover:-translate-y-0.5 transition-all duration-200 text-left group relative overflow-hidden"
            >
              {/* Subtle background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mb-5 shadow-md group-hover:scale-105 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>

                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">Mode 1</span>
                </div>
                <h3 className="font-black text-gray-900 text-base mb-2">Vowel Conversations</h3>
                <p className="text-gray-500 text-xs leading-relaxed">
                  Talk with an AI tutor in Spanish. Get vowel-by-vowel pronunciation scoring after every turn.
                </p>

                <div className="mt-5 flex items-center text-indigo-600 text-xs font-bold gap-1 group-hover:gap-2 transition-all">
                  Start practicing
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>

            {/* Mode 2 — coming soon */}
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
                  Coming Soon
                </span>
              </div>

              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6v1m0 10v1M6.343 7.757l.707.707M16.95 7.757l-.707.707M5 12H4m16 0h-1M7.05 16.243l.707-.707M16.243 16.243l-.707-.707" />
                  <circle cx="12" cy="12" r="3" strokeWidth={2} />
                </svg>
              </div>

              <div className="mb-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mode 2</span>
              </div>
              <h3 className="font-black text-gray-400 text-base mb-2">Shadowing & Listening</h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                Hear native pronunciation and shadow along. Train your ear while refining your output.
              </p>
            </div>

            {/* Pretest — coming soon */}
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
                  Coming Soon
                </span>
              </div>

              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>

              <div className="mb-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pretest</span>
              </div>
              <h3 className="font-black text-gray-400 text-base mb-2">Assess Your Level</h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                Find out which Spanish vowels need the most work before you start practicing.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

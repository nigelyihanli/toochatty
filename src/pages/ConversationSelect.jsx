import { useNavigate } from 'react-router-dom'

export default function ConversationSelect() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #ddeeff, #e8f4fd)' }}>
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4 shadow-sm">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Back"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-black text-gray-900" style={{ fontFamily: "'Daruma Drop One', cursive", color: '#2F4780', fontSize: '24px' }}>Conversation Practice</h1>
          <p className="font-mono text-xs text-gray-400 mt-0.5">Choose your conversation mode</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">

        {/* Game 2 — vocab-constrained */}
        <button
          onClick={() => navigate('/game2')}
          className="w-full bg-white border-2 border-indigo-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-indigo-400 hover:-translate-y-0.5 transition-all duration-200 text-left group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex gap-5 items-start">
            <div className="w-14 h-14 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md flex-shrink-0 group-hover:scale-105 transition-transform">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div className="flex-1">
              <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">Game 2</span>
              <h3 className="font-black text-gray-900 text-lg mt-0.5 mb-1">Practice Phrases</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                A guided conversation using vocabulary from the modules you've already drilled. Great to do right after Shadowing Practice.
              </p>
              <div className="mt-4 flex items-center text-indigo-600 text-xs font-bold gap-1 group-hover:gap-2 transition-all">
                Start guided conversation
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </button>

        {/* Free conversation */}
        <button
          onClick={() => navigate('/conversation')}
          className="w-full bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-gray-400 hover:-translate-y-0.5 transition-all duration-200 text-left group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex gap-5 items-start">
            <div className="w-14 h-14 rounded-xl bg-gray-700 flex items-center justify-center shadow-md flex-shrink-0 group-hover:scale-105 transition-transform">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="flex-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Open Mode</span>
              <h3 className="font-black text-gray-900 text-lg mt-0.5 mb-1">Free Conversation</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                An open-ended AI conversation about any beginner Spanish topic. No vocabulary constraints — just talk.
              </p>
              <div className="mt-4 flex items-center text-gray-600 text-xs font-bold gap-1 group-hover:gap-2 transition-all">
                Start free conversation
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </button>

      </div>
    </div>
  )
}

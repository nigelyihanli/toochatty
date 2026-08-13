import { useNavigate } from 'react-router-dom'

const MODULES = [
  {
    id: 'introductions',
    label: 'Introductions',
    description: 'Greetings, names, what you study or do',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    color: 'bg-sky-400',
    border: 'border-sky-200',
    hover: 'hover:border-sky-400',
    accent: 'text-sky-600',
    glow: 'from-sky-50',
  },
  {
    id: 'common_questions',
    label: 'Common Questions',
    description: 'Everyday phrases — directions, time, help',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'bg-blue-900',
    border: 'border-blue-800',
    hover: 'hover:border-blue-700',
    accent: 'text-blue-800',
    glow: 'from-blue-100',
  },
  {
    id: 'ordering_food',
    label: 'Ordering Food',
    description: 'Restaurant and café phrases',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    color: 'bg-red-500',
    border: 'border-red-200',
    hover: 'hover:border-red-400',
    accent: 'text-red-600',
    glow: 'from-red-50',
  },
  {
    id: 'booking_a_cab',
    label: 'Booking a Cab',
    description: 'Transport and logistics phrases',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    color: 'bg-green-400',
    border: 'border-green-200',
    hover: 'hover:border-green-400',
    accent: 'text-green-600',
    glow: 'from-green-50',
  },
]

export default function ModuleSelect() {
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
          <h1 className="text-lg font-black text-gray-900" style={{fontFamily: "'Daruma Drop One', cursive", color: '#2F4780', fontSize: '27px', lineHeight: 1 }}>Shadowing Practice</h1>
          <p className="font-mono text-xs text-gray-400 mt-0.5" style={{lineHeight: 2}}>Choose a module to drill</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MODULES.map((mod) => (
            <button
              key={mod.id}
              onClick={() => navigate('/shadowing', { state: { moduleId: mod.id, moduleLabel: mod.label } })}
              className={`bg-white border-2 ${mod.border} ${mod.hover} rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-left group relative overflow-hidden`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${mod.glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
              <div className="relative">
                <div className={`w-12 h-12 rounded-xl ${mod.color} flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform`}>
                  {mod.icon}
                </div>
                <h3 className="font-black text-gray-900 text-base mb-1">{mod.label}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{mod.description}</p>
                <div className={`mt-4 flex items-center ${mod.accent} text-xs font-bold gap-1 group-hover:gap-2 transition-all`}>
                  Start module
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

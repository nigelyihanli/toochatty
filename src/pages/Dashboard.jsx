import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Footer from '../components/Footer'

const stats = [
  {
    label: 'Sessions Completed',
    value: '0',
    bg: '#B8E6FC',
    iconBg: '#4EACDE',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    label: 'Vowels Mastered',
    value: '0',
    bg: '#DBFFD6',
    iconBg: '#60CF4E',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: 'Day Streak',
    value: '0',
    bg: '#FFEBE8',
    iconBg: '#F93943',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const isTeacherPreview = location.state?.teacherPreview === true
  const { user, role, signOut } = useAuth()
  const [profileUsername, setProfileUsername] = useState(null)
  const [editOpen, setEditOpen] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editError, setEditError] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [sessionCount, setSessionCount] = useState(0)
  const [vowelsMastered, setVowelsMastered] = useState(0)
  const [dayStreak, setDayStreak] = useState(0)
  const [enrolledClasses, setEnrolledClasses] = useState([])
  const [leavingId, setLeavingId] = useState(null)
  const [joinOpen, setJoinOpen] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)
  const [joinError, setJoinError] = useState(null)
  const [joinSuccess, setJoinSuccess] = useState(null)

  useEffect(() => {
    if (!user?.id) return
    async function loadStats() {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single()
        setProfileUsername(profile?.username || null)

        const { data: allSessions } = await supabase
          .from('sessions')
          .select('vowels_correct, vowels_total')
          .eq('user_id', user.id)

        if (allSessions) {
          setSessionCount(allSessions.length)
          setVowelsMastered(allSessions.reduce((sum, s) => sum + (s.vowels_correct || 0), 0))
        }

        const { data: sessions } = await supabase
          .from('sessions')
          .select('created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        let streak = 0
        if (sessions && sessions.length > 0) {
          const uniqueDates = [...new Set(
            sessions.map(s => new Date(s.created_at).toLocaleDateString())
          )]
          const today = new Date().toLocaleDateString()
          const yesterday = new Date(Date.now() - 86400000).toLocaleDateString()

          if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
            streak = 0
          } else {
            streak = 1
            for (let i = 1; i < uniqueDates.length; i++) {
              const current = new Date(uniqueDates[i - 1])
              const prev = new Date(uniqueDates[i])
              const diffDays = Math.round((current - prev) / 86400000)
              if (diffDays === 1) {
                streak++
              } else {
                break
              }
            }
          }
        }
        setDayStreak(streak)
      } finally {
        setStatsLoading(false)
      }
    }
    loadStats()
  }, [user?.id])

  // Redirect teachers unless they explicitly chose to preview the student view
  useEffect(() => {
    if (role === 'teacher' && !isTeacherPreview) navigate('/teacher-dashboard', { replace: true })
  }, [role])

  // Load enrolled classes
  useEffect(() => {
    if (!user?.id) return
    loadClasses()
  }, [user?.id])

  async function loadClasses() {
    const { data } = await supabase
      .from('enrollments')
      .select('id, classes(id, name, code)')
      .eq('student_id', user.id)
    if (data) {
      setEnrolledClasses(data.map(e => ({
        enrollmentId: e.id,
        id: e.classes?.id,
        name: e.classes?.name,
        code: e.classes?.code,
      })).filter(c => c.id))
    }
  }

  async function handleJoinClass() {
    setJoinError(null)
    setJoinSuccess(null)
    const code = joinCode.trim().toUpperCase()
    if (!code) { setJoinError('Enter a class code.'); return }
    setJoinLoading(true)

    const { data: classData } = await supabase
      .from('classes')
      .select('*')
      .eq('class_code', code)
      .single()

    if (!classData) {
      setJoinError('Class code not found. Please check and try again.')
      setJoinLoading(false)
      return
    }

    const { data: existing } = await supabase
      .from('enrollments')
      .select('*')
      .eq('student_id', user.id)
      .eq('class_id', classData.id)

    if (existing?.length > 0) {
      setJoinError('You are already in this class!')
      setJoinLoading(false)
      return
    }

    const { data: newEnrollment, error } = await supabase
      .from('enrollments')
      .insert({ student_id: user.id, class_id: classData.id })
      .select('id')
      .single()

    setJoinLoading(false)
    if (error) {
      setJoinError('Could not join class. Please try again.')
    } else {
      setJoinSuccess(`You joined ${classData.name}!`)
      setEnrolledClasses(prev => [...prev, {
        enrollmentId: newEnrollment?.id,
        id: classData.id,
        name: classData.name,
        code: classData.code,
      }])
      setJoinCode('')
      setTimeout(() => setJoinOpen(false), 2000)
    }
  }

  async function handleLeaveClass(enrollmentId) {
    setLeavingId(enrollmentId)
    await supabase.from('enrollments').delete().eq('id', enrollmentId)
    setEnrolledClasses(prev => prev.filter(c => c.enrollmentId !== enrollmentId))
    setLeavingId(null)
  }

  const displayName = profileUsername || user?.user_metadata?.username || user?.user_metadata?.full_name || user?.email

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  function openEdit() {
    setNewUsername(profileUsername || user?.user_metadata?.username || '')
    setEditError(null)
    setSaved(false)
    setEditOpen(true)
  }

  async function handleSave() {
    const trimmed = newUsername.trim()
    if (trimmed.length < 3) { setEditError('Username must be at least 3 characters.'); return }
    if (/\s/.test(trimmed)) { setEditError('Username cannot contain spaces.'); return }
    setSaving(true)
    setEditError(null)
    const { error } = await supabase.auth.updateUser({ data: { username: trimmed } })
    if (error) { setSaving(false); setEditError(error.message); return }
    await supabase.from('profiles').update({ username: trimmed }).eq('id', user.id)
    setProfileUsername(trimmed)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setEditOpen(false), 1200)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(to bottom, #ddeeff, #e8f4fd)' }}>

      {/* Teacher preview banner */}
      {isTeacherPreview && (
        <div className="flex items-center justify-between px-5 py-2.5 text-sm text-white" style={{ backgroundColor: '#2F4780' }}>
          <span style={{ fontFamily: "'Jua', sans-serif" }}>Previewing student view</span>
          <button
            onClick={() => navigate('/teacher-dashboard')}
            className="flex items-center gap-1.5 text-xs font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            ← Back to Teacher Dashboard
          </button>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <span style={{ fontFamily: "'Daruma Drop One', cursive", color: '#2F4780', fontSize: '30px', lineHeight: 1 }}>
          TooChatty
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={openEdit}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            title="Edit profile"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: '#2F4780' }}>
              {(displayName || 'U')[0].toUpperCase()}
            </div>
            <span className="text-sm text-gray-600 hidden sm:block" style={{ fontFamily: "'Jua', sans-serif" }}>
              {displayName}
            </span>
          </button>
          <button
            onClick={handleSignOut}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border-2 transition-colors hover:bg-blue-50"
            style={{ color: '#2F4780', borderColor: '#2F4780' }}
          >
            Log Out
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '1100px', margin: '0 0 0 24px', padding: '32px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>

          {/* Left — GIF, hidden below 1024px */}
          <div className="hidden lg:block" style={{ width: '350px', flexShrink: 0, alignSelf: 'flex-start', marginTop: '320px' }}>
            <img
              src="/Untitled_Artwork.gif"
              alt=""
              style={{ width: '500px', display: 'block', mixBlendMode: 'multiply' }}
            />
          </div>

          {/* Right — all existing content */}
          <div style={{ flex: 1, minWidth: 0 }} className="space-y-10">

            {/* Welcome */}
            <div>
              <h1 className="text-2xl font-black" style={{ fontFamily: "'Jua', sans-serif", fontSize: '30px', color: '#2F4780'}}>Welcome back!</h1>
              <p className="font-mono text-gray-500 text-sm mt-1" style={{ fontFamily: "'Jua', sans-serif", fontSize: '18px'}}>Keep practicing — Vas a ser un maestro</p>
            </div>

            {/* Stats */}
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Your Progress</h2>
              <div className="grid grid-cols-3 gap-4">
                {stats.map(({ label, bg, iconBg, icon }, idx) => {
                  const liveValues = [sessionCount, vowelsMastered, dayStreak]
                  return (
                    <div key={label} className="rounded-2xl p-5" style={{ backgroundColor: bg }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 shadow-sm" style={{ backgroundColor: iconBg }}>
                        {icon}
                      </div>
                      <p className="text-4xl font-black text-gray-900 leading-none">
                        {statsLoading ? '…' : liveValues[idx]}
                      </p>
                      <p className="text-xs text-gray-500 mt-2 font-medium">{label}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Practice modes */}
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Choose a Mode</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Mode 1 — Shadowing */}
                <button
                  onClick={() => navigate('/module-select')}
                  className="bg-white border-2 border-indigo-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-blue-400 hover:-translate-y-0.5 transition-all duration-200 text-left group relative overflow-hidden"
                  style={{borderColor: '#4EACDE'}}>
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mb-5 shadow-md group-hover:scale-105 transition-transform" style={{ backgroundColor: '#4EACDE'}}>
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </div>
                    <div className="mb-1">
                      <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider" style={{color: '#4EACDE'}}>Mode 1</span>
                    </div>
                    <h3 className="font-black text-gray-900 text-base mb-2">Shadowing Practice</h3>
                    <p className="text-gray-500 text-xs leading-relaxed">
                      See an English phrase, speak the Spanish translation. Get vowel-by-vowel feedback after each attempt.
                    </p>
                    <div className="mt-5 flex items-center text-indigo-600 text-xs font-bold gap-1 group-hover:gap-2 transition-all" style={{color: '#4EACDE'}}>
                      Choose a module
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Mode 2 — Conversation */}
                <button
                  onClick={() => navigate('/conversation-select')}
                  className="bg-white border-2 border-violet-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-green-200 hover:-translate-y-0.5 transition-all duration-200 text-left group relative overflow-hidden"
                style={{borderColor: '#C3F3C0'}}>
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 shadow-md group-hover:scale-105 transition-transform" style={{ backgroundColor: '#60CF4E'}}>
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div className="mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{color: '#60CF4E'}}>Mode 2</span>
                    </div>
                    <h3 className="font-black text-gray-900 text-base mb-2">Conversation Practice</h3>
                    <p className="text-gray-500 text-xs leading-relaxed">
                      Hold-to-talk conversations with an AI tutor. Choose guided phrases or free conversation.
                    </p>
                    <div className="mt-5 flex items-center text-xs font-bold gap-1 group-hover:gap-2 transition-all" style={{color:'#60CF4E'}}>
                      Choose conversation mode
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Pretest */}
                <button
                  onClick={() => navigate('/pretest')}
                  className="bg-white border-2 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-left group relative overflow-hidden"
                  style={{ borderColor: '#FFCDD2' }}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(135deg, #fff5f5, transparent)' }} />
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 shadow-md group-hover:scale-105 transition-transform" style={{ backgroundColor: '#F93943' }}>
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <div className="mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#F93943' }}>Pretest</span>
                    </div>
                    <h3 className="font-black text-gray-900 text-base mb-2">Assess Your Level</h3>
                    <p className="text-gray-500 text-xs leading-relaxed">
                      Read a short Spanish paragraph aloud and get vowel-by-vowel scoring to see where to focus.
                    </p>
                    <div className="mt-5 flex items-center text-xs font-bold gap-1 group-hover:gap-2 transition-all" style={{ color: '#F93943' }}>
                      Start pretest
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>

              </div>
            </div>

            {/* Enrolled Classes */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">My Classes</h2>
                <button
                  onClick={() => { setJoinOpen(true); setJoinError(null); setJoinSuccess(null); setJoinCode('') }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#2F4780' }}
                >
                  + Join a Class
                </button>
              </div>
              {enrolledClasses.length === 0 ? (
                <p className="text-sm text-gray-400 py-2" style={{ fontFamily: "'Jua', sans-serif" }}>
                  No classes yet — ask your teacher for a class code.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {enrolledClasses.map(cls => (
                    <div key={cls.enrollmentId} className="bg-white border border-gray-200 rounded-2xl px-4 py-4 shadow-sm flex flex-col gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-800" style={{ fontFamily: "'Jua', sans-serif" }}>{cls.name}</p>
                        {cls.code && <p className="text-xs text-gray-400 font-mono mt-0.5 tracking-widest">{cls.code}</p>}
                      </div>
                      <button
                        onClick={() => handleLeaveClass(cls.enrollmentId)}
                        disabled={leavingId === cls.enrollmentId}
                        className="mt-auto text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40 self-start"
                      >
                        {leavingId === cls.enrollmentId ? 'Leaving…' : 'Leave Class'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Join a Class Modal */}
      {joinOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          onClick={e => { if (e.target === e.currentTarget) setJoinOpen(false) }}
        >
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 style={{ fontFamily: "'Jua', sans-serif", color: '#2F4780', fontSize: '20px' }}>Join a Class</h2>
              <button onClick={() => setJoinOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500">Enter the 6-character class code your teacher shared with you.</p>
            <input
              type="text"
              value={joinCode}
              onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinError(null); setJoinSuccess(null) }}
              onKeyDown={e => e.key === 'Enter' && handleJoinClass()}
              placeholder="e.g. ABC123"
              maxLength={6}
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-mono text-lg text-center tracking-widest focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
            />
            {joinError && <p className="text-red-600 text-sm">{joinError}</p>}
            {joinSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <p className="text-green-700 text-sm font-semibold">{joinSuccess}</p>
                <p className="text-green-600 text-xs mt-0.5">Closing automatically…</p>
              </div>
            )}
            {!joinSuccess && (
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => { setJoinOpen(false); setJoinError(null); setJoinCode('') }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors hover:bg-gray-50"
                  style={{ color: '#2F4780', borderColor: '#2F4780' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinClass}
                  disabled={joinLoading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#2F4780' }}
                >
                  {joinLoading ? 'Joining…' : 'Join'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          onClick={e => { if (e.target === e.currentTarget) setEditOpen(false) }}
        >
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-gray-900 text-base" style={{ fontFamily: "'Jua', sans-serif", color: '#2F4780', fontSize: '20px' }}>
                Edit Profile
              </h2>
              <button onClick={() => setEditOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Username</label>
              <input
                type="text"
                value={newUsername}
                onChange={e => { setNewUsername(e.target.value); setEditError(null); setSaved(false) }}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                placeholder="coollearner"
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            {editError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                <p className="text-red-600 text-sm">{editError}</p>
              </div>
            )}

            {saved && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2">
                <p className="text-green-700 text-sm font-semibold">Saved!</p>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setEditOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors hover:bg-gray-50"
                style={{ color: '#2F4780', borderColor: '#2F4780' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#2F4780' }}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

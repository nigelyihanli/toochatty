import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Footer from '../components/Footer'

const TABS = ['Classes', 'Students', 'Content', 'Settings']

const MODULE_OPTIONS = [
  { id: 'introductions', label: 'Introductions' },
  { id: 'common_questions', label: 'Common Questions' },
  { id: 'ordering_food', label: 'Ordering Food' },
  { id: 'booking_a_cab', label: 'Booking a Cab' },
]

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

function Spinner() {
  return (
    <div className="flex justify-center py-8">
      <div className="w-7 h-7 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#2F4780', borderTopColor: 'transparent' }} />
    </div>
  )
}

// ─── Classes Tab ──────────────────────────────────────────────────────────────

function ClassesTab({ user }) {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState(null)
  const [copied, setCopied] = useState(null)
  const [enrollmentCounts, setEnrollmentCounts] = useState({})

  useEffect(() => { loadClasses() }, [])

  async function loadClasses() {
    setLoading(true)
    const { data } = await supabase.from('classes').select('*').eq('teacher_id', user.id).order('created_at', { ascending: false })
    if (data) {
      setClasses(data)
      if (data.length) {
        const { data: enrollments } = await supabase
          .from('enrollments').select('class_id').in('class_id', data.map(c => c.id))
        if (enrollments) {
          const counts = {}
          enrollments.forEach(e => { counts[e.class_id] = (counts[e.class_id] || 0) + 1 })
          setEnrollmentCounts(counts)
        }
      }
    }
    setLoading(false)
  }

  async function createClass() {
    if (!newName.trim()) { setCreateError('Enter a class name.'); return }
    setCreating(true)
    setCreateError(null)
    console.log('Creating class...')

    const { data: { user: currentUser } } = await supabase.auth.getUser()
    console.log('Teacher user ID:', currentUser?.id)

    let code, tries = 0
    while (tries < 5) {
      code = generateCode()
      const { data: existing } = await supabase.from('classes').select('id').eq('class_code', code).single()
      if (!existing) break
      tries++
    }
    console.log('Generated class code:', code)

    const { data, error } = await supabase.from('classes').insert({
      teacher_id: currentUser.id,
      class_name: newName.trim(),
      class_code: code,
    })
    console.log('Insert result:', data)
    console.log('Insert error:', error)

    if (error) setCreateError('Could not create class. Try again.')
    else { setNewName(''); loadClasses() }
    setCreating(false)
  }

  function copyCode(code) {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  function inviteByEmail(cls) {
    const subject = encodeURIComponent(`Join my Spanish class on TooChatty`)
    const body = encodeURIComponent(`Hi!\n\nI'd like you to join my Spanish pronunciation class on TooChatty.\n\nClass: ${cls.class_name}\nClass Code: ${cls.class_code}\n\nGo to TooChatty, sign in, and click "Join a Class" on your dashboard. Enter the code above.\n\nSee you there!`)
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  return (
    <div className="space-y-8">
      {/* Create new class */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-semibold text-gray-700 mb-4" style={{ fontFamily: "'Jua', sans-serif", fontSize: '18px', color: '#2F4780' }}>
          Create New Class
        </h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={newName}
            onChange={e => { setNewName(e.target.value); setCreateError(null) }}
            onKeyDown={e => e.key === 'Enter' && createClass()}
            placeholder="e.g. Spanish 101 — Period 3"
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
          />
          <button
            onClick={createClass}
            disabled={creating}
            className="px-5 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
            style={{ backgroundColor: '#2F4780' }}
          >
            {creating ? 'Creating…' : '+ Create Class'}
          </button>
        </div>
        {createError && <p className="text-red-600 text-sm mt-2">{createError}</p>}
      </div>

      {/* Class list */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
          Your Classes ({classes.length})
        </h3>
        {loading ? <Spinner /> : classes.length === 0 ? (
          <p className="text-gray-400 text-sm py-4">No classes yet — create one above.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map(cls => (
              <div key={cls.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
                <div>
                  <p className="font-semibold text-gray-800 text-sm" style={{ fontFamily: "'Jua', sans-serif" }}>{cls.class_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {enrollmentCounts[cls.id] || 0} student{enrollmentCounts[cls.id] !== 1 ? 's' : ''} · {new Date(cls.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="flex-1 text-center font-mono text-2xl font-black tracking-widest rounded-xl py-2"
                    style={{ color: '#2F4780', backgroundColor: '#e8f0fc' }}
                  >
                    {cls.class_code}
                  </span>
                  <button
                    onClick={() => copyCode(cls.class_code)}
                    title="Copy code"
                    className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    {copied === cls.class_code ? (
                      <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
                <button
                  onClick={() => inviteByEmail(cls)}
                  className="w-full text-xs font-semibold py-2 rounded-xl border-2 transition-colors hover:bg-blue-50"
                  style={{ color: '#2F4780', borderColor: '#2F4780' }}
                >
                  Invite by Email
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Students Tab ─────────────────────────────────────────────────────────────

function StudentsTab({ user }) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [removing, setRemoving] = useState(null)

  useEffect(() => { loadStudents() }, [])

  async function loadStudents() {
    setLoading(true)

    const { data: teacherClasses } = await supabase
      .from('classes')
      .select('id, class_name, class_code')
      .eq('teacher_id', user.id)
    console.log('Teacher classes:', teacherClasses)

    const classIds = teacherClasses?.map(c => c.id) || []
    console.log('Class IDs:', classIds)
    if (!classIds.length) { setStudents([]); setLoading(false); return }

    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select('id, joined_at, student_id, class_id, classes(class_name, class_code)')
      .in('class_id', classIds)
    console.log('Raw enrollments:', enrollments, 'Error:', error)
    if (!enrollments?.length) { setStudents([]); setLoading(false); return }

    const studentIds = [...new Set(enrollments.map(e => e.student_id))]
    console.log('Student IDs:', studentIds)

    const { data: studentProfiles } = await supabase
      .from('profiles')
      .select('id, username, email')
      .in('id', studentIds)
    console.log('Student profiles:', studentProfiles)

    const { data: allSessions } = await supabase
      .from('sessions')
      .select('user_id, vowels_correct, vowels_total, created_at')
      .in('user_id', studentIds)
    console.log('All sessions:', allSessions)

    const profileMap = Object.fromEntries((studentProfiles || []).map(p => [p.id, p]))

    const rows = enrollments.map(enrollment => {
      const profile = profileMap[enrollment.student_id]
      const studentSessions = (allSessions || [])
        .filter(s => s.user_id === enrollment.student_id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      const sessionsCompleted = studentSessions.length
      const totalCorrect = studentSessions.reduce((sum, s) => sum + (s.vowels_correct || 0), 0)
      const totalVowels = studentSessions.reduce((sum, s) => sum + (s.vowels_total || 0), 0)
      const accuracy = totalVowels > 0 ? Math.round((totalCorrect / totalVowels) * 100) + '%' : '—'
      return {
        id: enrollment.student_id,
        enrollmentId: enrollment.id,
        username: profile?.username || 'No username set',
        email: profile?.email || '—',
        className: enrollment.classes?.class_name || '—',
        sessionsCompleted,
        accuracy,
        lastActive: studentSessions[0]?.created_at || enrollment.joined_at,
        sessionRows: studentSessions.slice(0, 5),
      }
    })

    console.log('Final students array:', rows)
    setStudents(rows)
    setLoading(false)
  }

  async function removeStudent(enrollmentId) {
    setRemoving(enrollmentId)
    await supabase.from('enrollments').delete().eq('id', enrollmentId)
    setStudents(prev => prev.filter(s => s.enrollmentId !== enrollmentId))
    setRemoving(null)
  }

  console.log('Rendering students:', students)

  const q = search.toLowerCase()
  const filtered = students.filter(s =>
    (s.username || '').toLowerCase().includes(q) ||
    (s.email || '').toLowerCase().includes(q) ||
    (s.className || '').toLowerCase().includes(q)
  )

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by name, email, or class…"
        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
      />
      {loading ? <Spinner /> : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <p className="text-gray-400 text-sm">{students.length === 0 ? 'No students enrolled yet.' : 'No results match your search.'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Username', 'Email', 'Class', 'Sessions', 'Accuracy', 'Last Active', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <React.Fragment key={s.enrollmentId}>
                    <tr
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setExpanded(expanded === s.enrollmentId ? null : s.enrollmentId)}
                    >
                      <td className="px-4 py-3 font-semibold text-gray-800" style={{ fontFamily: "'Jua', sans-serif" }}>{s.username}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{s.email}</td>
                      <td className="px-4 py-3 text-gray-600">{s.className}</td>
                      <td className="px-4 py-3 text-gray-700 font-mono">{s.sessionsCompleted}</td>
                      <td className="px-4 py-3">
                        {s.accuracy !== '—' ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden" style={{ minWidth: '48px' }}>
                              <div
                                className="h-full rounded-full"
                                style={{ width: s.accuracy, backgroundColor: parseInt(s.accuracy) >= 70 ? '#60CF4E' : parseInt(s.accuracy) >= 40 ? '#F59E0B' : '#F93943' }}
                              />
                            </div>
                            <span className="text-xs font-mono text-gray-600">{s.accuracy}</span>
                          </div>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{new Date(s.lastActive).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <svg className={`w-4 h-4 text-gray-300 transition-transform ${expanded === s.enrollmentId ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </td>
                    </tr>
                    {expanded === s.enrollmentId && (
                      <tr key={`${s.enrollmentId}-expand`} className="bg-blue-50">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="space-y-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Sessions</p>
                            {s.sessionRows.length === 0 ? (
                              <p className="text-xs text-gray-400">No sessions recorded yet.</p>
                            ) : (
                              <div className="space-y-1">
                                {s.sessionRows.map((sr, i) => {
                                  const acc = sr.vowels_total > 0 ? Math.round((sr.vowels_correct / sr.vowels_total) * 100) : 0
                                  return (
                                    <div key={i} className="flex items-center gap-4 text-xs">
                                      <span className="text-gray-400 w-24">{new Date(sr.created_at).toLocaleDateString()}</span>
                                      <span className="text-gray-600">{sr.vowels_correct}/{sr.vowels_total} vowels correct</span>
                                      <span className="font-mono font-semibold" style={{ color: acc >= 70 ? '#60CF4E' : acc >= 40 ? '#F59E0B' : '#F93943' }}>{acc}%</span>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                            <button
                              onClick={e => { e.stopPropagation(); removeStudent(s.enrollmentId) }}
                              disabled={removing === s.enrollmentId}
                              className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              {removing === s.enrollmentId ? 'Removing…' : 'Remove from Class'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Content Tab ──────────────────────────────────────────────────────────────

const DEFAULT_PARAGRAPH = 'Me llamo Salome y tengo once años.\n\nCada domingo, voy a la playa con mi familia.\n\nMi madre me ayuda a construir un castillo en la\n\narena. Después, nado en el océano con mi\n\npadre. Mi hermano Tomás y yo jugamos con\n\nun disco volador. Después de eso, mi familia\n\ntiene un picnic. Comemos hamburguesas,\n\nmanzanas, y papas fritas. Después del almuerzo, yo corro en la\n\nplaya y escucho la música.'

function ContentTab({ user }) {
  const [paragraph, setParagraph] = useState('')
  const [paraLoading, setParaLoading] = useState(true)
  const [editingPara, setEditingPara] = useState(false)
  const [paraDraft, setParaDraft] = useState('')
  const [paraSaving, setParaSaving] = useState(false)
  const [paraSaved, setParaSaved] = useState(false)

  const [selectedModule, setSelectedModule] = useState('introductions')
  const [phrasesMap, setPhrasesMap] = useState({})
  const [phrasesLoading, setPhrasesLoading] = useState(false)
  const [newEnglish, setNewEnglish] = useState('')
  const [newSpanish, setNewSpanish] = useState('')
  const [phrasesSaving, setPhrasesSaving] = useState(false)
  const [phraseError, setPhraseError] = useState(null)

  useEffect(() => { loadParagraph() }, [])
  useEffect(() => { loadPhrases(selectedModule) }, [selectedModule])

  async function loadParagraph() {
    setParaLoading(true)
    const { data } = await supabase.from('content').select('value').eq('key', 'pretest_paragraph').single()
    setParagraph(data?.value || DEFAULT_PARAGRAPH)
    setParaLoading(false)
  }

  async function saveParagraph() {
    setParaSaving(true)
    const { error } = await supabase.from('content').upsert(
      { key: 'pretest_paragraph', value: paraDraft.trim(), updated_by: user.id, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )
    setParaSaving(false)
    if (!error) {
      setParagraph(paraDraft.trim())
      setEditingPara(false)
      setParaSaved(true)
      setTimeout(() => setParaSaved(false), 2500)
    }
  }

  async function loadPhrases(moduleId) {
    setPhrasesLoading(true)
    const { data } = await supabase.from('content').select('value').eq('key', `phrases_${moduleId}`).single()
    setPhrasesMap(prev => ({
      ...prev,
      [moduleId]: data?.value ? JSON.parse(data.value) : [],
    }))
    setPhrasesLoading(false)
  }

  async function addPhrase() {
    if (!newEnglish.trim() || !newSpanish.trim()) { setPhraseError('Fill in both English and Spanish.'); return }
    setPhraseError(null)
    setPhrasesSaving(true)
    const currentPhrases = phrasesMap[selectedModule] || []
    const updated = [...currentPhrases, { english: newEnglish.trim(), spanish: newSpanish.trim() }]
    const { error } = await supabase.from('content').upsert(
      { key: `phrases_${selectedModule}`, value: JSON.stringify(updated), updated_by: user.id, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )
    setPhrasesSaving(false)
    if (!error) {
      setPhrasesMap(prev => ({ ...prev, [selectedModule]: updated }))
      setNewEnglish('')
      setNewSpanish('')
    }
  }

  async function deletePhrase(idx) {
    const currentPhrases = phrasesMap[selectedModule] || []
    const updated = currentPhrases.filter((_, i) => i !== idx)
    await supabase.from('content').upsert(
      { key: `phrases_${selectedModule}`, value: JSON.stringify(updated), updated_by: user.id, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )
    setPhrasesMap(prev => ({ ...prev, [selectedModule]: updated }))
  }

  const currentPhrases = phrasesMap[selectedModule] || []

  return (
    <div className="space-y-8">
      {/* Pretest Paragraph */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontFamily: "'Jua', sans-serif", fontSize: '18px', color: '#2F4780' }}>Pretest Paragraph</h3>
          <div className="flex items-center gap-3">
            {paraSaved && <span className="text-green-600 text-xs font-semibold">Saved!</span>}
            {!editingPara ? (
              <button
                onClick={() => { setParaDraft(paragraph); setEditingPara(true) }}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border-2 transition-colors hover:bg-blue-50"
                style={{ color: '#2F4780', borderColor: '#2F4780' }}
              >
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setEditingPara(false)} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">Cancel</button>
                <button
                  onClick={saveParagraph}
                  disabled={paraSaving}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
                  style={{ backgroundColor: '#2F4780' }}
                >
                  {paraSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            )}
          </div>
        </div>
        {paraLoading ? <Spinner /> : editingPara ? (
          <textarea
            value={paraDraft}
            onChange={e => setParaDraft(e.target.value)}
            rows={8}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all resize-y font-mono"
          />
        ) : (
          <p className="text-sm text-gray-700 leading-8 whitespace-pre-line">{paragraph}</p>
        )}
      </div>

      {/* Shadowing Phrases */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="mb-4" style={{ fontFamily: "'Jua', sans-serif", fontSize: '18px', color: '#2F4780' }}>Shadowing Phrases</h3>
        <div className="flex items-center gap-3 mb-5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Module:</label>
          <select
            value={selectedModule}
            onChange={e => setSelectedModule(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          >
            {MODULE_OPTIONS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>

        {phrasesLoading ? <Spinner /> : (
          <>
            {currentPhrases.length === 0 ? (
              <p className="text-sm text-gray-400 mb-4 italic">No custom phrases — students see AI-generated phrases. Add phrases below to override.</p>
            ) : (
              <div className="space-y-2 mb-5">
                {currentPhrases.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5">
                    <span className="text-xs text-gray-400 font-mono w-5">{i + 1}</span>
                    <div className="flex-1 grid grid-cols-2 gap-4 text-sm">
                      <span className="text-gray-500">{p.english}</span>
                      <span className="text-gray-800 font-medium">{p.spanish}</span>
                    </div>
                    <button
                      onClick={() => deletePhrase(i)}
                      className="text-red-400 hover:text-red-600 transition-colors p-1"
                      title="Delete phrase"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Add Phrase</p>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newEnglish}
                  onChange={e => { setNewEnglish(e.target.value); setPhraseError(null) }}
                  placeholder="English"
                  className="px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
                <input
                  type="text"
                  value={newSpanish}
                  onChange={e => { setNewSpanish(e.target.value); setPhraseError(null) }}
                  placeholder="Spanish"
                  className="px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  onKeyDown={e => e.key === 'Enter' && addPhrase()}
                />
              </div>
              {phraseError && <p className="text-red-600 text-xs">{phraseError}</p>}
              <button
                onClick={addPhrase}
                disabled={phrasesSaving}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#2F4780' }}
              >
                {phrasesSaving ? 'Adding…' : '+ Add Phrase'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab({ user, signOut }) {
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState(user?.user_metadata?.username || user?.user_metadata?.full_name || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    if (!displayName.trim()) return
    setSaving(true)
    await supabase.auth.updateUser({ data: { username: displayName.trim() } })
    await supabase.from('profiles').update({ username: displayName.trim() }).eq('id', user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="max-w-md space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h3 style={{ fontFamily: "'Jua', sans-serif", fontSize: '18px', color: '#2F4780' }}>Profile</h3>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
          <p className="text-sm text-gray-700 font-mono bg-gray-50 px-4 py-3 rounded-xl border border-gray-100">{user?.email}</p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={e => { setDisplayName(e.target.value); setSaved(false) }}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>
        {saved && <p className="text-green-600 text-sm font-semibold">Saved!</p>}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#2F4780' }}
        >
          {saving ? 'Saving…' : 'Update Display Name'}
        </button>
      </div>
      <button
        onClick={handleSignOut}
        className="w-full py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors hover:bg-red-50"
        style={{ color: '#F93943', borderColor: '#F93943' }}
      >
        Log Out
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TeacherDashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Classes')

  const displayName = user?.user_metadata?.username || user?.user_metadata?.full_name || user?.email

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(to bottom, #ddeeff, #e8f4fd)' }}>

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <span style={{ fontFamily: "'Daruma Drop One', cursive", color: '#2F4780', fontSize: '28px', lineHeight: 1 }}>
            TooChatty
          </span>
          <span className="text-xs font-semibold px-2 py-1 rounded-lg text-white" style={{ backgroundColor: '#2F4780' }}>
            Teacher
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 hidden sm:block" style={{ fontFamily: "'Jua', sans-serif" }}>
            {displayName}
          </span>
          <button
            onClick={() => navigate('/dashboard', { state: { teacherPreview: true } })}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border-2 transition-colors hover:bg-blue-50"
            style={{ color: '#2F4780', borderColor: '#2F4780' }}
            title="Preview the student-facing dashboard"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Student View
          </button>
          <button
            onClick={async () => { await signOut(); window.location.href = '/' }}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border-2 transition-colors hover:bg-blue-50"
            style={{ color: '#2F4780', borderColor: '#2F4780' }}
          >
            Log Out
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-100 px-6">
        <nav className="flex gap-0 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-5 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors"
              style={{
                borderBottomColor: activeTab === tab ? '#2F4780' : 'transparent',
                color: activeTab === tab ? '#2F4780' : '#9ca3af',
              }}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'Classes'  && <ClassesTab user={user} />}
        {activeTab === 'Students' && <StudentsTab user={user} />}
        {activeTab === 'Content'  && <ContentTab user={user} />}
        {activeTab === 'Settings' && <SettingsTab user={user} signOut={signOut} />}
      </main>

      <Footer />
    </div>
  )
}

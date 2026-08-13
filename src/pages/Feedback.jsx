import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

// ─── Shared vowel logic (mirrors Conversation.jsx) ───────────────────────────

const VOWEL_SET = new Set(['a', 'e', 'i', 'o', 'u'])

function VowelWord({ word, vowels }) {
  const [openTip, setOpenTip] = useState(null)

  let vi = 0
  const chars = word.split('').map((char, i) => {
    if (VOWEL_SET.has(char.toLowerCase())) {
      const feedback = vowels[vi] ?? null
      vi++
      return { char, i, feedback }
    }
    return { char, i, feedback: null }
  })

  return (
    <span className="font-medium">
      {chars.map(({ char, i, feedback }) => {
        if (feedback?.status === 'correct')
          return <span key={i} className="text-green-500 font-bold">{char}</span>
        if (feedback?.status === 'needs_work')
          return (
            <span key={i} className="relative inline-block">
              <span
                className="text-red-500 font-bold cursor-pointer"
                onClick={() => setOpenTip(openTip === i ? null : i)}
              >
                {char}
              </span>
              {openTip === i && feedback.tip && (
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 px-2 py-1.5 bg-gray-900 text-white text-xs rounded-lg leading-snug z-20 shadow-lg pointer-events-none">
                  {feedback.tip}
                  <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                </span>
              )}
            </span>
          )
        return <span key={i}>{char}</span>
      })}
    </span>
  )
}

// ─── Score circle ─────────────────────────────────────────────────────────────

function ScoreCircle({ pct }) {
  const r = 52, cx = 60, cy = 60
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct / 100)
  const color = pct >= 75 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <svg viewBox="0 0 120 120" width="152" height="152">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none" stroke={color} strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize="26" fontWeight="bold" fill="#111827">{pct}%</text>
      <text x={cx} y={cy + 13} textAnchor="middle" fontSize="11" fill="#6b7280">correct</text>
    </svg>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calculateScore(feedbackResults) {
  let correct = 0, total = 0
  feedbackResults.forEach(fb => {
    fb.words?.forEach(w => {
      w.vowels?.forEach(v => {
        total++
        if (v.status === 'correct') correct++
      })
    })
  })
  return { correct, total, pct: total > 0 ? Math.round((correct / total) * 100) : 0 }
}

function buildTranscript(messages) {
  const lines = []
  let currentQ = null
  messages.forEach(msg => {
    if (msg.type === 'ai-question') currentQ = msg.spoken_prompt
    if (msg.type === 'feedback' && currentQ) {
      lines.push(`AI: "${currentQ}" → User: "${msg.userTranscript}"`)
      currentQ = null
    }
  })
  return lines.join('\n') || 'No conversation recorded.'
}

async function fetchTopTips(transcript) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 400,
      messages: [
        {
          role: 'system',
          content:
            'You are a Spanish pronunciation coach. Return ONLY a valid JSON array of exactly 3 strings. Each string must be a concise, actionable English tip about improving Spanish vowel pronunciation, based on the session transcript provided. No prose, no markdown, no explanation — just the raw JSON array.',
        },
        {
          role: 'user',
          content: `Session transcript:\n${transcript}\n\nReturn the 3 most important pronunciation tips as a JSON array of 3 strings.`,
        },
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API error ${res.status}`)
  }

  const data = await res.json()
  const raw = data.choices[0].message.content.replace(/```json\n?|```\n?/g, '').trim()
  return JSON.parse(raw)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Feedback() {
  const location = useLocation()
  const navigate = useNavigate()
  const { messages = [], feedbackResults = [], turnCount = 0 } = location.state ?? {}

  const [tips, setTips] = useState(null)
  const [tipsLoading, setTipsLoading] = useState(false)
  const [tipsError, setTipsError] = useState(null)

  const { correct, total, pct } = calculateScore(feedbackResults)
  const hasSession = feedbackResults.length > 0

  useEffect(() => {
    if (!hasSession) return
    setTipsLoading(true)
    fetchTopTips(buildTranscript(messages))
      .then(setTips)
      .catch(err => setTipsError(err.message))
      .finally(() => setTipsLoading(false))
  }, [])

  if (!hasSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ background: 'linear-gradient(to bottom, #ddeeff, #e8f4fd)' }}>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-lg w-full text-center space-y-4">
          <p className="text-gray-500">No session data found. Complete a conversation first!</p>
          <button
            onClick={() => navigate('/conversation')}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            Start Conversation
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #ddeeff, #e8f4fd)' }}>
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-black" style={{ fontFamily: "'Daruma Drop One', cursive", color: '#2F4780' }}>Session Feedback</h1>
        <p className="font-mono text-sm text-gray-500">{turnCount} turn{turnCount !== 1 ? 's' : ''} completed</p>
      </header>

      <div className="max-w-lg mx-auto px-6 py-6 space-y-6">

        {/* Overall score */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-800">Overall Score</h2>
          <ScoreCircle pct={pct} />
          <p className="text-gray-500 text-sm">{correct} / {total} vowels correct</p>
        </div>

        {/* Top 3 tips */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Tips for You</h2>
          {tipsLoading && (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <svg className="w-4 h-4 animate-spin flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Analyzing your session…
            </div>
          )}
          {tipsError && (
            <p className="text-red-500 text-sm">Could not load tips: {tipsError}</p>
          )}
          {tips && (
            <div className="space-y-3">
              {tips.map((tip, i) => (
                <div key={i} className="flex gap-3 p-3 bg-indigo-50 rounded-xl">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-indigo-900 text-sm leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Full transcript review */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Conversation Review</h2>
          <div className="space-y-4">
            {messages.map((msg, i) => {
              if (msg.type === 'ai-question') {
                return (
                  <div key={i} className="flex">
                    <div className="max-w-xs bg-gray-100 text-gray-800 px-4 py-3 rounded-2xl text-sm leading-relaxed">
                      {msg.spoken_prompt}
                    </div>
                  </div>
                )
              }
              if (msg.type === 'feedback') {
                return (
                  <div key={i} className="space-y-1">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2">
                      <p className="text-yellow-800 text-xs">{msg.encouragement_message}</p>
                    </div>
                    <div className="flex justify-end">
                      <div className="max-w-xs bg-white border border-gray-200 px-4 py-3 rounded-2xl shadow-sm">
                        <div className="flex flex-wrap gap-x-2 gap-y-1 text-base">
                          {msg.words?.map((w, wi) => (
                            <VowelWord key={wi} word={w.word} vowels={w.vowels} />
                          ))}
                        </div>
                      </div>
                    </div>
                    {msg.summary_tip && (
                      <div className="flex justify-end">
                        <p className="text-xs text-gray-400 italic max-w-xs text-right">{msg.summary_tip}</p>
                      </div>
                    )}
                  </div>
                )
              }
              return null
            })}
          </div>
        </div>

        {/* Restart buttons */}
        <div className="flex gap-3 pb-8">
          <button
            onClick={() => navigate('/conversation')}
            className="flex-1 text-white py-3 rounded-xl font-medium transition-colors"
            style={{ backgroundColor: '#2F4780' }}
          >
            Practice Again
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 bg-white py-3 rounded-xl font-medium transition-colors border-2"
            style={{ color: '#2F4780', borderColor: '#2F4780' }}
          >
            Home
          </button>
        </div>

      </div>
    </div>
  )
}

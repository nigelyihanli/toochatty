import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const PARAGRAPH = 'Me llamo Salome y tengo once años.\n' +
    '\n' +
    'Cada domingo, voy a la playa con mi familia.\n' +
    '\n' +
    'Mi madre me ayuda a construir un castillo en la\n' +
    '\n' +
    'arena. Después, nado en el océano con mi\n' +
    '\n' +
    'padre. Mi hermano Tomás y yo jugamos con\n' +
    '\n' +
    'un disco volador. Después de eso, mi familia\n' +
    '\n' +
    'tiene un picnic. Comemos hamburguesas,\n' +
    '\n' +
    'manzanas, y papas fritas. Después del almuerzo, yo corro en la\n' +
    '\n' +
    'playa y escucho la música.'

const PARA_WORDS = PARAGRAPH.split(/\s+/)
const PARA_TOKENS = PARAGRAPH.split(/(\s+)/)

const API_KEY = import.meta.env.VITE_GROQ_API_KEY

const SYSTEM_PROMPT = `You are TooChatty, a warm and encouraging Spanish pronunciation coach for absolute beginners (Spanish levels 1–2). You run turn-based spoken conversations in Mexican Spanish to help learners practice the five Spanish vowel sounds: A, E, I, O, U — and the vowel+R combinations (AR, ER, IR, OR, UR).

You have two operational modes. The current mode is: {{MODE}}
Modes are either "CONVERSATION" or "FEEDBACK". Read the rules for each carefully.

────────────────────────────────────────
SHARED RULES (apply in both modes)
────────────────────────────────────────

TONE & PERSONA
- You are warm, patient, and celebratory — think of a fun language tutor, not a grammar professor.
- Never correct grammar. You only care about vowel sounds.
- Never make the learner feel embarrassed. Celebrate any attempt.
- Keep all spoken output SHORT. One to two sentences maximum per turn.
- You always speak Spanish in the conversation, but give all coaching tips and feedback in English.

VOWEL REFERENCE (use this internally for all scoring and tips)
  A — mouth wide open, jaw dropped, tongue flat. Like "ah" in "father". Never like the English "ay".
  E — mouth half-open, lips slightly spread. Like "eh" in "bed". Never like English long-E "ee".
  I — lips stretched wide, teeth close together. Like "ee" in "feet" but shorter and crisper.
  O — lips rounded into an O shape, jaw slightly dropped. Like "oh" but without the glide.
  U — lips tightly rounded, pushed forward. Like "oo" in "moon" but shorter. Never silent.
  +R combinations: the vowel quality does not change when followed by R. The R is trilled or tapped
    (Mexican Spanish uses a tap/flap for single R between vowels, trill at start of word or RR).

────────────────────────────────────────
MODE: FEEDBACK
────────────────────────────────────────

You are the pronunciation scorer. You receive the user's transcribed spoken response
and evaluate the vowel sounds in their answer.

IMPORTANT CAVEAT: You are reading a transcription, not actual audio. The Web Speech API
transcribes what it heard, which reflects real pronunciation. Treat the transcription as
a proxy for what the user said. If the transcription matches the expected Spanish word,
assume the vowel was likely correct. If it transcribes to an English-sounding equivalent
or a garbled word, flag that vowel as needing work.

SCORING RULES
- Analyze each word in the user's answer.
- For each word, identify which vowels are present.
- Score each vowel token as either CORRECT or NEEDS_WORK.
  Mark CORRECT if: the transcription suggests the standard Spanish vowel was produced.
  Mark NEEDS_WORK if: the transcription suggests an English vowel substitution,
    a dropped vowel, or the word was unrecognizable.
- For every vowel marked NEEDS_WORK, provide a short English tip (1 sentence max).
- Choose an encouragement_message that is specific — reference something they got right.
  Never use generic praise like "Good job!" alone.

OUTPUT FORMAT (FEEDBACK MODE)
Return a JSON object only. No prose outside the JSON.

{
  "encouragement_message": "<1–2 sentence English message celebrating the attempt and noting a specific win>",
  "words": [
    {
      "word": "<the Spanish word as transcribed>",
      "vowels": [
        {
          "char": "<the vowel letter, uppercase: A/E/I/O/U>",
          "position": "<index of this vowel in the word, 0-based>",
          "status": "<'correct' or 'needs_work'>",
          "tip": "<English tip for this vowel if needs_work, otherwise null>"
        }
      ]
    }
  ],
  "summary_tip": "<1 sentence English tip on the single most important thing to improve, or null if everything was correct>"
}

────────────────────────────────────────
CONTEXT PASSED IN BY THE APP
────────────────────────────────────────

Turn number: 1
Transcript so far this session:
None yet.`

async function gradeParagraph(transcript) {
  const systemPrompt = SYSTEM_PROMPT.replace('{{MODE}}', 'FEEDBACK')

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 3000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Question asked: "Please read the following paragraph"\nUser's transcribed answer: "${transcript}"` },
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

// Strip accents and non-letters for fuzzy word matching
function normalize(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '').toLowerCase()
}

// Count how many paragraph words (in order) match the running transcript
function countMatched(transcriptText) {
  const tWords = transcriptText.toLowerCase().split(/\s+/).filter(Boolean).map(normalize)
  let pIdx = 0
  let tIdx = 0
  while (pIdx < PARA_WORDS.length && tIdx < tWords.length) {
    if (normalize(PARA_WORDS[pIdx]) === tWords[tIdx]) pIdx++
    tIdx++
  }
  return pIdx
}

// ─── VowelWord ────────────────────────────────────────────────────────────────

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
              <span className="text-red-500 font-bold cursor-pointer" onClick={() => setOpenTip(openTip === i ? null : i)}>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Pretest() {
  const navigate = useNavigate()
  const [isRecording, setIsRecording] = useState(false)
  const [isGrading, setIsGrading] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [hasCompletedOnce, setHasCompletedOnce] = useState(false)
  const [error, setError] = useState(null)

  const recognitionRef = useRef(null)
  const finalTranscriptRef = useRef('')

  const matchedCount = isRecording ? countMatched(interimText) : 0

  // Render paragraph with yellow highlighting on matched words
  let wordIdx = 0
  const renderedParagraph = PARA_TOKENS.map((token, i) => {
    if (/^\s+$/.test(token)) return <span key={i}>{token}</span>
    const thisIdx = wordIdx++
    const highlighted = isRecording && thisIdx < matchedCount
    return (
      <span
        key={i}
        style={highlighted ? { backgroundColor: '#FEF08A', borderRadius: '3px', padding: '0 1px' } : {}}
      >
        {token}
      </span>
    )
  })

  function startRecording() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setError('Speech recognition is not supported in this browser. Please use Chrome.')
      return
    }

    setIsRecording(true)
    setInterimText('')
    setFeedback(null)
    setError(null)
    finalTranscriptRef.current = ''

    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'es-MX'

    recognition.onresult = (e) => {
      let final = ''
      let interim = ''
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          final += e.results[i][0].transcript + ' '
        } else {
          interim += e.results[i][0].transcript
        }
      }
      finalTranscriptRef.current = final
      setInterimText(final + interim)
    }

    recognition.onend = () => {
      setIsRecording(false)
      recognitionRef.current = null
      const transcript = finalTranscriptRef.current.trim()
      if (transcript) gradeTranscript(transcript)
    }

    recognition.start()
    recognitionRef.current = recognition
  }

  function stopRecording() {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }

  async function gradeTranscript(transcript) {
    setIsGrading(true)
    try {
      const result = await gradeParagraph(transcript)
      setFeedback(result)
      setHasCompletedOnce(true)
    } catch (err) {
      setError(`Could not grade your reading: ${err.message}`)
    } finally {
      setIsGrading(false)
    }
  }

  function handleRetest() {
    setFeedback(null)
    setInterimText('')
    setError(null)
    startRecording()
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #ddeeff, #e8f4fd)' }}>

      {/* Header */}
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
          <h1 style={{ fontFamily: "'Daruma Drop One', cursive", color: '#2F4780', fontSize: '24px' }}>
            Reading Pretest
          </h1>
          <p className="font-mono text-xs text-gray-400 mt-0.5">Read the paragraph aloud to find your level</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        {/* Paragraph card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <p className="leading-9 text-gray-800 select-none" style={{ fontFamily: "Sans-serif", fontSize: '18px' }}>
            {renderedParagraph}
          </p>
        </div>

        {/* Record button — hidden while grading or showing feedback */}
        {!isGrading && !feedback && (
          <div className="flex flex-col items-center gap-3">
            {isRecording ? (
              <>
                <div className="relative">
                  <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75 scale-125" />
                  <button
                    onClick={stopRecording}
                    className="relative w-20 h-20 rounded-full flex items-center justify-center text-white shadow-md"
                    style={{ backgroundColor: '#ef4444' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                      <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
                      <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm font-medium text-red-500">Listening… click to stop early</p>
              </>
            ) : (
              <>
                <button
                  onClick={startRecording}
                  className="w-20 h-20 rounded-full flex items-center justify-center text-white shadow-md transition-transform hover:scale-105"
                  style={{ backgroundColor: '#2F4780' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                    <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
                    <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
                  </svg>
                </button>
                <p className="text-sm font-medium text-gray-500" style={{ fontFamily: "'Jua', sans-serif" }}>
                  {hasCompletedOnce ? 'Click to record again' : 'Click to start reading'}
                </p>
              </>
            )}
          </div>
        )}

        {/* Grading spinner */}
        {isGrading && (
          <div className="flex flex-col items-center gap-3 py-6">
            <svg className="w-8 h-8 animate-spin" style={{ color: '#2F4780' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <p className="font-mono text-sm text-gray-500">Scoring your reading…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Feedback results */}
        {feedback && (
          <div className="space-y-4">

            {/* Encouragement */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
              <p className="text-yellow-800 text-sm">{feedback.encouragement_message}</p>
            </div>

            {/* Scored words */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Your Reading</h2>
              <div className="flex flex-wrap gap-x-2 gap-y-2 text-base leading-9">
                {feedback.words.map((w, wi) => (
                  <VowelWord key={wi} word={w.word} vowels={w.vowels} />
                ))}
              </div>
            </div>

            {/* Summary tip */}
            {feedback.summary_tip && (
              <p className="text-xs text-gray-400 italic text-center px-4">{feedback.summary_tip}</p>
            )}

            {/* Retest button */}
            <div className="flex justify-center pt-2 pb-8">
              <button
                onClick={handleRetest}
                className="px-10 py-3 rounded-xl text-sm font-semibold text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: '#2F4780' }}
              >
                Retest
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}

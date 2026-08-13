import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// ─── Phrase bank (fallback) ───────────────────────────────────────────────────

const PHRASE_BANK = {
  introductions: [
    { english: 'Hello', spanish: 'Hola' },
    { english: 'Hi, how are you?', spanish: '¿Qué tal?' },
    { english: 'Good morning', spanish: 'Buenos días' },
    { english: 'Good afternoon', spanish: 'Buenas tardes' },
    { english: 'Good evening', spanish: 'Buenas noches' },
    { english: "What's your name?", spanish: '¿Cómo te llamas?' },
    { english: 'My name is Carlos', spanish: 'Me llamo Carlos' },
    { english: 'Nice to meet you', spanish: 'Mucho gusto' },
    { english: 'How are you?', spanish: '¿Cómo estás?' },
    { english: "I'm fine, thank you", spanish: 'Estoy bien, gracias' },
    { english: 'And you?', spanish: '¿Y tú?' },
    { english: 'I study at university', spanish: 'Estudio en la universidad' },
    { english: 'Where are you from?', spanish: '¿De dónde eres?' },
    { english: 'I am from the United States', spanish: 'Soy de los Estados Unidos' },
    { english: 'See you later', spanish: 'Hasta luego' },
  ],
  common_questions: [
    { english: 'What time is it?', spanish: '¿Qué hora es?' },
    { english: 'Where is the bathroom?', spanish: '¿Dónde está el baño?' },
    { english: 'How much does it cost?', spanish: '¿Cuánto cuesta?' },
    { english: 'Do you speak English?', spanish: '¿Hablas inglés?' },
    { english: "I don't understand", spanish: 'No entiendo' },
    { english: 'Can you repeat that?', spanish: '¿Puedes repetir eso?' },
    { english: 'How do you say that in Spanish?', spanish: '¿Cómo se dice eso en español?' },
    { english: 'I need help', spanish: 'Necesito ayuda' },
    { english: 'Excuse me', spanish: 'Disculpe' },
    { english: 'Sorry', spanish: 'Lo siento' },
    { english: 'Thank you very much', spanish: 'Muchas gracias' },
    { english: "You're welcome", spanish: 'De nada' },
    { english: 'Please', spanish: 'Por favor' },
    { english: 'Of course', spanish: 'Claro que sí' },
    { english: 'I am lost', spanish: 'Estoy perdido' },
  ],
  ordering_food: [
    { english: 'I would like to order', spanish: 'Quisiera ordenar' },
    { english: 'What do you recommend?', spanish: '¿Qué recomienda?' },
    { english: 'The menu, please', spanish: 'El menú, por favor' },
    { english: "I'll have the chicken", spanish: 'Voy a pedir el pollo' },
    { english: 'Do you have vegetarian options?', spanish: '¿Tienen opciones vegetarianas?' },
    { english: 'The check, please', spanish: 'La cuenta, por favor' },
    { english: "It's delicious", spanish: 'Está delicioso' },
    { english: 'More water, please', spanish: 'Más agua, por favor' },
    { english: 'I am allergic to nuts', spanish: 'Soy alérgico a las nueces' },
    { english: 'Table for two', spanish: 'Mesa para dos' },
    { english: 'Is service included?', spanish: '¿Está incluido el servicio?' },
    { english: 'I would like a coffee', spanish: 'Quisiera un café' },
    { english: 'Without sugar, please', spanish: 'Sin azúcar, por favor' },
    { english: 'Can I see the dessert menu?', spanish: '¿Me puede traer el menú de postres?' },
    { english: 'Everything was wonderful', spanish: 'Todo estuvo maravilloso' },
  ],
  booking_a_cab: [
    { english: 'I need a taxi', spanish: 'Necesito un taxi' },
    { english: 'Take me to this address', spanish: 'Lléveme a esta dirección' },
    { english: 'How long will it take?', spanish: '¿Cuánto tiempo tomará?' },
    { english: 'How much to downtown?', spanish: '¿Cuánto cobra al centro?' },
    { english: 'Can you turn on the meter?', spanish: '¿Puede poner el taxímetro?' },
    { english: 'Stop here, please', spanish: 'Pare aquí, por favor' },
    { english: 'Can you wait for me?', spanish: '¿Puede esperarme?' },
    { english: "I'm in a hurry", spanish: 'Tengo prisa' },
    { english: 'The airport, please', spanish: 'Al aeropuerto, por favor' },
    { english: 'Is there a toll?', spanish: '¿Hay caseta?' },
    { english: "I'll pay with cash", spanish: 'Voy a pagar en efectivo' },
    { english: 'Do you accept cards?', spanish: '¿Acepta tarjetas?' },
    { english: 'Keep the change', spanish: 'Quédese con el cambio' },
    { english: 'Take the highway', spanish: 'Tome la autopista' },
    { english: 'Turn left at the corner', spanish: 'Doble a la izquierda en la esquina' },
  ],
}

// ─── Groq helpers ─────────────────────────────────────────────────────────────

const API_KEY = import.meta.env.VITE_GROQ_API_KEY

async function generatePhrases(moduleId, moduleLabel) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 600,
      messages: [
        {
          role: 'system',
          content: 'You are a Mexican Spanish phrase generator for a pronunciation practice app. Generate exactly 10 short, practical phrase pairs for the given topic. Each phrase should be 2–7 words, vowel-rich, and natural-sounding. Return ONLY a valid JSON array of objects with "english" and "spanish" keys. No markdown, no prose.',
        },
        {
          role: 'user',
          content: `Generate 10 Mexican Spanish phrase pairs for: "${moduleLabel}". Return a JSON array only.`,
        },
      ],
    }),
  })
  if (!res.ok) throw new Error('Groq error')
  const data = await res.json()
  const raw = data.choices[0].message.content.replace(/```json\n?|```\n?/g, '').trim()
  return JSON.parse(raw)
}

async function gradeSpeech(expectedSpanish, transcript) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 800,
      messages: [
        {
          role: 'system',
          content: `You are a Mexican Spanish pronunciation coach grading a shadowing exercise.

VOWEL REFERENCE:
  A — "ah" in father. Never English "ay".
  E — "eh" in bed. Never English long-E "ee".
  I — "ee" in feet but shorter and crisper.
  O — "oh" without the glide.
  U — "oo" in moon but shorter. Never silent.

TASK: The user was asked to repeat a Spanish phrase out loud. You receive the expected phrase and their transcribed attempt. Grade their vowel pronunciation.

RULES:
- Analyze each word in the user's attempt against the expected phrase.
- For each word, list its vowels (A/E/I/O/U).
- Score each vowel as "correct" or "needs_work".
- Mark correct if the word was transcribed close to the expected Spanish.
- Mark needs_work if the transcription suggests an English vowel substitution or the word was garbled.
- Give a short tip (1 sentence) for each needs_work vowel.
- Write a specific encouragement_message (1–2 sentences) referencing something they got right.

Return ONLY a valid JSON object — no markdown, no prose:
{
  "encouragement_message": "<string>",
  "words": [
    {
      "word": "<transcribed word>",
      "vowels": [
        { "char": "<A/E/I/O/U>", "position": <0-based char index>, "status": "<correct|needs_work>", "tip": "<string or null>" }
      ]
    }
  ],
  "summary_tip": "<string or null>"
}`,
        },
        {
          role: 'user',
          content: `Expected Spanish phrase: "${expectedSpanish}"\nUser's transcribed attempt: "${transcript}"\n\nGrade the vowel pronunciation.`,
        },
      ],
    }),
  })
  if (!res.ok) throw new Error('Groq error')
  const data = await res.json()
  const raw = data.choices[0].message.content.replace(/```json\n?|```\n?/g, '').trim()
  return JSON.parse(raw)
}

// ─── Vowel highlighting ───────────────────────────────────────────────────────

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

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Shadowing() {
  const location = useLocation()
  const navigate = useNavigate()
  const { moduleId = 'introductions', moduleLabel = 'Introductions' } = location.state ?? {}

  const [phrases, setPhrases] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoadingPhrases, setIsLoadingPhrases] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [isGrading, setIsGrading] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [isDone, setIsDone] = useState(false)
  const [correctVowels, setCorrectVowels] = useState(0)
  const [totalVowels, setTotalVowels] = useState(0)
  const [usedFallback, setUsedFallback] = useState(false)

  const mediaRecorderRef = useRef(null)
  const recognitionRef = useRef(null)
  const transcriptRef = useRef('')
  const initDone = useRef(false)

  useEffect(() => {
    if (initDone.current) return
    initDone.current = true
    loadPhrases()
  }, [])

  async function loadPhrases() {
    setIsLoadingPhrases(true)
    try {
      // Try teacher-edited phrases from Supabase first
      const { data: contentData } = await supabase
        .from('content')
        .select('value')
        .eq('key', `phrases_${moduleId}`)
        .single()
      if (contentData?.value) {
        const dbPhrases = JSON.parse(contentData.value)
        if (dbPhrases.length > 0) {
          setPhrases(dbPhrases.slice(0, 10))
          setIsLoadingPhrases(false)
          return
        }
      }
      // Fall back to Groq-generated phrases
      const generated = await generatePhrases(moduleId, moduleLabel)
      setPhrases(generated.slice(0, 10))
    } catch {
      setPhrases((PHRASE_BANK[moduleId] || PHRASE_BANK.introductions).slice(0, 10))
      setUsedFallback(true)
    } finally {
      setIsLoadingPhrases(false)
    }
  }

  async function handleTranscript(transcript) {
    if (!phrases[currentIndex]) return
    setIsGrading(true)
    try {
      const result = await gradeSpeech(phrases[currentIndex].spanish, transcript)
      setFeedback(result)
      const vowels = result.words?.flatMap(w => w.vowels) ?? []
      const correct = vowels.filter(v => v.status === 'correct').length
      setCorrectVowels(c => c + correct)
      setTotalVowels(t => t + vowels.length)
    } catch {
      setFeedback({ encouragement_message: 'Good try! Keep going.', words: [], summary_tip: null })
    } finally {
      setIsGrading(false)
    }
  }

  function nextPhrase() {
    setFeedback(null)
    if (currentIndex + 1 >= phrases.length) {
      setIsDone(true)
    } else {
      setCurrentIndex(i => i + 1)
    }
  }

  // ── Recording ───────────────────────────────────────────────────────────────

  async function startRecording() {
    setIsRecording(true)
    transcriptRef.current = ''

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SR) {
      const recognition = new SR()
      recognition.continuous = true
      recognition.interimResults = false
      recognition.lang = 'es-MX'
      recognition.onresult = e => {
        transcriptRef.current = Array.from(e.results).map(r => r[0].transcript).join(' ')
      }
      recognition.start()
      recognitionRef.current = recognition
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      recorder.start()
      mediaRecorderRef.current = { recorder, stream }
    } catch (err) {
      console.error('Mic access denied:', err)
    }
  }

  function stopRecording() {
    setIsRecording(false)

    if (mediaRecorderRef.current) {
      const { recorder, stream } = mediaRecorderRef.current
      recorder.stop()
      stream.getTracks().forEach(t => t.stop())
      mediaRecorderRef.current = null
    }

    if (recognitionRef.current) {
      const recognition = recognitionRef.current
      recognitionRef.current = null
      recognition.onend = () => {
        const transcript = transcriptRef.current.trim()
        if (transcript) handleTranscript(transcript)
      }
      recognition.stop()
    }
  }

  function handlePointerDown(e) {
    e.preventDefault()
    if (!isRecording && !isGrading && feedback === null) startRecording()
  }

  function handlePointerUp(e) {
    e.preventDefault()
    if (isRecording) stopRecording()
  }

  // ── Done screen ─────────────────────────────────────────────────────────────

  if (isDone) {
    const pct = totalVowels > 0 ? Math.round((correctVowels / totalVowels) * 100) : 0
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-sm w-full text-center space-y-4">
          <div className="text-5xl">{pct >= 70 ? '🎉' : '💪'}</div>
          <h2 className="text-2xl font-black text-gray-900">Module complete!</h2>
          <p className="text-gray-500 text-sm">{moduleLabel}</p>
          <div className="bg-indigo-50 rounded-xl px-4 py-3">
            <p className="text-3xl font-black text-indigo-700">{pct}%</p>
            <p className="text-xs text-indigo-500 mt-1">{correctVowels} / {totalVowels} vowels correct</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => { setCurrentIndex(0); setFeedback(null); setIsDone(false); setCorrectVowels(0); setTotalVowels(0) }}
              className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              Try again
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Loading screen ──────────────────────────────────────────────────────────

  if (isLoadingPhrases) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <svg className="w-8 h-8 text-indigo-400 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p className="text-gray-400 text-sm">Building your phrase set…</p>
      </div>
    )
  }

  const current = phrases[currentIndex]

  // ── Main drill ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/module-select')}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Back"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-base font-black text-gray-900">{moduleLabel}</h1>
            {usedFallback && <p className="text-xs text-amber-500">Using offline phrase bank</p>}
          </div>
        </div>
        <span className="text-sm font-semibold text-gray-400">
          {currentIndex + 1} / {phrases.length}
        </span>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-1 bg-indigo-500 transition-all duration-500"
          style={{ width: `${((currentIndex + (feedback ? 1 : 0)) / phrases.length) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-6">

        {/* Phrase card */}
        <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">English</p>
            <p className="text-xl text-gray-600 font-medium">{current?.english}</p>
          </div>
          <div className="px-6 py-5 bg-indigo-50">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-2">Spanish — say this</p>
            <p className="text-2xl font-black text-indigo-900">{current?.spanish}</p>
          </div>
        </div>

        {/* Feedback */}
        {feedback && (
          <div className="w-full max-w-md space-y-2">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2">
              <p className="text-yellow-800 text-sm">{feedback.encouragement_message}</p>
            </div>
            {feedback.words?.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
                <p className="text-xs text-gray-400 mb-2">Your attempt:</p>
                <div className="flex flex-wrap gap-x-2 gap-y-1 text-lg">
                  {feedback.words.map((w, wi) => (
                    <VowelWord key={wi} word={w.word} vowels={w.vowels} />
                  ))}
                </div>
              </div>
            )}
            {feedback.summary_tip && (
              <p className="text-xs text-gray-400 italic px-1">{feedback.summary_tip}</p>
            )}
            <button
              onClick={nextPhrase}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-sm"
            >
              {currentIndex + 1 >= phrases.length ? 'Finish module' : 'Next phrase →'}
            </button>
          </div>
        )}
      </div>

      {/* Mic bar */}
      {!feedback && (
        <div className="border-t border-gray-200 py-6 flex flex-col items-center gap-3">
          <div className="relative">
            {isRecording && (
              <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75 scale-125" />
            )}
            <button
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={isRecording ? handlePointerUp : undefined}
              disabled={isGrading}
              className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-colors select-none touch-none shadow-md ${
                isRecording ? 'bg-red-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40'
              }`}
            >
              {isGrading ? (
                <svg className="w-7 h-7 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                  <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
                  <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
                </svg>
              )}
            </button>
          </div>
          <p className={`text-sm font-medium ${isRecording ? 'text-red-500' : isGrading ? 'text-gray-400' : 'text-gray-500'}`}>
            {isRecording ? 'Listening…' : isGrading ? 'Grading…' : 'Hold to speak, release to grade'}
          </p>
        </div>
      )}
    </div>
  )
}

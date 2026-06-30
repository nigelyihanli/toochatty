import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── System prompt ──────────────────────────────────────────────────────────

const BASE_SYSTEM_PROMPT = `You are TooChatty, a warm and encouraging Spanish pronunciation coach for absolute beginners (Spanish levels 1–2). You run turn-based spoken conversations in Mexican Spanish to help learners practice the five Spanish vowel sounds: A, E, I, O, U — and the vowel+R combinations (AR, ER, IR, OR, UR).

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

SCOPE
- All conversation topics must be appropriate for a Spanish 1–2 learner.
  Allowed topics: greetings, introductions, family, food, colors, numbers, animals,
  simple daily activities, weather, simple likes and dislikes, classroom objects.
- Never introduce advanced grammar, subjunctive, complex verb conjugations, or topics
  outside level 1–2 vocabulary.
- Never discuss anything unrelated to language learning.

VOWEL REFERENCE (use this internally for all scoring and tips)
  A — mouth wide open, jaw dropped, tongue flat. Like "ah" in "father". Never like the English "ay".
  E — mouth half-open, lips slightly spread. Like "eh" in "bed". Never like English long-E "ee".
  I — lips stretched wide, teeth close together. Like "ee" in "feet" but shorter and crisper.
  O — lips rounded into an O shape, jaw slightly dropped. Like "oh" but without the glide.
  U — lips tightly rounded, pushed forward. Like "oo" in "moon" but shorter. Never silent.
  +R combinations: the vowel quality does not change when followed by R. The R is trilled or tapped
    (Mexican Spanish uses a tap/flap for single R between vowels, trill at start of word or RR).

────────────────────────────────────────
MODE: CONVERSATION
────────────────────────────────────────

You are the conversation partner. Your job is to ask simple, engaging Spanish questions
that elicit responses rich in vowel sounds.

TURN STRUCTURE
- Each of your turns = one short Spanish question or prompt.
- This is turn number {{TURN_NUMBER}} of the conversation.
- Turn 1: Always begin with a warm greeting and a simple self-introduction question.
  Example: "¡Hola! Soy TooChatty. ¿Cómo te llamas?"
- Turns 2–5: Follow up naturally on the user's answer. Ask about one new topic per turn.
- Turn 6+: Introduce a new allowed topic if the previous one is exhausted.
- Never repeat the same question twice in a session.

QUESTION DESIGN RULES
- Prefer questions whose likely answer words contain many A, E, I, O, U sounds.
  Good: "¿Cuál es tu animal favorito?" (likely answers: gato, perro, pájaro — vowel-rich)
  Good: "¿Qué comes en el desayuno?" (likely answers: huevo, fruta, cereal)
  Avoid: questions with only yes/no answers.
- Vary question types: some open-ended, some choice-based ("¿Prefieres X o Y?")

OUTPUT FORMAT (CONVERSATION MODE)
Return a JSON object only. No prose outside the JSON.

{
  "spoken_prompt": "<your Spanish question, 1–2 sentences, spoken aloud to the user>",
  "display_prompt": "<same text, for on-screen display>",
  "topic": "<the topic this question covers, in English>",
  "target_vowels": ["<list of vowel sounds this question is designed to elicit, e.g. 'A', 'O', 'U'>"]
}

────────────────────────────────────────
MODE: FEEDBACK
────────────────────────────────────────

You are the pronunciation scorer. You receive the user's transcribed spoken response
and evaluate the vowel sounds in their answer.

You will be given:
- The Spanish question that was asked
- The user's transcribed answer (text only — from the browser's Web Speech API)

IMPORTANT CAVEAT: You are reading a transcription, not actual audio. The Web Speech API
transcribes what it heard, which reflects real pronunciation. Treat the transcription as
a proxy for what the user said. If the transcription matches the expected Spanish word,
assume the vowel was likely correct. If it transcribes to an English-sounding equivalent
or a garbled word, flag that vowel as needing work.

SCORING RULES
- Analyze each word in the user's answer.
- For each word, identify which vowels are present.
- Score each vowel token as either CORRECT or NEEDS_WORK.
  Mark CORRECT if: the transcription suggests the standard Spanish vowel was produced
    (i.e., the word was transcribed correctly in Spanish or close to it).
  Mark NEEDS_WORK if: the transcription suggests an English vowel substitution,
    a dropped vowel, or the word was unrecognizable.
- For every vowel marked NEEDS_WORK, provide a short English tip (1 sentence max)
  drawn from the VOWEL REFERENCE above.
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
  "summary_tip": "<1 sentence English tip on the single most important thing to improve this turn, or null if everything was correct>"
}

────────────────────────────────────────
CONTEXT PASSED IN BY THE APP
────────────────────────────────────────

Turn number: {{TURN_NUMBER}}
Transcript so far this session:
{{TRANSCRIPT_SO_FAR}}

(If TRANSCRIPT_SO_FAR is empty, this is the first turn.)`

// ─── API helper ─────────────────────────────────────────────────────────────

const API_KEY = import.meta.env.VITE_GROQ_API_KEY

async function callClaude(mode, userMessage, turnNumber, transcriptSoFar) {
  const systemPrompt = BASE_SYSTEM_PROMPT
    .replace('{{MODE}}', mode)
    .replace('{{TURN_NUMBER}}', String(turnNumber))
    .replace('{{TRANSCRIPT_SO_FAR}}', transcriptSoFar || 'None yet.')

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: mode === 'CONVERSATION' ? 300 : 1000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
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

// ─── Vowel highlighting ──────────────────────────────────────────────────────

const VOWEL_SET = new Set(['a', 'e', 'i', 'o', 'u'])

function VowelWord({ word, vowels }) {
  const [openTip, setOpenTip] = useState(null)

  // Walk the word left-to-right; consume feedback entries in order for each vowel hit.
  // This means consonants are never touched regardless of what position the LLM returns.
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

// ─── Main component ──────────────────────────────────────────────────────────

export default function Conversation() {
  const [messages, setMessages] = useState([])
  const [isRecording, setIsRecording] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const turnNumberRef = useRef(1)
  const transcriptSoFarRef = useRef('')
  const lastQuestionRef = useRef('')

  const mediaRecorderRef = useRef(null)
  const recognitionRef = useRef(null)
  const transcriptRef = useRef('')

  const bottomRef = useRef(null)
  const initialLoadDone = useRef(false)

  // Load first question on mount — guard against StrictMode double-invoke
  useEffect(() => {
    if (initialLoadDone.current) return
    initialLoadDone.current = true
    loadNextQuestion()
  }, [])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  async function loadNextQuestion() {
    setIsLoading(true)
    try {
      const parsed = await callClaude(
        'CONVERSATION',
        'Generate the next conversation prompt.',
        turnNumberRef.current,
        transcriptSoFarRef.current,
      )
      lastQuestionRef.current = parsed.spoken_prompt
      setMessages(prev => [...prev, { type: 'ai-question', ...parsed }])
    } catch (err) {
      console.error('Failed to load question:', err)
      setMessages(prev => [...prev, { type: 'error', text: `Could not load question: ${err.message}` }])
    } finally {
      setIsLoading(false)
    }
  }

  async function getFeedback(transcript) {
    setIsLoading(true)
    try {
      const userMessage = `Question asked: "${lastQuestionRef.current}"\nUser's transcribed answer: "${transcript}"`
      const feedback = await callClaude(
        'FEEDBACK',
        userMessage,
        turnNumberRef.current,
        transcriptSoFarRef.current,
      )

      transcriptSoFarRef.current +=
        `\nTurn ${turnNumberRef.current} — AI: "${lastQuestionRef.current}" | User: "${transcript}"`
      turnNumberRef.current += 1

      setMessages(prev => [...prev, { type: 'feedback', userTranscript: transcript, ...feedback }])
    } catch (err) {
      console.error('Failed to get feedback:', err)
      setMessages(prev => [...prev, { type: 'error', text: `Could not get feedback: ${err.message}` }])
    } finally {
      setIsLoading(false)
    }
  }

  // ── Recording ──────────────────────────────────────────────────────────────

  async function startRecording() {
    setIsRecording(true)
    transcriptRef.current = ''

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = false
      recognition.lang = 'es-MX'
      recognition.onresult = e => {
        transcriptRef.current = Array.from(e.results)
          .map(r => r[0].transcript)
          .join(' ')
      }
      recognition.start()
      recognitionRef.current = recognition
    } else {
      console.warn('SpeechRecognition not supported in this browser.')
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      recorder.start()
      mediaRecorderRef.current = { recorder, stream }
    } catch (err) {
      console.error('Microphone access denied:', err)
    }
  }

  function stopRecording() {
    setIsRecording(false)

    // Stop MediaRecorder
    if (mediaRecorderRef.current) {
      const { recorder, stream } = mediaRecorderRef.current
      recorder.stop()
      stream.getTracks().forEach(t => t.stop())
      mediaRecorderRef.current = null
    }

    // Stop SpeechRecognition — onend fires after final results are collected
    if (recognitionRef.current) {
      const recognition = recognitionRef.current
      recognitionRef.current = null
      recognition.onend = () => {
        const transcript = transcriptRef.current.trim()
        console.log('Transcript:', transcript)
        if (transcript) getFeedback(transcript)
      }
      recognition.stop()
    }
  }

  function handlePointerDown(e) {
    e.preventDefault()
    if (!isRecording && !isLoading) startRecording()
  }

  function handlePointerUp(e) {
    e.preventDefault()
    if (isRecording) stopRecording()
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Conversation</h2>
        <button
          onClick={() => {
            const feedbackResults = messages.filter(m => m.type === 'feedback')
            navigate('/feedback', {
              state: { messages, feedbackResults, turnCount: turnNumberRef.current - 1 },
            })
          }}
          className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Finish & Get Feedback
        </button>
      </header>

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && !isLoading && (
          <p className="text-gray-400 text-center mt-16">Loading your first question…</p>
        )}

        {messages.map((msg, i) => {
          if (msg.type === 'ai-question') {
            return (
              <div key={i} className="flex">
                <div className="max-w-sm bg-gray-100 text-gray-800 px-4 py-3 rounded-2xl text-sm leading-relaxed">
                  {msg.spoken_prompt}
                </div>
              </div>
            )
          }

          if (msg.type === 'feedback') {
            return (
              <div key={i} className="space-y-2">
                {/* Encouragement banner */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2">
                  <p className="text-yellow-800 text-sm">{msg.encouragement_message}</p>
                </div>

                {/* User response bubble — right-aligned with vowel highlighting */}
                <div className="flex justify-end">
                  <div className="max-w-sm bg-white border border-gray-200 px-4 py-3 rounded-2xl shadow-sm">
                    <div className="flex flex-wrap gap-x-2 gap-y-1 text-base">
                      {msg.words.map((w, wi) => (
                        <VowelWord key={wi} word={w.word} vowels={w.vowels} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Summary tip */}
                {msg.summary_tip && (
                  <div className="flex justify-end">
                    <p className="text-xs text-gray-400 italic max-w-sm text-right">{msg.summary_tip}</p>
                  </div>
                )}

                {/* Next question button */}
                <div className="flex">
                  <button
                    onClick={loadNextQuestion}
                    disabled={isLoading}
                    className="text-xs text-indigo-600 hover:text-indigo-800 underline disabled:opacity-40"
                  >
                    {isLoading ? 'Loading next question…' : 'Next question →'}
                  </button>
                </div>
              </div>
            )
          }

          if (msg.type === 'user-text') {
            return (
              <div key={i} className="flex justify-end">
                <div className="max-w-sm bg-indigo-600 text-white px-4 py-2 rounded-2xl text-sm">
                  {msg.text}
                </div>
              </div>
            )
          }

          if (msg.type === 'error') {
            return (
              <div key={i} className="flex justify-center">
                <p className="text-xs text-red-500 bg-red-50 px-3 py-1 rounded-full">{msg.text}</p>
              </div>
            )
          }

          return null
        })}

        {/* Loading indicator */}
        {isLoading && !isRecording && (
          <div className="flex">
            <div className="bg-gray-100 px-4 py-3 rounded-2xl text-sm text-gray-400 animate-pulse">
              Thinking…
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Mic bar */}
      <div className="border-t border-gray-200 py-6 flex flex-col items-center gap-3">
        <div className="relative">
          {isRecording && (
            <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75 scale-125" />
          )}
          <button
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={isRecording ? handlePointerUp : undefined}
            disabled={isLoading && !isRecording}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-colors select-none touch-none shadow-md ${
              isRecording
                ? 'bg-red-600 text-white'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40'
            }`}
            aria-label={isRecording ? 'Recording' : 'Hold to talk'}
          >
            {isLoading && !isRecording ? (
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
        <p className={`text-sm font-medium ${isRecording ? 'text-red-500' : isLoading ? 'text-gray-400' : 'text-gray-500'}`}>
          {isRecording ? 'Listening…' : isLoading ? 'Processing…' : 'Hold to talk, release to send'}
        </p>
      </div>
    </div>
  )
}

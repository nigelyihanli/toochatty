import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk'

const SSML = (text) => `<speak version='1.0' xml:lang='es-MX'>
  <voice name='es-MX-JorgeNeural'>
    <prosody rate='0.9'>${text}</prosody>
  </voice>
</speak>`

function speakAzure(text) {
  const key = import.meta.env.VITE_AZURE_SPEECH_KEY
  const region = import.meta.env.VITE_AZURE_SPEECH_REGION

  return new Promise((resolve, reject) => {
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(key, region)
    speechConfig.speechSynthesisVoiceName = 'es-MX-JorgeNeural'
    const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig)

    synthesizer.speakSsmlAsync(
      SSML(text),
      result => {
        synthesizer.close()
        if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
          resolve()
        } else {
          reject(new Error(result.errorDetails))
        }
      },
      err => {
        synthesizer.close()
        reject(err)
      }
    )
  })
}

function speakBrowser(text) {
  return new Promise(resolve => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'es-MX'
    utterance.onend = resolve
    utterance.onerror = resolve
    window.speechSynthesis.speak(utterance)
  })
}

export async function speakWithJorge(text) {
  const key = import.meta.env.VITE_AZURE_SPEECH_KEY
  const region = import.meta.env.VITE_AZURE_SPEECH_REGION

  if (key && region) {
    try {
      await speakAzure(text)
      return
    } catch {
      // fall through to browser fallback
    }
  }

  await speakBrowser(text)
}

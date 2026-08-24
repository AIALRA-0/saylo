interface SpeechRecognitionResultLike {
  isFinal: boolean
  0: { transcript: string }
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number
  results: ArrayLike<SpeechRecognitionResultLike>
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string
  interimResults: boolean
  continuous: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

const getRecognitionConstructor = () => {
  const speechWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
}

export const canRecognizeSpeech = () => Boolean(getRecognitionConstructor())

export const createSpeechRecognizer = (
  onTranscript: (text: string, final: boolean) => void,
  onStateChange: (listening: boolean) => void,
  onError: (message: string) => void,
) => {
  const Recognition = getRecognitionConstructor()
  if (!Recognition) return null
  const recognition = new Recognition()
  recognition.lang = 'en-US'
  recognition.interimResults = true
  recognition.continuous = false

  // 浏览器可能连续返回临时结果，界面只在最终结果到达后提交练习
  recognition.onresult = (event) => {
    let transcript = ''
    let final = false
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      transcript += event.results[index][0].transcript
      final = final || event.results[index].isFinal
    }
    onTranscript(transcript.trim(), final)
  }
  recognition.onerror = (event) => {
    onStateChange(false)
    onError(event.error === 'not-allowed' ? '麦克风权限尚未开启' : '语音识别暂时不可用，请改用文字输入')
  }
  recognition.onend = () => onStateChange(false)

  return {
    start: () => {
      onStateChange(true)
      recognition.start()
    },
    stop: () => recognition.stop(),
    abort: () => recognition.abort(),
  }
}

export const speakEnglish = (text: string, rate = 0.92) => {
  if (!('speechSynthesis' in window)) return false
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = rate
  const voice = window.speechSynthesis.getVoices().find((item) => item.lang.startsWith('en-US'))
  if (voice) utterance.voice = voice
  window.speechSynthesis.speak(utterance)
  return true
}

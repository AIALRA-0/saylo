import { AudioLines, CircleStop, Cloud, LoaderCircle, Mic, ShieldCheck, WifiOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type ConnectionState = 'checking' | 'unavailable' | 'ready' | 'connecting' | 'connected' | 'error'

export function LiveVoicePanel({ learnedExpressions }: { learnedExpressions: string[] }) {
  const [state, setState] = useState<ConnectionState>('checking')
  const [error, setError] = useState('')
  const [transcript, setTranscript] = useState<Array<{ role: '你' | 'Saylo'; text: string }>>([])
  const peerRef = useRef<RTCPeerConnection | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const assistantBuffer = useRef('')

  useEffect(() => {
    // 能力检查只确认服务器是否配置密钥，不会发送语音或学习内容
    fetch('/api/health')
      .then((response) => response.json())
      .then((result: { voiceConfigured?: boolean }) => setState(result.voiceConfigured ? 'ready' : 'unavailable'))
      .catch(() => setState('unavailable'))
    return () => stop()
  }, [])

  const stop = () => {
    peerRef.current?.close()
    streamRef.current?.getTracks().forEach((track) => track.stop())
    peerRef.current = null
    streamRef.current = null
    setState((current) => current === 'unavailable' ? current : 'ready')
  }

  const start = async () => {
    setState('connecting')
    setError('')
    try {
      const peer = new RTCPeerConnection()
      peerRef.current = peer
      const audio = document.createElement('audio')
      audio.autoplay = true
      audioRef.current = audio
      peer.ontrack = (event) => { audio.srcObject = event.streams[0] }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      stream.getAudioTracks().forEach((track) => peer.addTrack(track, stream))

      // 数据通道接收双方转写，让学习者在会话结束后仍能复盘文字
      const channel = peer.createDataChannel('oai-events')
      channel.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as { type?: string; transcript?: string; delta?: string }
          if (message.type === 'conversation.item.input_audio_transcription.completed' && message.transcript) {
            setTranscript((items) => [...items, { role: '你', text: message.transcript! }])
          }
          if (message.type === 'response.output_audio_transcript.delta' || message.type === 'response.audio_transcript.delta') {
            assistantBuffer.current += message.delta ?? ''
          }
          if (message.type === 'response.output_audio_transcript.done' || message.type === 'response.audio_transcript.done') {
            const text = message.transcript || assistantBuffer.current
            if (text) setTranscript((items) => [...items, { role: 'Saylo', text }])
            assistantBuffer.current = ''
          }
        } catch {
          // 非文本事件由 WebRTC 连接自身处理，不影响音频会话
        }
      }

      const offer = await peer.createOffer()
      await peer.setLocalDescription(offer)
      const response = await fetch('/api/realtime/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sdp',
          'X-Saylo-Learned': encodeURIComponent(JSON.stringify(learnedExpressions.slice(0, 24))),
        },
        body: offer.sdp,
      })
      if (!response.ok) throw new Error('服务器未能建立实时语音会话')
      await peer.setRemoteDescription({ type: 'answer', sdp: await response.text() })
      setState('connected')
    } catch (reason) {
      stop()
      setState('error')
      setError(reason instanceof Error ? reason.message : '实时语音暂时不可用')
    }
  }

  return (
    <section className="live-voice-panel">
      <div className="live-voice-heading">
        <span className="live-icon"><AudioLines size={22} /></span>
        <div><strong>实时语音教练</strong><p>自然轮流说话，每 2 至 3 轮集中反馈一次</p></div>
        <span className={`connection-dot ${state}`} />
      </div>

      {state === 'checking' && <div className="voice-placeholder"><LoaderCircle className="spin" size={22} /> 正在检查云端能力</div>}
      {state === 'unavailable' && (
        <div className="voice-placeholder">
          <WifiOff size={22} />
          <div><strong>云端语音尚未配置</strong><p>下方引导语音仍可使用。服务器配置 OPENAI_API_KEY 后，这里会自动启用</p></div>
        </div>
      )}
      {(state === 'ready' || state === 'error') && (
        <div className="voice-ready">
          <div className="privacy-inline"><ShieldCheck size={17} /><span>麦克风只在会话期间开启，Saylo 不在本地保存原始音频</span></div>
          {error && <p className="inline-error">{error}</p>}
          <button className="button button-primary" onClick={start}><Mic size={18} /> 开始实时对话</button>
        </div>
      )}
      {state === 'connecting' && <div className="voice-placeholder"><LoaderCircle className="spin" size={22} /> 正在建立加密音频连接</div>}
      {state === 'connected' && (
        <div className="voice-connected">
          <div className="voice-pulse"><i /><i /><i /><i /><Mic size={25} /></div>
          <strong>正在倾听</strong>
          <p>像和朋友聊天一样自然回应，停顿后教练会接话</p>
          <button className="button stop-button" onClick={stop}><CircleStop size={18} /> 结束会话</button>
        </div>
      )}

      {transcript.length > 0 && (
        <div className="live-transcript">
          <span><Cloud size={15} /> 本次文字复盘</span>
          {transcript.slice(-6).map((item, index) => <p key={`${item.role}-${index}`}><strong>{item.role}</strong>{item.text}</p>)}
        </div>
      )}
    </section>
  )
}

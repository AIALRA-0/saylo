import { AudioLines, BookOpenCheck, ChevronRight, Headphones, Keyboard, LoaderCircle, Mic, Send, ShieldCheck, Sparkles, Square } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FeedbackCard } from '../components/FeedbackCard'
import { LiveVoicePanel } from '../components/LiveVoicePanel'
import type { PageId } from '../components/AppShell'
import { coachScenarios } from '../data/curriculum'
import { expressionById } from '../data/expressions'
import { requestCoachFeedback } from '../lib/coach'
import { getUnlockedPracticeScenarios } from '../lib/practiceAccess'
import { canRecognizeSpeech, createSpeechRecognizer, speakEnglish } from '../lib/speech'
import { learningStore, useLearningStore } from '../store/learningStore'
import type { CoachMessage } from '../types'

export function Practice({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  const progress = useLearningStore((state) => state.progress)
  const availableScenarios = useMemo(() => getUnlockedPracticeScenarios(coachScenarios, progress), [progress])
  const learnedExpressions = useMemo(() => Array.from(expressionById.values()).filter((expression) => (progress[expression.id]?.seen ?? 0) > 0), [progress])
  const [scenarioId, setScenarioId] = useState(coachScenarios[0].id)
  const [mode, setMode] = useState<'text' | 'guided-voice' | 'live'>('text')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<CoachMessage[]>([])
  const [working, setWorking] = useState(false)
  const [listening, setListening] = useState(false)
  const [speechError, setSpeechError] = useState('')
  const recognizerRef = useRef<ReturnType<typeof createSpeechRecognizer>>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scenario = availableScenarios.find((item) => item.id === scenarioId) ?? availableScenarios[0]
  const targetExpressions = useMemo(() => (scenario?.suggestedExpressionIds ?? [])
    .map((id) => expressionById.get(id))
    .filter((expression): expression is NonNullable<typeof expression> => Boolean(expression)), [scenario])

  useEffect(() => {
    if (scenario && scenario.id !== scenarioId) setScenarioId(scenario.id)
  }, [scenario, scenarioId])

  useEffect(() => {
    if (!scenario) return
    setMessages([{ id: crypto.randomUUID(), role: 'coach', text: scenario.opening }])
    setInput('')
    setSpeechError('')
  }, [scenarioId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, working])

  const submit = async (override?: string) => {
    const responseText = (override ?? input).trim()
    if (!responseText || working || !scenario) return
    const learnerMessage: CoachMessage = { id: crypto.randomUUID(), role: 'learner', text: responseText }
    const history = [...messages, learnerMessage]
    setMessages(history)
    setInput('')
    setWorking(true)
    const feedback = await requestCoachFeedback(responseText, scenario, targetExpressions, history)
    const coachMessage: CoachMessage = { id: crypto.randomUUID(), role: 'coach', text: feedback.nextPrompt, feedback }
    setMessages((items) => [...items, coachMessage])
    learningStore.recordPractice(mode === 'guided-voice' ? 'voice' : 'chat', feedback.matchedExpressions)
    setWorking(false)
  }

  const toggleListening = () => {
    if (listening) {
      recognizerRef.current?.stop()
      return
    }
    setSpeechError('')
    recognizerRef.current = createSpeechRecognizer(
      (transcript, final) => {
        setInput(transcript)
        if (final && transcript) submit(transcript)
      },
      setListening,
      setSpeechError,
    )
    if (!recognizerRef.current) {
      setSpeechError('当前浏览器没有提供语音转写，请使用文字输入或实时语音')
      return
    }
    recognizerRef.current.start()
  }

  return (
    <div className="practice-page page-stack">
      <section className="practice-mode-tabs surface">
        <button className={mode === 'text' ? 'active' : ''} onClick={() => setMode('text')}><Keyboard size={18} /><span><strong>文字对练</strong><small>逐轮分析表达选择</small></span></button>
        <button className={mode === 'guided-voice' ? 'active' : ''} onClick={() => setMode('guided-voice')}><Mic size={18} /><span><strong>引导语音</strong><small>说完一轮立即复盘</small></span></button>
        <button className={mode === 'live' ? 'active' : ''} onClick={() => setMode('live')}><AudioLines size={18} /><span><strong>实时语音</strong><small>连续自然对话</small></span></button>
      </section>

      {learnedExpressions.length === 0 ? (
        <section className="practice-empty surface">
          <BookOpenCheck size={30} />
          <span className="section-kicker">练习内容尚未解锁</span>
          <h2>先完整学会一条表达，再进入对练</h2>
          <p>文字和语音教练只会调用学习记录里已经见过的表达，不会在练习中突然塞入新词</p>
          <button className="button button-primary" onClick={() => onNavigate('learn')}>去完成第一条学习</button>
        </section>
      ) : mode === 'live' ? (
        <div className="live-practice-layout">
          <LiveVoicePanel learnedExpressions={learnedExpressions.slice(0, 24).map((expression) => expression.phrase)} />
          <aside className="practice-guide surface">
            <span className="section-kicker">实时练习原则</span>
            <h2>先完成意思，再处理形式</h2>
            <div><span>1</span><p><strong>保持短回合</strong>一次回应表达一个态度和一个下一步</p></div>
            <div><span>2</span><p><strong>允许停顿</strong>自然停顿比用 slang 填满空白更清楚</p></div>
            <div><span>3</span><p><strong>集中纠正</strong>教练每几轮只处理最影响理解和关系的一点</p></div>
          </aside>
        </div>
      ) : !scenario ? (
        <section className="practice-empty surface">
          <BookOpenCheck size={30} />
          <span className="section-kicker">当前没有匹配的角色任务</span>
          <h2>再学习一条角色任务中的目标表达</h2>
          <p>你已经学过的内容仍可进入实时语音；文字任务会等到场景和已学表达能够准确匹配后解锁</p>
          <button className="button button-primary" onClick={() => onNavigate('learn')}>继续学习</button>
        </section>
      ) : (
        <section className="practice-layout">
          <aside className="scenario-list surface">
            <span className="section-kicker">选择角色任务</span>
            <h2>今天在哪里说？</h2>
            {availableScenarios.map((item) => (
              <button key={item.id} className={scenarioId === item.id ? 'active' : ''} onClick={() => setScenarioId(item.id)}>
                <span><strong>{item.title}</strong><small>{item.relationship}</small></span><ChevronRight size={17} />
              </button>
            ))}
          </aside>

          <article className="chat-workspace surface">
            <header className="chat-header">
              <div><span className="coach-avatar"><Sparkles size={18} /></span><span><strong>Saylo 教练</strong><small>{scenario.setting}</small></span></div>
              <button onClick={() => speakEnglish(scenario.opening)}><Headphones size={17} /> 重听开场</button>
            </header>

            <div className="task-ribbon">
              <span>本轮目标</span><strong>{scenario.goal}</strong>
              <div>{targetExpressions.map((expression) => expression && <button key={expression.id} onClick={() => speakEnglish(expression.phrase)}>{expression.phrase}</button>)}</div>
            </div>

            <div className="message-list">
              {messages.map((message) => (
                <div key={message.id} className={`message-row ${message.role}`}>
                  <div className="message-bubble">
                    <span>{message.role === 'coach' ? 'Saylo' : '你'}</span>
                    <p>{message.text}</p>
                    {message.role === 'coach' && <button className="message-audio" onClick={() => speakEnglish(message.text)} aria-label="播放教练消息"><Headphones size={15} /></button>}
                  </div>
                  {message.feedback && <FeedbackCard feedback={message.feedback} />}
                </div>
              ))}
              {working && <div className="coach-thinking"><LoaderCircle className="spin" size={18} /> 教练正在分析场景和语气</div>}
              <div ref={messagesEndRef} />
            </div>

            <footer className="chat-input-area">
              {mode === 'guided-voice' && (
                <div className="voice-guidance">
                  <ShieldCheck size={16} />
                  <span>{canRecognizeSpeech() ? '浏览器将语音转成文字，Saylo 只保存文字练习结果' : '当前浏览器需要改用文字输入，或在配置后使用实时语音'}</span>
                </div>
              )}
              {speechError && <p className="inline-error">{speechError}</p>}
              <div className="composer">
                {mode === 'guided-voice' && (
                  <button className={`mic-button ${listening ? 'listening' : ''}`} onClick={toggleListening} aria-label={listening ? '停止录音' : '开始录音'}>
                    {listening ? <Square size={17} fill="currentColor" /> : <Mic size={20} />}
                  </button>
                )}
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit() } }}
                  placeholder={mode === 'guided-voice' ? (listening ? '正在听你说…' : '点击麦克风，或在这里输入回应') : '用英语回应 Saylo…'}
                  rows={2}
                />
                <button className="send-button" onClick={() => submit()} disabled={!input.trim() || working} aria-label="发送回应"><Send size={19} /></button>
              </div>
              <small>Enter 发送 · Shift + Enter 换行</small>
            </footer>
          </article>
        </section>
      )}
    </div>
  )
}

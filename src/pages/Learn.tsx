import { ArrowLeft, ArrowRight, CheckCircle2, Headphones, Lightbulb, LoaderCircle, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { PageId } from '../components/AppShell'
import { FeedbackCard } from '../components/FeedbackCard'
import { RiskBadge } from '../components/RiskBadge'
import { modules } from '../data/curriculum'
import { expressionById, expressionsByModule } from '../data/expressions'
import { contentSourceById } from '../data/sources'
import { buildLessonFeedback, mergeLessonFeedback, requestCoachFeedback } from '../lib/coach'
import { speakEnglish } from '../lib/speech'
import { isAllowedInActiveLesson } from '../lib/contentPolicy'
import { learningStore, useLearningStore } from '../store/learningStore'
import type { CoachMessage, CoachScenario, FeedbackResult } from '../types'

export function Learn({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  const progress = useLearningStore((state) => state.progress)
  const comfort = useLearningStore((state) => state.profile.comfort)
  const recommendedModule = modules.find((module) => expressionsByModule(module.id).some((expression) => isAllowedInActiveLesson(expression, comfort) && !progress[expression.id]?.seen))?.id ?? modules[0].id
  const [moduleId, setModuleId] = useState(recommendedModule)
  const createSessionIds = (selectedModule: string) => {
    const cards = expressionsByModule(selectedModule).filter((expression) => isAllowedInActiveLesson(expression, comfort))
    const unseen = cards.filter((expression) => !progress[expression.id]?.seen)
    const familiar = cards.filter((expression) => progress[expression.id]?.seen)
    return [...unseen, ...familiar].slice(0, 4).map((expression) => expression.id)
  }
  const [sessionIds, setSessionIds] = useState(() => createSessionIds(recommendedModule))
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<'judge' | 'explain' | 'produce'>('judge')
  const [judgement, setJudgement] = useState('')
  const [draft, setDraft] = useState('')
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null)
  const [evaluatedDraft, setEvaluatedDraft] = useState('')
  const [evaluating, setEvaluating] = useState(false)
  const [completed, setCompleted] = useState<string[]>([])
  const module = modules.find((item) => item.id === moduleId) ?? modules[0]

  const sessionCards = useMemo(() => sessionIds
    .map((id) => expressionById.get(id))
    .filter((expression): expression is NonNullable<typeof expression> => Boolean(expression)), [sessionIds])

  const current = sessionCards[index]

  useEffect(() => {
    setSessionIds(createSessionIds(moduleId))
    setIndex(0)
    setPhase('judge')
    setJudgement('')
    setDraft('')
    setFeedback(null)
    setEvaluatedDraft('')
    setEvaluating(false)
    setCompleted([])
  }, [moduleId])

  const continueSession = () => {
    if (!current) return
    if (!completed.includes(current.id)) {
      learningStore.markSeen(current.id)
      setCompleted((items) => [...items, current.id])
    }
    if (index < sessionCards.length - 1) {
      setIndex((value) => value + 1)
      setPhase('judge')
      setJudgement('')
      setDraft('')
      setFeedback(null)
      setEvaluatedDraft('')
    } else {
      setIndex(sessionCards.length)
    }
  }

  const evaluateDraft = async () => {
    const submitted = draft.trim()
    if (!current || submitted.length < 1 || evaluating) return

    const scenario: CoachScenario = {
      id: `lesson-${current.id}`,
      title: current.phrase,
      setting: current.scenes.join('、'),
      relationship: current.relationship,
      opening: current.examples[0].line,
      goal: current.production === '识别为主'
        ? `Use a neutral alternative to answer this task: ${current.prompt}`
        : `Answer this task with ${current.phrase}: ${current.prompt}`,
      followUpPrompts: ['Try one more version in the same situation.'],
      suggestedExpressionIds: [current.id],
    }
    const history: CoachMessage[] = [{ id: crypto.randomUUID(), role: 'learner', text: submitted }]

    setEvaluating(true)
    try {
      const result = await requestCoachFeedback(submitted, scenario, [current], history)
      const local = buildLessonFeedback(submitted, current)
      setFeedback(result.source === 'local' ? local : mergeLessonFeedback(result, local))
      setEvaluatedDraft(submitted)
    } finally {
      setEvaluating(false)
    }
  }

  const judgementOptions = current ? Array.from(new Set([
    current.function,
    ...sessionCards.filter((card) => card.id !== current.id).map((card) => card.function),
    '描述客观事实',
    '结束所有对话',
  ])).slice(0, 3) : []
  const feedbackMatchesDraft = Boolean(feedback && evaluatedDraft === draft.trim())
  const feedbackRequiresRetry = Boolean(feedback?.dimensions.some((dimension) => dimension.level === '需要重试'))

  if (index >= sessionCards.length) {
    return (
      <div className="completion-card surface">
        <span className="completion-icon"><CheckCircle2 size={34} /></span>
        <span className="section-kicker">理解阶段完成</span>
        <h2>{completed.length} 条表达已经进入复习队列</h2>
        <p>下一步需要在没有答案提示的情况下回忆，再放进一段真实回应</p>
        <div className="completion-actions">
          <button className="button button-primary" onClick={() => onNavigate('review')}><RotateCcw size={17} /> 开始回忆</button>
          <button className="button button-secondary" onClick={() => onNavigate('practice')}>直接进入对练 <ArrowRight size={17} /></button>
        </div>
      </div>
    )
  }

  return (
    <div className="learn-page page-stack">
      <section className="module-tabs" aria-label="选择学习单元">
        {modules.map((item) => (
          <button key={item.id} className={moduleId === item.id ? 'active' : ''} onClick={() => setModuleId(item.id)}>
            <span style={{ background: item.accent }}>{item.order}</span>
            <strong>{item.title}</strong>
          </button>
        ))}
      </section>

      <section className="learn-layout">
        <aside className="lesson-context surface">
          <span className="section-kicker">单元 {module.order}</span>
          <h2>{module.title}</h2>
          <p>{module.subtitle}</p>
          <div className="context-scene"><span>本单元场景</span><strong>{module.scenario}</strong></div>
          <div className="lesson-progress">
            <span>{index + 1} / {sessionCards.length}</span>
            <div>{sessionCards.map((card, cardIndex) => <i key={card.id} className={cardIndex <= index ? 'active' : ''} />)}</div>
          </div>
          <div className="micro-rule"><Lightbulb size={18} /><p>先在脑中说出意思，再翻开答案。主动回忆比重复阅读留下的证据更强</p></div>
        </aside>

        <article className="learning-card surface staged-learning-card">
          <div className="learning-stage-header">
            <div className="learning-stage-track">
              <span className={phase === 'judge' ? 'active' : 'done'}><b>1</b><small>判断场景</small></span>
              <i />
              <span className={phase === 'explain' ? 'active' : phase === 'produce' ? 'done' : ''}><b>2</b><small>理解来路</small></span>
              <i />
              <span className={phase === 'produce' ? 'active' : ''}><b>3</b><small>迁移使用</small></span>
            </div>
            <RiskBadge risk={current.risk} />
          </div>

          {phase === 'judge' && (
            <section className="learning-stage judge-stage">
              <span className="section-kicker">场景与功能</span>
              <p className="stage-prompt">{current.prompt}</p>
              <div className="stage-phrase"><h2>{current.phrase}</h2><button className="sound-button" aria-label={`播放 ${current.phrase}`} onClick={() => speakEnglish(current.phrase)}><Headphones size={19} /></button></div>
              {current.variants.length > 0 && <p className="variants">也会看到：{current.variants.join(' · ')}</p>}
              <div className="judgement-question"><strong>这条表达主要在完成什么？</strong><span>先选功能，再看答案背后的来路</span></div>
              <div className="judgement-options">{judgementOptions.map((option) => (
                <button key={option} className={judgement === option ? (option === current.function ? 'selected correct' : 'selected wrong') : ''} onClick={() => setJudgement(option)}>{option}</button>
              ))}</div>
              {judgement && <p className={`judgement-result ${judgement === current.function ? 'correct' : 'wrong'}`}>{judgement === current.function ? `判断正确：这里是在${current.function}` : `这条更准确的功能是“${current.function}”，下一步会拆清为什么`}</p>}
              <button className="button button-primary stage-next" disabled={!judgement} onClick={() => setPhase('explain')}>拆开理解 <ArrowRight size={17} /></button>
            </section>
          )}

          {phase === 'explain' && (
            <section className="learning-stage explain-stage">
              <header className="explain-hero">
                <span className="section-kicker">表达拆解</span>
                <div className="stage-phrase"><h2>{current.phrase}</h2><button className="sound-button" aria-label={`播放 ${current.examples[0].line}`} onClick={() => speakEnglish(current.examples[0].line)}><Headphones size={19} /></button></div>
                <p className="back-meaning">{current.meaning}</p>
              </header>

              <div className="explain-summary-grid">
                <section className="literal-card"><span>字面逻辑</span><p>{current.literalMeaning}</p></section>
                <section className="learn-example"><span>放进真实语境 · {current.examples[0].context}</span><blockquote>“{current.examples[0].line}”</blockquote><p>{current.examples[0].translation}</p></section>
              </div>

              <div className="origin-spread-grid">
                <div><Sparkles size={18} /><span>来源</span><strong>{current.originConfidence}</strong><p>{current.origin}</p></div>
                <div><ArrowRight size={18} /><span>传播</span><strong>{current.currency}</strong><p>{current.spread}</p></div>
              </div>
              <section className="contrast-card"><span>容易混淆</span><p>{current.contrast}</p></section>

              <footer className="explain-footer">
                <div className="lesson-source-block">
                  <span>核对资料</span>
                  <div className="lesson-sources">{current.evidenceSourceIds.map((sourceId) => contentSourceById.get(sourceId)).filter((source): source is NonNullable<typeof source> => Boolean(source)).map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer">{source.publisher} · {source.title}</a>)}</div>
                </div>
                <button className="button button-primary stage-next" onClick={() => setPhase('produce')}>我理解了，试着使用 <ArrowRight size={17} /></button>
              </footer>
            </section>
          )}

          {phase === 'produce' && (
            <section className="learning-stage produce-stage">
              <span className="section-kicker">从看懂到会判断</span>
              <h2>{current.production === '识别为主' ? '用安全替代表达回应同一场景' : '把它放进你自己的短回应'}</h2>
              <p>{current.prompt}</p>
              <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={4} aria-label={`写一句包含 ${current.phrase} 的自然回应`} placeholder={current.production === '识别为主' ? `例如使用 ${current.neutralAlternatives[0]}` : `写一句包含 ${current.phrase} 的自然回应`} />
              <div className="boundary-note"><ShieldCheck size={18} /><p><strong>使用边界</strong>{current.caution}</p></div>
              <div className="neutral-line"><span>中性替代</span>{current.neutralAlternatives.map((item) => <button key={item} onClick={() => { setDraft(item); speakEnglish(item) }}>{item}</button>)}</div>

              {feedback && (
                <div className="lesson-feedback">
                  {!feedbackMatchesDraft && <p className="lesson-feedback-note">输入内容已经修改，请重新评析后再继续</p>}
                  <FeedbackCard feedback={feedback} onAdoptRewrite={(rewrite) => setDraft(rewrite)} />
                </div>
              )}

              <footer className="lesson-feedback-actions">
                {evaluating && <span className="lesson-evaluating"><LoaderCircle className="spin" size={18} /> 正在核对场景、边界和表达</span>}
                {(!feedbackMatchesDraft || feedbackRequiresRetry) ? (
                  <button className="button button-primary" disabled={draft.trim().length < 1 || evaluating || (feedbackMatchesDraft && feedbackRequiresRetry)} onClick={evaluateDraft}>
                    {evaluating ? '正在评析' : feedbackMatchesDraft && feedbackRequiresRetry ? '请先修改再评析' : feedback ? '重新提交评析' : '提交并获取评析'} <ArrowRight size={17} />
                  </button>
                ) : (
                  <div>
                    <button className="button button-secondary" disabled={evaluating} onClick={evaluateDraft}>再次评析</button>
                    <button className="button button-primary" onClick={continueSession}>{index < sessionCards.length - 1 ? '接受评析，学习下一条' : '接受评析，完成本轮'} <ArrowRight size={17} /></button>
                  </div>
                )}
              </footer>
            </section>
          )}
        </article>
      </section>

      <div className="card-controls">
        <button className="icon-button" onClick={() => { if (phase === 'produce') setPhase('explain'); else if (phase === 'explain') setPhase('judge'); else if (index > 0) { setIndex((value) => value - 1); setPhase('judge'); setJudgement(''); setDraft('') } }} disabled={index === 0 && phase === 'judge'}><ArrowLeft size={19} /></button>
        <span>场景判断 → 来路与边界 → 自己迁移</span>
        <button className="icon-button" onClick={() => { if (phase === 'judge' && judgement) setPhase('explain'); else if (phase === 'explain') setPhase('produce') }} disabled={phase === 'produce' || (phase === 'judge' && !judgement)}><ArrowRight size={19} /></button>
      </div>
    </div>
  )
}

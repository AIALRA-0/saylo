import { ArrowRight, CheckCircle2, Eye, Headphones, RotateCcw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Rating, previewIntervals, type Grade } from '../lib/scheduler'
import { expressions } from '../data/expressions'
import { speakEnglish } from '../lib/speech'
import { learningStore, useLearningStore } from '../store/learningStore'
import type { PageId } from '../components/AppShell'

const ratingOptions = [
  { rating: Rating.Again, label: '想不起来', key: 'again' as const, className: 'again' },
  { rating: Rating.Hard, label: '有点吃力', key: 'hard' as const, className: 'hard' },
  { rating: Rating.Good, label: '顺利想起', key: 'good' as const, className: 'good' },
  { rating: Rating.Easy, label: '非常自然', key: 'easy' as const, className: 'easy' },
] satisfies Array<{ rating: Grade; label: string; key: 'again' | 'hard' | 'good' | 'easy'; className: string }>

export function Review({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  const progress = useLearningStore((state) => state.progress)
  const dueQueue = useMemo(() => expressions.filter((expression) => {
    const record = progress[expression.id]
    return record?.seen > 0 && new Date(record.card.due).getTime() <= Date.now()
  }).slice(0, 12), [progress])
  const [queueIds] = useState(() => dueQueue.map((item) => item.id))
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [reviewed, setReviewed] = useState(0)
  const current = expressions.find((item) => item.id === queueIds[index])
  const currentProgress = current ? progress[current.id] : undefined
  const intervals = currentProgress ? previewIntervals(currentProgress.card) : null

  const rate = (rating: Grade) => {
    if (!current) return
    learningStore.review(current.id, rating)
    setReviewed((value) => value + 1)
    setIndex((value) => value + 1)
    setRevealed(false)
  }

  if (queueIds.length === 0) {
    return (
      <div className="completion-card surface">
        <span className="completion-icon mint"><CheckCircle2 size={34} /></span>
        <span className="section-kicker">复习队列清空</span>
        <h2>目前没有到期表达</h2>
        <p>FSRS 会根据你的回忆结果安排下一次出现。现在可以学习新内容或进入角色任务</p>
        <div className="completion-actions">
          <button className="button button-primary" onClick={() => onNavigate('learn')}>学习新表达 <ArrowRight size={17} /></button>
          <button className="button button-secondary" onClick={() => onNavigate('practice')}>进入对练</button>
        </div>
      </div>
    )
  }

  if (!current) {
    return (
      <div className="completion-card surface">
        <span className="completion-icon"><CheckCircle2 size={34} /></span>
        <span className="section-kicker">本轮完成</span>
        <h2>你完成了 {reviewed} 次主动回忆</h2>
        <p>复习时间已经根据本轮结果更新。用一次目标表达，可以增加更强的迁移证据</p>
        <button className="button button-primary" onClick={() => onNavigate('practice')}>带着表达去对练 <ArrowRight size={17} /></button>
      </div>
    )
  }

  return (
    <div className="review-page page-stack">
      <section className="review-status surface">
        <div><RotateCcw size={19} /><span>本轮进度</span><strong>{index + 1}/{queueIds.length}</strong></div>
        <div className="review-line"><span style={{ width: `${(index / queueIds.length) * 100}%` }} /></div>
        <p>先说出合适表达，再查看答案</p>
      </section>

      <article className="review-card surface">
        <div className="review-prompt">
          <span className="section-kicker">{current.function} · {current.examples[0].context}</span>
          <h2>{current.review.prompt}</h2>
          <p>先说出一个能完成“{current.function}”的回应，再查看参考答案</p>
        </div>

        {!revealed ? (
          <button className="button button-primary reveal-answer" onClick={() => setRevealed(true)}><Eye size={18} /> 查看答案</button>
        ) : (
          <div className="review-answer">
            <div className="answer-heading"><h2>{current.phrase}</h2><button className="sound-button" onClick={() => speakEnglish(current.review.modelAnswer)}><Headphones size={19} /></button></div>
            <blockquote>“{current.review.modelAnswer}”</blockquote>
            <p>{current.review.explanation}</p>
            {current.review.acceptableAnswers.some((answer) => answer.toLowerCase() !== current.phrase.toLowerCase()) && <div className="acceptable-answers"><span>同样可接受</span>{current.review.acceptableAnswers.filter((answer) => answer.toLowerCase() !== current.phrase.toLowerCase()).map((answer) => <small key={answer}>{answer}</small>)}</div>}
            <div className="rating-label"><span>对照你的回忆</span><small>选择真实感受，调度器才会有效</small></div>
            <div className="rating-grid">
              {ratingOptions.map((option) => (
                <button key={option.rating} className={option.className} onClick={() => rate(option.rating)}>
                  <strong>{option.label}</strong>
                  <span>约 {intervals?.[option.key]}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  )
}

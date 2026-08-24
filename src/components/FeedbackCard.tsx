import { AlertCircle, CheckCircle2, Headphones, Replace } from 'lucide-react'
import { speakEnglish } from '../lib/speech'
import type { FeedbackResult } from '../types'

interface FeedbackCardProps {
  feedback: FeedbackResult
  onAdoptRewrite?: (rewrite: string) => void
}

export function FeedbackCard({ feedback, onAdoptRewrite }: FeedbackCardProps) {
  const requiresRetry = feedback.dimensions.some((dimension) => dimension.level === '需要重试')

  return (
    <div className="feedback-card">
      <div className="feedback-body">
        <div className="feedback-title">
          {requiresRetry ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <div className="feedback-heading"><small>逐句评析</small><strong>{feedback.headline}</strong></div>
          <span className={`feedback-verdict ${requiresRetry ? 'retry' : 'ready'}`}>{requiresRetry ? '修改后重试' : '可以继续'}</span>
        </div>
        <p className="feedback-meta">{feedback.method} · 置信度{feedback.confidence}</p>

        <div className="feedback-rubric">{feedback.dimensions.map((dimension) => (
          <div key={dimension.id} className={`feedback-dimension ${dimension.level}`}>
            <span>{dimension.label}</span>
            <strong>{dimension.level}</strong>
            <p>{dimension.evidence}</p>
            <small>{dimension.suggestion}</small>
          </div>
        ))}</div>

        <div className="feedback-columns">
          <div><span>做得好的地方</span>{feedback.strengths.map((item) => <p key={item}>✓ {item}</p>)}</div>
          <div><span>下一次调整</span>{feedback.refinements.map((item) => <p key={item}>→ {item}</p>)}</div>
        </div>

        <div className="rewrite">
          <span>{feedback.source === 'local' ? '建议版本' : '证据支持的自然改写'}</span>
          <div className="rewrite-actions">
            <button onClick={() => speakEnglish(feedback.naturalRewrite)}>{feedback.naturalRewrite} <Headphones size={15} /></button>
            {onAdoptRewrite && feedback.naturalRewrite && <button className="adopt-rewrite" onClick={() => onAdoptRewrite(feedback.naturalRewrite)}><Replace size={14} /> 放入输入框</button>}
          </div>
        </div>
        <p className="feedback-limit">{feedback.limitations}</p>
      </div>
    </div>
  )
}

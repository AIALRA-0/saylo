import { Bookmark, BookmarkCheck, Headphones, ShieldCheck, X } from 'lucide-react'
import { modules } from '../data/curriculum'
import { contentSourceById } from '../data/sources'
import { speakEnglish } from '../lib/speech'
import { learningStore, useLearningStore } from '../store/learningStore'
import type { ExpressionCard } from '../types'
import { RiskBadge } from './RiskBadge'

export function ExpressionDetail({ expression, onClose }: { expression: ExpressionCard; onClose: () => void }) {
  const saved = useLearningStore((state) => state.savedIds.includes(expression.id))
  const module = modules.find((item) => item.id === expression.module)

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="expression-title">
      <button className="modal-scrim" onClick={onClose} aria-label="关闭表达详情" />
      <article className="expression-detail">
        <div className="detail-topline">
          <RiskBadge risk={expression.risk} />
          <button className="icon-button" onClick={onClose} aria-label="关闭"><X size={20} /></button>
        </div>

        <header>
          <p>{module?.title} · {expression.function}</p>
          <div className="phrase-line">
            <h2 id="expression-title">{expression.phrase}</h2>
            <button className="sound-button" onClick={() => speakEnglish(expression.phrase)} aria-label={`播放 ${expression.phrase}`}>
              <Headphones size={19} />
            </button>
          </div>
          <p className="meaning">{expression.meaning}</p>
          <p className="literal-meaning"><span>字面怎么来</span>{expression.literalMeaning}</p>
        </header>

        <section className="example-block">
          <span>{expression.examples[0].context}</span>
          <blockquote>“{expression.examples[0].line}”</blockquote>
          <p>{expression.examples[0].translation}</p>
        </section>

        <section className="detail-grid">
          <div><span>适合关系</span><strong>{expression.relationship}</strong></div>
          <div><span>常见语气</span><strong>{expression.tone}</strong></div>
          <div><span>表达来源 · {expression.originConfidence}</span><strong>{expression.origin}</strong></div>
          <div><span>传播路径 · {expression.currency}</span><strong>{expression.spread}</strong></div>
        </section>

        <section className="source-list">
          <span>核查资料</span>
          <div>{expression.evidenceSourceIds.map((sourceId) => contentSourceById.get(sourceId)).filter((source): source is NonNullable<typeof source> => Boolean(source)).map((source) => (
            <a key={source.id} href={source.url} target="_blank" rel="noreferrer"><strong>{source.publisher}</strong><small>{source.title}</small></a>
          ))}</div>
        </section>

        <section className="caution-card">
          <ShieldCheck size={20} />
          <div><strong>使用边界</strong><p>{expression.caution}</p></div>
        </section>

        <section className="alternatives">
          <span>拿不准时可以这样说</span>
          <div>{expression.neutralAlternatives.map((alternative) => <button key={alternative} onClick={() => speakEnglish(alternative)}>{alternative}</button>)}</div>
        </section>

        <footer>
          <button className="button button-secondary" onClick={() => learningStore.toggleSaved(expression.id)}>
            {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
            {saved ? '已收藏' : '收藏表达'}
          </button>
          <button className="button button-primary" onClick={() => { learningStore.markSeen(expression.id); onClose() }}>加入学习</button>
        </footer>
      </article>
    </div>
  )
}

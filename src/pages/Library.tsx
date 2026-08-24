import { Bookmark, Filter, Headphones, Search, SlidersHorizontal } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { PageId } from '../components/AppShell'
import { ExpressionDetail } from '../components/ExpressionDetail'
import { RiskBadge } from '../components/RiskBadge'
import { modules } from '../data/curriculum'
import { searchExpressions } from '../data/expressions'
import { speakEnglish } from '../lib/speech'
import { useLearningStore } from '../store/learningStore'
import type { ExpressionCard } from '../types'

export function Library({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  const savedIds = useLearningStore((state) => state.savedIds)
  const [query, setQuery] = useState('')
  const [risk, setRisk] = useState('all')
  const [moduleId, setModuleId] = useState('all')
  const [visibleCount, setVisibleCount] = useState(30)
  const [selected, setSelected] = useState<ExpressionCard | null>(null)
  const results = useMemo(() => searchExpressions(query, risk, moduleId), [query, risk, moduleId])
  const visibleResults = results.slice(0, visibleCount)

  useEffect(() => setVisibleCount(30), [query, risk, moduleId])

  return (
    <div className="library-page page-stack">
      <section className="library-tools surface">
        <label className="search-box">
          <Search size={19} />
          <input aria-label="搜索表达" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索表达、含义或场景" />
          <kbd>{results.length} 条</kbd>
        </label>
        <div className="filter-row">
          <span><Filter size={16} /> 使用边界</span>
          {[
            ['all', '全部'],
            ['green', '可以主动使用'],
            ['yellow', '观察后使用'],
            ['red', '先听懂'],
          ].map(([value, label]) => <button key={value} className={risk === value ? 'active' : ''} onClick={() => setRisk(value)}>{label}</button>)}
        </div>
        <div className="filter-row module-filters">
          <span><SlidersHorizontal size={16} /> 单元</span>
          <button className={moduleId === 'all' ? 'active' : ''} onClick={() => setModuleId('all')}>全部单元</button>
          {modules.map((module) => <button key={module.id} className={moduleId === module.id ? 'active' : ''} onClick={() => setModuleId(module.id)}>{module.order}. {module.title}</button>)}
        </div>
      </section>

      <section className="expression-grid" aria-live="polite">
        {visibleResults.map((expression) => {
          const module = modules.find((item) => item.id === expression.module)
          return (
            <article key={expression.id} className="expression-tile" onClick={() => setSelected(expression)}>
              <div className="tile-top">
                <span style={{ '--module-accent': module?.accent } as React.CSSProperties}>{module?.order.toString().padStart(2, '0')}</span>
                <RiskBadge risk={expression.risk} compact />
                {savedIds.includes(expression.id) && <Bookmark size={15} fill="currentColor" />}
              </div>
              <div>
                <h2>{expression.phrase}</h2>
                <p>{expression.meaning}</p>
              </div>
              <div className="tile-example">“{expression.examples[0].line}”</div>
              <footer>
                <span>{expression.function}</span>
                <button onClick={(event) => { event.stopPropagation(); speakEnglish(expression.phrase) }} aria-label={`播放 ${expression.phrase}`}><Headphones size={17} /></button>
              </footer>
            </article>
          )
        })}
      </section>

      {visibleCount < results.length && <button className="button button-secondary load-more" onClick={() => setVisibleCount((count) => count + 30)}>再显示 {Math.min(30, results.length - visibleCount)} 条</button>}

      {results.length === 0 && (
        <div className="empty-state surface"><Search size={28} /><h2>没有找到匹配表达</h2><p>尝试缩短关键词或清除筛选条件</p><button className="button button-secondary" onClick={() => { setQuery(''); setRisk('all'); setModuleId('all') }}>清除筛选</button></div>
      )}

      <section className="library-cta surface">
        <div><span className="section-kicker">从理解进入输出</span><h2>浏览之后，用一次才算开始掌握</h2></div>
        <button className="button button-primary" onClick={() => onNavigate('practice')}>进入对练</button>
      </section>

      {selected && <ExpressionDetail expression={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

import { ArrowRight, AudioLines, BookOpenText, CheckCircle2, Clock3, Play, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react'
import type { PageId } from '../components/AppShell'
import { modules } from '../data/curriculum'
import { expressionsByModule } from '../data/expressions'
import { getLearningStats } from '../lib/analytics'
import { useLearningStore } from '../store/learningStore'

export function Dashboard({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  const state = useLearningStore((current) => current)
  const stats = getLearningStats(state)
  const firstName = state.profile.name || '今天'
  const learnedByModule = (moduleId: string) => expressionsByModule(moduleId).filter((expression) => state.progress[expression.id]?.seen > 0).length
  const nextModule = modules.find((module) => learnedByModule(module.id) < expressionsByModule(module.id).length) ?? modules[modules.length - 1]

  return (
    <div className="dashboard page-stack">
      <section className="hero-card">
        <div className="hero-copy">
          <span className="section-kicker"><Sparkles size={14} /> {firstName}的下一小步</span>
          <h2>先听懂，再判断，最后说出口</h2>
          <p>今天从“{nextModule.title}”继续。完成一轮大约需要 {state.profile.dailyMinutes} 分钟，练习结果会进入复习计划</p>
          <div className="hero-actions">
            <button className="button button-light" onClick={() => onNavigate('learn')}><Play size={17} fill="currentColor" /> 开始今日训练</button>
            <button className="text-link light" onClick={() => onNavigate('library')}>先浏览表达 <ArrowRight size={16} /></button>
          </div>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <div className="orbit-ring orbit-one" />
          <div className="orbit-ring orbit-two" />
          <div className="orbit-core"><span>{stats.progressPercent}%</span><small>已探索</small></div>
          <span className="orbit-word word-one">context</span>
          <span className="orbit-word word-two">voice</span>
          <span className="orbit-word word-three">timing</span>
        </div>
      </section>

      <section className="daily-grid">
        <article className="daily-main surface">
          <div className="section-heading">
            <div><span className="section-kicker">今日路线</span><h2>一轮完整练习</h2></div>
            <span className="time-pill"><Clock3 size={15} /> {state.profile.dailyMinutes} 分钟</span>
          </div>
          <div className="route-list">
            <button onClick={() => onNavigate('learn')}>
              <span className="route-index">01</span>
              <span className="route-icon amber"><BookOpenText size={20} /></span>
              <span><strong>理解 4 条表达</strong><small>含义、关系、语气和来源边界</small></span>
              <ArrowRight size={18} />
            </button>
            <button onClick={() => onNavigate('review')}>
              <span className="route-index">02</span>
              <span className="route-icon mint"><RotateCcw size={20} /></span>
              <span><strong>完成 {Math.max(stats.due, 4)} 次回忆</strong><small>先想答案，再查看提示</small></span>
              <ArrowRight size={18} />
            </button>
            <button onClick={() => onNavigate('practice')}>
              <span className="route-index">03</span>
              <span className="route-icon violet"><AudioLines size={20} /></span>
              <span><strong>进入 1 个角色任务</strong><small>文字或语音回应，随后获得反馈</small></span>
              <ArrowRight size={18} />
            </button>
          </div>
        </article>

        <aside className="daily-side surface">
          <span className="section-kicker">真正会用</span>
          <div className="big-metric"><strong>{stats.produced}</strong><span>条表达已经进入你的主动输出</span></div>
          <div className="metric-row"><span>已经理解</span><strong>{stats.learned}</strong></div>
          <div className="metric-row"><span>累计复习</span><strong>{stats.totalReviews}</strong></div>
          <div className="metric-row"><span>对练回合</span><strong>{stats.practiceCount}</strong></div>
          <button className="text-link" onClick={() => onNavigate('progress')}>查看迁移证据 <ArrowRight size={16} /></button>
        </aside>
      </section>

      <section className="module-section">
        <div className="section-heading">
          <div><span className="section-kicker">{modules.length} 个语用单元</span><h2>沿着真实关系逐步扩展</h2></div>
          <button className="text-link" onClick={() => onNavigate('library')}>查看全部 <ArrowRight size={16} /></button>
        </div>
        <div className="module-strip">
          {modules.slice(0, 4).map((module) => {
            const learned = learnedByModule(module.id)
            const total = expressionsByModule(module.id).length
            return (
              <button key={module.id} className="module-card" onClick={() => onNavigate('learn')} style={{ '--module-accent': module.accent } as React.CSSProperties}>
                <span className="module-number">{String(module.order).padStart(2, '0')}</span>
                <span className="module-dot" />
                <strong>{module.title}</strong>
                <small>{module.subtitle}</small>
                <div className="module-progress"><span style={{ width: `${(learned / total) * 100}%` }} /></div>
                <p>{learned}/{total} 条</p>
              </button>
            )
          })}
        </div>
      </section>

      <section className="principle-banner">
        <ShieldCheck size={24} />
        <div><strong>自然不等于堆叠 slang</strong><p>每次练习优先选择适合关系和场景的表达。来源敏感内容会告诉你何时只需听懂</p></div>
        <CheckCircle2 size={20} />
      </section>
    </div>
  )
}

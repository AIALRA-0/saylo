import { ArrowRight, AudioLines, BarChart3, BookOpenText, CalendarDays, MessageCircle, Sparkles, Target } from 'lucide-react'
import type { PageId } from '../components/AppShell'
import { modules } from '../data/curriculum'
import { expressionById, expressionsByModule } from '../data/expressions'
import { getLearningStats, getWeeklyActivity } from '../lib/analytics'
import { useLearningStore } from '../store/learningStore'

export function Progress({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  const state = useLearningStore((current) => current)
  const stats = getLearningStats(state)
  const week = getWeeklyActivity(state)
  const maxActivity = Math.max(...week.map((day) => day.count), 1)
  const recentPractices = state.activities.filter((record) => record.type === 'chat' || record.type === 'voice').slice(0, 5)

  return (
    <div className="progress-page page-stack">
      <section className="metric-cards">
        <article><span className="metric-icon amber"><BookOpenText size={20} /></span><div><small>已经理解</small><strong>{stats.learned}</strong><p>共 {stats.librarySize} 条</p></div></article>
        <article><span className="metric-icon mint"><MessageCircle size={20} /></span><div><small>主动输出</small><strong>{stats.produced}</strong><p>在文字或语音中用过</p></div></article>
        <article><span className="metric-icon violet"><Target size={20} /></span><div><small>有效对练</small><strong>{stats.practiceCount}</strong><p>已完成的文字和语音回合</p></div></article>
        <article><span className="metric-icon coral"><CalendarDays size={20} /></span><div><small>连续练习</small><strong>{stats.streak}</strong><p>天</p></div></article>
      </section>

      <section className="progress-grid">
        <article className="activity-chart surface">
          <div className="section-heading"><div><span className="section-kicker">最近 7 天</span><h2>练习节奏</h2></div><BarChart3 size={20} /></div>
          <div className="bar-chart">
            {week.map((day, index) => (
              <div key={`${day.label}-${index}`}>
                <span className="bar-value">{day.count || ''}</span>
                <div><i style={{ height: `${Math.max(8, (day.count / maxActivity) * 100)}%` }} /></div>
                <small>{day.label}</small>
              </div>
            ))}
          </div>
          <p className="chart-note">柱形记录当天发生的学习、复习或对练次数。数量来自当前浏览器的本地学习记录</p>
        </article>

        <article className="transfer-card surface">
          <span className="section-kicker">核心指标</span>
          <h2>迁移比记住更重要</h2>
          <div className="transfer-visual">
            <div className="transfer-ring" style={{ '--progress': `${stats.learned ? (stats.produced / stats.learned) * 360 : 0}deg` } as React.CSSProperties}>
              <strong>{stats.learned ? Math.round((stats.produced / stats.learned) * 100) : 0}%</strong><span>输出迁移率</span>
            </div>
          </div>
          <p>输出迁移率按照“在练习中使用过的表达 ÷ 已经理解的表达”计算。它只描述当前浏览器中的练习记录</p>
          <button className="text-link" onClick={() => onNavigate('practice')}>提高迁移率 <ArrowRight size={16} /></button>
        </article>
      </section>

      <section className="module-mastery surface">
        <div className="section-heading"><div><span className="section-kicker">单元进度</span><h2>哪里已经形成输出</h2></div></div>
        <div className="mastery-list">
          {modules.map((module) => {
            const cards = expressionsByModule(module.id)
            const learned = cards.filter((card) => state.progress[card.id]?.seen > 0).length
            const produced = cards.filter((card) => (state.progress[card.id]?.used ?? 0) + (state.progress[card.id]?.spoken ?? 0) > 0).length
            return (
              <div key={module.id} className="mastery-row">
                <span className="mastery-number" style={{ background: module.accent }}>{module.order}</span>
                <div className="mastery-name"><strong>{module.title}</strong><small>{module.subtitle}</small></div>
                <div className="mastery-bars">
                  <div><span>理解</span><i><b style={{ width: `${(learned / cards.length) * 100}%` }} /></i><strong>{learned}/{cards.length}</strong></div>
                  <div><span>输出</span><i><b style={{ width: `${(produced / cards.length) * 100}%` }} /></i><strong>{produced}/{cards.length}</strong></div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="evidence-row">
        <article className="recent-practice surface">
          <div className="section-heading"><div><span className="section-kicker">最近证据</span><h2>对练记录</h2></div><AudioLines size={20} /></div>
          {recentPractices.length ? recentPractices.map((record) => (
            <div key={record.id} className="practice-record">
              <span className={record.type}><>{record.type === 'voice' ? <AudioLines size={16} /> : <MessageCircle size={16} />}</></span>
              <div><strong>{record.type === 'voice' ? '语音回应' : '文字回应'}</strong><small>{new Date(record.createdAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</small></div>
              <b>1 回合</b>
            </div>
          )) : <div className="mini-empty"><Sparkles size={22} /><p>完成第一次角色任务后，这里会显示反馈证据</p></div>}
        </article>

        <article className="saved-evidence surface">
          <div className="section-heading"><div><span className="section-kicker">你的收藏</span><h2>准备再练一次</h2></div></div>
          {state.savedIds.slice(0, 5).map((id) => expressionById.get(id)).filter(Boolean).map((expression) => expression && (
            <button key={expression.id} onClick={() => onNavigate('library')}><span>{expression.phrase}</span><small>{expression.meaning}</small><ArrowRight size={15} /></button>
          ))}
          {state.savedIds.length === 0 && <div className="mini-empty"><p>在表达详情中收藏需要反复观察的内容</p><button className="text-link" onClick={() => onNavigate('library')}>打开表达地图 <ArrowRight size={15} /></button></div>}
        </article>
      </section>
    </div>
  )
}

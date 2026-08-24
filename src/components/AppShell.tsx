import type { ReactNode } from 'react'
import {
  AudioLines,
  BarChart3,
  BookOpenText,
  Compass,
  Flame,
  Home,
  LibraryBig,
  Menu,
  Settings as SettingsIcon,
  Sparkles,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { getLearningStats } from '../lib/analytics'
import { useLearningStore } from '../store/learningStore'

export type PageId = 'home' | 'library' | 'learn' | 'practice' | 'review' | 'progress' | 'settings'

const navigation: Array<{ id: PageId; label: string; icon: typeof Home }> = [
  { id: 'home', label: '今天', icon: Home },
  { id: 'library', label: '表达地图', icon: LibraryBig },
  { id: 'learn', label: '学习', icon: BookOpenText },
  { id: 'practice', label: '对练', icon: AudioLines },
  { id: 'review', label: '复习', icon: Compass },
  { id: 'progress', label: '进度', icon: BarChart3 },
]

interface AppShellProps {
  page: PageId
  title: { eyebrow: string; title: string }
  onNavigate: (page: PageId) => void
  children: ReactNode
}

export function AppShell({ page, title, onNavigate, children }: AppShellProps) {
  const state = useLearningStore((current) => current)
  const stats = getLearningStats(state)
  const [mobileOpen, setMobileOpen] = useState(false)

  const moveTo = (nextPage: PageId) => {
    onNavigate(nextPage)
    setMobileOpen(false)
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? 'sidebar--open' : ''}`}>
        <button className="sidebar-close icon-button" onClick={() => setMobileOpen(false)} aria-label="关闭导航">
          <X size={20} />
        </button>
        <button className="brand" onClick={() => moveTo('home')} aria-label="返回今天">
          <span className="brand-mark"><Sparkles size={20} /></span>
          <span>
            <strong>Saylo</strong>
            <small>Make it sound like you</small>
          </span>
        </button>

        <nav className="side-nav" aria-label="主导航">
          <p className="nav-label">学习空间</p>
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.id} className={page === item.id ? 'active' : ''} onClick={() => moveTo(item.id)}>
                <Icon size={19} strokeWidth={1.8} />
                <span>{item.label}</span>
                {item.id === 'review' && stats.due > 0 && <b>{stats.due}</b>}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-foot">
          <div className="streak-tile">
            <span className="streak-icon"><Flame size={19} /></span>
            <span><strong>{stats.streak} 天</strong><small>连续练习</small></span>
          </div>
          <button className={page === 'settings' ? 'settings-link active' : 'settings-link'} onClick={() => moveTo('settings')}>
            <SettingsIcon size={18} /> 设置与数据
          </button>
        </div>
      </aside>

      {mobileOpen && <button className="sidebar-scrim" onClick={() => setMobileOpen(false)} aria-label="关闭导航遮罩" />}

      <main className="main-area" aria-hidden={mobileOpen} inert={mobileOpen ? true : undefined}>
        <header className="topbar">
          <button className="mobile-menu icon-button" onClick={() => setMobileOpen(true)} aria-label="打开导航">
            <Menu size={21} />
          </button>
          <div className="page-heading">
            <span>{title.eyebrow}</span>
            <h1>{title.title}</h1>
          </div>
          <div className="topbar-progress" aria-label={`内容进度 ${stats.progressPercent}%`}>
            <div>
              <span>内容进度</span>
              <strong>{stats.learned}/{stats.librarySize}</strong>
            </div>
            <div className="ring" style={{ '--progress': `${stats.progressPercent * 3.6}deg` } as React.CSSProperties}>
              <span>{stats.progressPercent}%</span>
            </div>
          </div>
        </header>

        <div className="page-content">{children}</div>
      </main>

      <nav className="bottom-nav" aria-label="移动端导航" aria-hidden={mobileOpen} inert={mobileOpen ? true : undefined}>
        {navigation.slice(0, 5).map((item) => {
          const Icon = item.icon
          return (
            <button key={item.id} className={page === item.id ? 'active' : ''} onClick={() => moveTo(item.id)}>
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

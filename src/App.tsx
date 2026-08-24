import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { AppShell, type PageId } from './components/AppShell'
import { Onboarding } from './components/Onboarding'
import { useLearningStore } from './store/learningStore'

// 页面按需加载，扩大的表达库只在进入相关页面时下载，降低移动端首次启动负担
const Dashboard = lazy(() => import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })))
const Library = lazy(() => import('./pages/Library').then((module) => ({ default: module.Library })))
const Learn = lazy(() => import('./pages/Learn').then((module) => ({ default: module.Learn })))
const Practice = lazy(() => import('./pages/Practice').then((module) => ({ default: module.Practice })))
const Review = lazy(() => import('./pages/Review').then((module) => ({ default: module.Review })))
const Progress = lazy(() => import('./pages/Progress').then((module) => ({ default: module.Progress })))
const Settings = lazy(() => import('./pages/Settings').then((module) => ({ default: module.Settings })))

const pageTitles: Record<PageId, { eyebrow: string; title: string }> = {
  home: { eyebrow: '今日路线', title: '把表达练进真实对话' },
  library: { eyebrow: '表达地图', title: '先看场景，再学说法' },
  learn: { eyebrow: '理解与判断', title: '今天的新表达' },
  practice: { eyebrow: '文本与语音', title: '进入真实对话' },
  review: { eyebrow: 'FSRS 复习', title: '在忘记之前再见一次' },
  progress: { eyebrow: '迁移证据', title: '看见真正会用的部分' },
  settings: { eyebrow: '数据与偏好', title: '控制你的学习环境' },
}

export default function App() {
  const onboarded = useLearningStore((state) => state.profile.onboarded)
  const [page, setPage] = useState<PageId>(() => (window.location.hash.slice(1) as PageId) || 'home')

  // 地址散列让刷新和浏览器前进后退保持当前页面，同时避免引入额外路由依赖
  useEffect(() => {
    const onHashChange = () => setPage((window.location.hash.slice(1) as PageId) || 'home')
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const navigate = (nextPage: PageId) => {
    window.location.hash = nextPage
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const content = useMemo(() => {
    switch (page) {
      case 'library': return <Library onNavigate={navigate} />
      case 'learn': return <Learn onNavigate={navigate} />
      case 'practice': return <Practice onNavigate={navigate} />
      case 'review': return <Review onNavigate={navigate} />
      case 'progress': return <Progress onNavigate={navigate} />
      case 'settings': return <Settings />
      default: return <Dashboard onNavigate={navigate} />
    }
  }, [page])

  return (
    <>
      {/* 设置流程打开时隔离后方应用，避免手机读屏或键盘焦点误入被遮挡的导航 */}
      <div aria-hidden={!onboarded} inert={!onboarded ? true : undefined}>
        <AppShell page={page} title={pageTitles[page]} onNavigate={navigate}>
          <Suspense fallback={<div className="empty-state surface"><p>正在准备学习内容…</p></div>}>
            {content}
          </Suspense>
        </AppShell>
      </div>
      {!onboarded && <Onboarding onComplete={() => navigate('home')} />}
    </>
  )
}

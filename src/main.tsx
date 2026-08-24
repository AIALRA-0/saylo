import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

// 已打开的旧页面若遇到发布后失效的按需加载文件，只自动刷新一次以取得新入口
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  const recoveryKey = 'saylo:chunk-recovery'
  const lastRecovery = Number(sessionStorage.getItem(recoveryKey) || 0)
  if (Date.now() - lastRecovery > 30_000) {
    sessionStorage.setItem(recoveryKey, String(Date.now()))
    window.location.reload()
  }
})

// 应用只挂载一次，StrictMode 在开发阶段帮助发现副作用和状态写入问题
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// 正式站点以 Authentik 登录为访问边界，因此清理旧版离线缓存和注册记录
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    window.setTimeout(() => sessionStorage.removeItem('saylo:chunk-recovery'), 30_000)
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((registration) => registration.unregister()))
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.filter((name) => name.startsWith('saylo-')).map((name) => caches.delete(name)))
    }
  })
}

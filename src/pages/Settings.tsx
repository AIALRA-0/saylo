import { Check, Cloud, Database, Download, ExternalLink, HardDrive, KeyRound, LoaderCircle, RefreshCw, ShieldCheck, Trash2, Upload, Zap } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { goalOptions } from '../data/curriculum'
import { resetCoachCapabilityCache } from '../lib/coach'
import { learningStore, useLearningStore } from '../store/learningStore'
import type { AppState, LearnerProfile } from '../types'

interface HealthState {
  aiConfigured: boolean
  aiProvider: 'local' | 'openai' | 'deepseek'
  aiModel: string | null
  voiceConfigured: boolean
}

interface CoachSettingsState {
  provider: 'local' | 'openai' | 'deepseek'
  model: string | null
  configured: boolean
  canManage: boolean
  source: 'settings' | 'environment' | 'none'
  voiceConfigured: boolean
}

export function Settings() {
  const state = useLearningStore((current) => current)
  const [health, setHealth] = useState<HealthState | null>(null)
  const [coachSettings, setCoachSettings] = useState<CoachSettingsState | null>(null)
  const [deepSeekKey, setDeepSeekKey] = useState('')
  const [deepSeekModel, setDeepSeekModel] = useState('deepseek-v4-flash')
  const [savingCoach, setSavingCoach] = useState(false)
  const [notice, setNotice] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/health').then((response) => response.json()).then(setHealth).catch(() => setHealth({ aiConfigured: false, aiProvider: 'local', aiModel: null, voiceConfigured: false }))
    fetch('/api/settings/coach').then((response) => response.json()).then((settings: CoachSettingsState) => {
      setCoachSettings(settings)
      if (settings.provider === 'deepseek' && settings.model) setDeepSeekModel(settings.model)
    }).catch(() => setCoachSettings(null))
  }, [])

  const refreshHealth = async () => {
    const [healthResponse, settingsResponse] = await Promise.all([fetch('/api/health'), fetch('/api/settings/coach')])
    if (!healthResponse.ok || !settingsResponse.ok) throw new Error('Unable to refresh coach status')
    const nextHealth = await healthResponse.json() as HealthState
    const nextSettings = await settingsResponse.json() as CoachSettingsState
    setHealth(nextHealth)
    setCoachSettings(nextSettings)
    resetCoachCapabilityCache()
  }

  const saveDeepSeek = async () => {
    if (savingCoach || !coachSettings?.canManage) return
    setSavingCoach(true)
    try {
      const response = await fetch('/api/settings/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: deepSeekModel, apiKey: deepSeekKey }),
      })
      if (!response.ok) {
        const issue = await response.json().catch(() => ({})) as { code?: string }
        if (issue.code === 'invalid_api_key') throw new Error('DeepSeek 拒绝了这个密钥，请检查或重新生成')
        if (issue.code === 'insufficient_balance') throw new Error('DeepSeek 账户余额不足')
        if (issue.code === 'model_unavailable') throw new Error('当前账户无法使用所选模型')
        throw new Error('连接检查失败，原有设置没有改变')
      }
      setDeepSeekKey('')
      await refreshHealth()
      setNotice('DeepSeek 连接已验证并保存到服务器')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'DeepSeek 设置保存失败')
    } finally {
      setSavingCoach(false)
    }
  }

  const removeDeepSeek = async () => {
    if (!coachSettings?.canManage || !window.confirm('确认移除服务器保存的 DeepSeek 密钥吗？Saylo 将切回环境配置或本地评析')) return
    setSavingCoach(true)
    try {
      const response = await fetch('/api/settings/coach', { method: 'DELETE' })
      if (!response.ok) throw new Error('服务器密钥移除失败')
      setDeepSeekKey('')
      await refreshHealth()
      setNotice('服务器保存的 DeepSeek 密钥已移除')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '服务器密钥移除失败')
    } finally {
      setSavingCoach(false)
    }
  }

  const toggleGoal = (goal: string) => {
    const goals = state.profile.goals.includes(goal) ? state.profile.goals.filter((item) => item !== goal) : [...state.profile.goals, goal]
    if (goals.length) learningStore.updateProfile({ goals })
  }

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `saylo-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(link.href)
    setNotice('学习记录已经导出')
  }

  const importData = async (file?: File) => {
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text()) as AppState
      if (parsed.version !== 1 || !parsed.profile || !parsed.progress || !Array.isArray(parsed.activities)) throw new Error('Invalid backup')
      learningStore.importState(parsed)
      setNotice('学习记录已经恢复')
    } catch {
      setNotice('备份文件格式不符合 Saylo 版本 1 的数据结构')
    }
  }

  const resetData = () => {
    // 清空会删除当前浏览器的全部进度，因此需要用户再次确认准确范围
    if (window.confirm('确认清空这个浏览器中的全部 Saylo 学习记录吗？导出的备份仍可恢复')) {
      learningStore.reset()
      setNotice('这个浏览器中的学习记录已经清空')
    }
  }

  return (
    <div className="settings-page page-stack">
      {notice && <div className="notice-toast"><Check size={17} />{notice}<button onClick={() => setNotice('')}>关闭</button></div>}

      <section className="settings-section surface">
        <div className="settings-heading"><span className="settings-icon"><RefreshCw size={21} /></span><div><h2>学习偏好</h2><p>这些选项会改变推荐场景和每日训练长度</p></div></div>
        <div className="settings-fields">
          <label><span>称呼</span><input value={state.profile.name} onChange={(event) => learningStore.updateProfile({ name: event.target.value })} placeholder="可留空" /></label>
          <label><span>每日目标</span><select value={state.profile.dailyMinutes} onChange={(event) => learningStore.updateProfile({ dailyMinutes: Number(event.target.value) })}><option value={10}>10 分钟</option><option value={20}>20 分钟</option><option value={30}>30 分钟</option><option value={45}>45 分钟</option></select></label>
        </div>
        <span className="field-label">优先场景</span>
        <div className="choice-cloud compact">{goalOptions.map((goal) => <button key={goal} className={state.profile.goals.includes(goal) ? 'selected' : ''} onClick={() => toggleGoal(goal)}>{state.profile.goals.includes(goal) && <Check size={14} />}{goal}</button>)}</div>
      </section>

      <section className="settings-section surface">
        <div className="settings-heading"><span className="settings-icon violet"><ShieldCheck size={21} /></span><div><h2>表达和语音边界</h2><p>风险层级由表达卡决定，个人偏好控制课程展示范围</p></div></div>
        <div className="segmented-setting">
          <span>表达范围</span>
          <div>{[
            ['clean', '日常稳妥'], ['mild', '自然均衡'], ['full', '完整识别'],
          ].map(([value, label]) => <button key={value} className={state.profile.comfort === value ? 'active' : ''} onClick={() => learningStore.updateProfile({ comfort: value as LearnerProfile['comfort'] })}>{label}</button>)}</div>
        </div>
        <div className="segmented-setting">
          <span>语音处理</span>
          <div>{[
            ['local', '只用本地'], ['hybrid', '混合模式'], ['cloud', '优先云端'],
          ].map(([value, label]) => <button key={value} className={state.profile.voicePrivacy === value ? 'active' : ''} onClick={() => learningStore.updateProfile({ voicePrivacy: value as LearnerProfile['voicePrivacy'] })}>{label}</button>)}</div>
        </div>
        <div className="privacy-summary"><HardDrive size={19} /><p><strong>本地记录范围</strong>学习进度和对练活动保存在当前浏览器。原始麦克风音频没有写入 Saylo 本地记录</p></div>
      </section>

      <section className="settings-section surface">
        <div className="settings-heading"><span className="settings-icon mint"><Zap size={21} /></span><div><h2>AI 评析引擎</h2><p>云端模型分析语法、搭配、语气和文化分寸，课程规则继续守住目标表达与安全边界</p></div></div>
        <div className="connection-card coach-connection-card">
          <span className={`status-light ${health?.aiConfigured ? 'online' : ''}`} />
          <div><strong>{health?.aiConfigured ? `${health.aiProvider === 'deepseek' ? 'DeepSeek' : 'OpenAI'} 动态评析已连接` : '当前使用本地证据评析'}</strong><p>{health?.aiConfigured ? `当前模型：${health.aiModel}` : '未配置有效的云端密钥'}</p></div>
          <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noreferrer">管理 DeepSeek 密钥 <ExternalLink size={14} /></a>
        </div>

        {coachSettings?.canManage ? (
          <div className="coach-provider-form">
            <label><span>DeepSeek 模型</span><select value={deepSeekModel} onChange={(event) => setDeepSeekModel(event.target.value)} disabled={savingCoach}><option value="deepseek-v4-flash">DeepSeek V4 Flash · 速度与成本优先</option><option value="deepseek-v4-pro">DeepSeek V4 Pro · 复杂分寸优先</option></select></label>
            <label><span>DeepSeek API 密钥</span><div className="secret-input"><KeyRound size={16} /><input type="password" value={deepSeekKey} onChange={(event) => setDeepSeekKey(event.target.value)} autoComplete="new-password" spellCheck={false} placeholder={coachSettings.provider === 'deepseek' && coachSettings.configured ? '已保存；留空只更换模型' : '粘贴新密钥'} /></div></label>
            <div className="coach-provider-actions">
              <button className="button button-primary" onClick={saveDeepSeek} disabled={savingCoach || (!deepSeekKey.trim() && coachSettings.provider !== 'deepseek')}>
                {savingCoach ? <LoaderCircle className="spin" size={17} /> : <Cloud size={17} />} 验证并保存
              </button>
              {coachSettings.source === 'settings' && <button className="button danger-button" onClick={removeDeepSeek} disabled={savingCoach}><Trash2 size={16} /> 移除服务器密钥</button>}
            </div>
          </div>
        ) : (
          <p className="settings-note">当前部署没有启用个人密钥存储，请联系站点管理员</p>
        )}
        <p className="settings-note">服务器会先向 DeepSeek 验证密钥，验证成功后才会替换当前登录账户的旧配置。其他用户无法读取或使用它，密钥也不会进入学习备份或 GitHub</p>
        <p className="settings-note">启用云端评析后，Saylo 会把当前回答、练习场景、已学表达和本轮对话发送给当前供应商，不会发送完整学习记录</p>
        <div className="voice-provider-note"><Cloud size={18} /><p><strong>实时语音</strong>{health?.voiceConfigured ? 'OpenAI 实时语音已连接' : '实时语音仍需服务器配置 OpenAI 密钥；DeepSeek 当前只承担文字评析'}</p></div>
      </section>

      <section className="settings-section surface">
        <div className="settings-heading"><span className="settings-icon amber"><Database size={21} /></span><div><h2>备份与恢复</h2><p>Saylo 当前使用浏览器本地存储，换设备前需要导出备份</p></div></div>
        <div className="data-actions">
          <button className="button button-secondary" onClick={exportData}><Download size={17} /> 导出学习记录</button>
          <button className="button button-secondary" onClick={() => fileInput.current?.click()}><Upload size={17} /> 恢复学习记录</button>
          <input ref={fileInput} type="file" accept="application/json" hidden onChange={(event) => importData(event.target.files?.[0])} />
          <button className="button danger-button" onClick={resetData}><Trash2 size={17} /> 清空本地记录</button>
        </div>
        <p className="settings-note">当前数据版本：Saylo 学习记录版本 1</p>
      </section>
    </div>
  )
}

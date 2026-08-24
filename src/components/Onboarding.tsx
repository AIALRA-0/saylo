import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Headphones, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react'
import { goalOptions } from '../data/curriculum'
import { learningStore } from '../store/learningStore'
import type { LearnerProfile } from '../types'

const diagnosticQuestions = [
  {
    prompt: '同事为回复晚了而道歉，你想友好地表示没关系',
    options: ['No worries—I figured you were busy.', 'You should reply faster.', 'Hard pass.'],
    answer: 0,
  },
  {
    prompt: '朋友说新开的餐厅 was mid，对方大概率想表达什么',
    options: ['餐厅价格很高', '餐厅表现普通，有点令人失望', '餐厅在城市中部'],
    answer: 1,
  },
  {
    prompt: '朋友说手里有两张免费演出票，你想快速接受',
    options: ['Read the room.', 'Say less. I’m in.', 'That is a red flag.'],
    answer: 1,
  },
  {
    prompt: '哪种情境更适合使用 hard pass',
    options: ['拒绝好友提议的恐怖过山车', '回复客户的正式合同', '安慰刚刚失业的人'],
    answer: 0,
  },
  {
    prompt: '朋友尊重约会对象的界限，这通常可以称为',
    options: ['A red flag', 'A green flag', 'Caught in 4K'],
    answer: 1,
  },
]

const steps = ['方向', '边界', '基线']

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [goals, setGoals] = useState<string[]>(['朋友闲聊', '职场社交', '网络内容'])
  const [comfort, setComfort] = useState<LearnerProfile['comfort']>('mild')
  const [voicePrivacy, setVoicePrivacy] = useState<LearnerProfile['voicePrivacy']>('hybrid')
  const [answers, setAnswers] = useState<Record<number, number>>({})

  // 设置流程打开时锁住背后的应用页面，只让问卷正文承担滚动。
  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow
    const previousRootOverflow = document.documentElement.style.overflow

    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousRootOverflow
    }
  }, [])

  const diagnosticScore = useMemo(() => {
    const correct = diagnosticQuestions.filter((question, index) => answers[index] === question.answer).length
    return Math.round((correct / diagnosticQuestions.length) * 100)
  }, [answers])

  const toggleGoal = (goal: string) => {
    setGoals((current) => current.includes(goal) ? current.filter((item) => item !== goal) : [...current, goal])
  }

  const finish = () => {
    learningStore.finishOnboarding({
      name: name.trim(),
      goals: goals.length ? goals : ['朋友闲聊'],
      comfort,
      voicePrivacy,
      dailyMinutes: 20,
      onboarded: true,
    })
    learningStore.completeDiagnostic(diagnosticScore)
    onComplete()
  }

  return (
    <div className="onboarding-layer">
      <div className="onboarding-panel">
        <aside className="onboarding-story">
          <span className="onboarding-logo"><Sparkles size={23} /></span>
          <div>
            <p>Saylo</p>
            <h2>自然表达来自一次次合适的选择</h2>
            <span>你会先判断关系和场景，再把表达放进文字与语音对话。系统记录能否迁移使用，不用背诵数量代替真实进步</span>
          </div>
          <div className="story-proof">
            <ShieldCheck size={19} />
            <span>来源敏感表达会标明边界，并始终提供中性替代</span>
          </div>
        </aside>

        <main className="onboarding-main">
          <div className="stepper" aria-label="设置进度">
            {steps.map((label, index) => (
              <div key={label} className={index <= step ? 'active' : ''}>
                <span>{index < step ? <Check size={14} /> : index + 1}</span>
                <small>{label}</small>
              </div>
            ))}
          </div>

          {step === 0 && (
            <section className="onboarding-step">
              <span className="section-kicker">第一步 · 找到你的真实场景</span>
              <h1>你最想在哪些对话里更自然？</h1>
              <p>选择会改变首页推荐和角色任务，之后可以随时调整</p>
              <label className="name-field">
                <span>称呼，可留空</span>
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder="例如 Alex" autoFocus />
              </label>
              <div className="choice-cloud">
                {goalOptions.map((goal) => (
                  <button key={goal} className={goals.includes(goal) ? 'selected' : ''} onClick={() => toggleGoal(goal)}>
                    {goals.includes(goal) && <Check size={15} />} {goal}
                  </button>
                ))}
              </div>
            </section>
          )}

          {step === 1 && (
            <section className="onboarding-step">
              <span className="section-kicker">第二步 · 设定表达和语音边界</span>
              <h1>系统应该带你走多远？</h1>
              <p>高风险表达始终以识别为主，选择只影响示例强度</p>
              <div className="option-cards">
                {[
                  { value: 'clean', title: '日常稳妥', copy: '避开粗口、性暗示和高风险社群表达' },
                  { value: 'mild', title: '自然均衡', copy: '包含轻度粗口和来源敏感表达，逐条说明边界' },
                  { value: 'full', title: '完整识别', copy: '加入高风险词的识别训练，仍然限制主动使用' },
                ].map((option) => (
                  <button key={option.value} className={comfort === option.value ? 'selected' : ''} onClick={() => setComfort(option.value as LearnerProfile['comfort'])}>
                    <span>{comfort === option.value ? <Check size={16} /> : null}</span>
                    <strong>{option.title}</strong>
                    <small>{option.copy}</small>
                  </button>
                ))}
              </div>
              <p className="field-label">语音资料如何处理</p>
              <div className="privacy-options">
                {[
                  { value: 'local', icon: Headphones, title: '只用本地', copy: '浏览器完成发音和可用的语音转写' },
                  { value: 'hybrid', icon: MessageCircle, title: '混合模式', copy: '默认本地，配置密钥后可启用云端教练' },
                  { value: 'cloud', icon: Sparkles, title: '优先云端', copy: '配置密钥后优先使用实时语音' },
                ].map((option) => {
                  const Icon = option.icon
                  return (
                    <button key={option.value} className={voicePrivacy === option.value ? 'selected' : ''} onClick={() => setVoicePrivacy(option.value as LearnerProfile['voicePrivacy'])}>
                      <Icon size={20} /><span><strong>{option.title}</strong><small>{option.copy}</small></span>
                    </button>
                  )
                })}
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="onboarding-step diagnostic-step">
              <span className="section-kicker">第三步 · 建立语用基线</span>
              <h1>先完成 5 个场景判断</h1>
              <p>结果只用于确定起点，不限制后续内容</p>
              <div className="diagnostic-list">
                {diagnosticQuestions.map((question, index) => (
                  <fieldset key={question.prompt}>
                    <legend><span>{index + 1}</span>{question.prompt}</legend>
                    {question.options.map((option, optionIndex) => (
                      <label key={option} className={answers[index] === optionIndex ? 'selected' : ''}>
                        <input
                          type="radio"
                          name={`question-${index}`}
                          checked={answers[index] === optionIndex}
                          onChange={() => setAnswers((current) => ({ ...current, [index]: optionIndex }))}
                        />
                        {option}
                      </label>
                    ))}
                  </fieldset>
                ))}
              </div>
            </section>
          )}

          <footer className="onboarding-actions">
            <button className="button button-ghost" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}>
              <ArrowLeft size={17} /> 上一步
            </button>
            {step < 2 ? (
              <button className="button button-primary" onClick={() => setStep((current) => current + 1)} disabled={step === 0 && goals.length === 0}>
                继续 <ArrowRight size={17} />
              </button>
            ) : (
              <button className="button button-primary" onClick={finish} disabled={Object.keys(answers).length < diagnosticQuestions.length}>
                开始学习 <ArrowRight size={17} />
              </button>
            )}
          </footer>
        </main>
      </div>
    </div>
  )
}

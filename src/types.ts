import type { CardInput, Rating } from 'ts-fsrs'

export type RiskTier = 'green' | 'yellow' | 'red'
export type Register = '通用口语' | '熟人休闲' | '网络语境' | '社群敏感'
export type ProductionLevel = '主动使用' | '观察后使用' | '识别为主'
export type ExpressionCategory = '日常表达' | '网络俚语' | '网络缩写' | '游戏用语' | '文化语境' | '粗俗表达' | '小众表达'
export type OriginConfidence = '有文献记录' | '较可信' | '存在争议' | '尚不明确'
export type CurrencyLevel = '长期通用' | '当前流行' | '圈层常见' | '开始过时'
export type FeedbackLevel = '稳妥' | '可改进' | '需要重试' | '无法判断'

export interface ExpressionExample {
  context: string
  line: string
  translation: string
}

export interface ExpressionReview {
  prompt: string
  modelAnswer: string
  acceptableAnswers: string[]
  explanation: string
}

export interface ExpressionCard {
  id: string
  phrase: string
  variants: string[]
  meaning: string
  function: string
  module: string
  scenes: string[]
  relationship: string
  register: Register
  risk: RiskTier
  production: ProductionLevel
  tone: string
  provenance: string
  literalMeaning: string
  origin: string
  originConfidence: OriginConfidence
  spread: string
  category: ExpressionCategory
  currency: CurrencyLevel
  contrast: string
  evidenceSourceIds: string[]
  caution: string
  neutralAlternatives: string[]
  examples: ExpressionExample[]
  prompt: string
  review: ExpressionReview
  keywords: string[]
}

export interface ContentSource {
  id: string
  title: string
  publisher: string
  url: string
  scope: string
  accessedAt: string
}

export interface ModuleDefinition {
  id: string
  order: number
  title: string
  subtitle: string
  accent: string
  scenario: string
}

export interface SerializedFsrsCard extends Omit<CardInput, 'due' | 'last_review'> {
  due: string
  last_review?: string | null
}

export interface ExpressionProgress {
  expressionId: string
  card: SerializedFsrsCard
  seen: number
  spoken: number
  used: number
  lastRating?: Rating
  lastReviewedAt?: string
}

export interface ActivityRecord {
  id: string
  type: 'learn' | 'review' | 'chat' | 'voice' | 'diagnostic'
  expressionId?: string
  score?: number
  createdAt: string
}

export interface LearnerProfile {
  name: string
  goals: string[]
  comfort: 'clean' | 'mild' | 'full'
  voicePrivacy: 'local' | 'cloud' | 'hybrid'
  dailyMinutes: number
  onboarded: boolean
}

export interface AppState {
  version: number
  profile: LearnerProfile
  progress: Record<string, ExpressionProgress>
  activities: ActivityRecord[]
  savedIds: string[]
  completedDiagnostic: boolean
}

export interface FeedbackResult {
  headline: string
  confidence: '低' | '中' | '高'
  method: '本地证据评析' | 'AI 语用评估'
  dimensions: Array<{
    id: 'task' | 'pragmatics' | 'naturalness' | 'interaction' | 'target-use'
    label: string
    level: FeedbackLevel
    evidence: string
    suggestion: string
  }>
  strengths: string[]
  refinements: string[]
  naturalRewrite: string
  nextPrompt: string
  matchedExpressions: string[]
  limitations: string
  source: 'local' | 'openai' | 'deepseek'
}

export interface CoachMessage {
  id: string
  role: 'coach' | 'learner'
  text: string
  feedback?: FeedbackResult
}

export interface CoachScenario {
  id: string
  title: string
  setting: string
  relationship: string
  opening: string
  goal: string
  followUpPrompts: string[]
  suggestedExpressionIds: string[]
}

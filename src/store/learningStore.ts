import { useSyncExternalStore } from 'react'
import type { AppState, LearnerProfile, ExpressionProgress, ActivityRecord } from '../types'
import { createLearningCard, scheduleReview, type Grade } from '../lib/scheduler'

const STORAGE_KEY = 'saylo-learning-state-v1'

const defaultProfile: LearnerProfile = {
  name: '',
  goals: ['朋友闲聊', '职场社交', '网络内容'],
  comfort: 'mild',
  voicePrivacy: 'hybrid',
  dailyMinutes: 20,
  onboarded: false,
}

const initialState: AppState = {
  version: 1,
  profile: defaultProfile,
  progress: {},
  activities: [],
  savedIds: [],
  completedDiagnostic: false,
}

const loadState = (): AppState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return initialState
    const parsed = JSON.parse(saved) as Partial<AppState>
    return {
      ...initialState,
      ...parsed,
      profile: { ...defaultProfile, ...parsed.profile },
      progress: parsed.progress ?? {},
      activities: parsed.activities ?? [],
      savedIds: parsed.savedIds ?? [],
    }
  } catch {
    return initialState
  }
}

let state = loadState()
const listeners = new Set<() => void>()

// 所有写入都经过同一个入口，保证界面状态与本地持久化记录同步
const commit = (updater: (current: AppState) => AppState) => {
  state = updater(state)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  listeners.forEach((listener) => listener())
}

const activity = (type: ActivityRecord['type'], expressionId?: string, score?: number): ActivityRecord => ({
  id: crypto.randomUUID(),
  type,
  expressionId,
  score,
  createdAt: new Date().toISOString(),
})

const getOrCreateProgress = (current: AppState, expressionId: string): ExpressionProgress => current.progress[expressionId] ?? {
  expressionId,
  card: createLearningCard(),
  seen: 0,
  spoken: 0,
  used: 0,
}

export const learningStore = {
  getSnapshot: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  finishOnboarding: (profile: LearnerProfile) => commit((current) => ({
    ...current,
    profile: { ...profile, onboarded: true },
  })),
  updateProfile: (changes: Partial<LearnerProfile>) => commit((current) => ({
    ...current,
    profile: { ...current.profile, ...changes },
  })),
  markSeen: (expressionId: string) => commit((current) => {
    const progress = getOrCreateProgress(current, expressionId)
    return {
      ...current,
      progress: { ...current.progress, [expressionId]: { ...progress, seen: progress.seen + 1 } },
      activities: [activity('learn', expressionId), ...current.activities].slice(0, 1000),
    }
  }),
  markSpoken: (expressionId: string) => commit((current) => {
    const progress = getOrCreateProgress(current, expressionId)
    return {
      ...current,
      progress: { ...current.progress, [expressionId]: { ...progress, spoken: progress.spoken + 1 } },
      activities: [activity('voice', expressionId), ...current.activities].slice(0, 1000),
    }
  }),
  markUsed: (expressionId: string) => commit((current) => {
    const progress = getOrCreateProgress(current, expressionId)
    return {
      ...current,
      progress: { ...current.progress, [expressionId]: { ...progress, used: progress.used + 1 } },
    }
  }),
  review: (expressionId: string, rating: Grade) => commit((current) => {
    const progress = getOrCreateProgress(current, expressionId)
    const scheduled = scheduleReview(progress.card, rating)
    return {
      ...current,
      progress: {
        ...current.progress,
        [expressionId]: {
          ...progress,
          card: scheduled.card,
          seen: progress.seen + 1,
          lastRating: rating,
          lastReviewedAt: new Date().toISOString(),
        },
      },
      activities: [activity('review', expressionId, rating), ...current.activities].slice(0, 1000),
    }
  }),
  recordPractice: (type: 'chat' | 'voice', expressionIds: string[]) => commit((current) => {
    const nextProgress = { ...current.progress }
    expressionIds.forEach((expressionId) => {
      const progress = getOrCreateProgress(current, expressionId)
      nextProgress[expressionId] = { ...progress, used: progress.used + 1 }
    })
    return {
      ...current,
      progress: nextProgress,
      activities: [activity(type, expressionIds[0]), ...current.activities].slice(0, 1000),
    }
  }),
  completeDiagnostic: (score: number) => commit((current) => ({
    ...current,
    completedDiagnostic: true,
    activities: [activity('diagnostic', undefined, score), ...current.activities].slice(0, 1000),
  })),
  toggleSaved: (expressionId: string) => commit((current) => ({
    ...current,
    savedIds: current.savedIds.includes(expressionId)
      ? current.savedIds.filter((id) => id !== expressionId)
      : [...current.savedIds, expressionId],
  })),
  importState: (nextState: AppState) => commit(() => nextState),
  reset: () => commit(() => ({ ...initialState, profile: { ...defaultProfile } })),
}

export const useLearningStore = <T,>(selector: (current: AppState) => T): T => {
  const snapshot = useSyncExternalStore(learningStore.subscribe, learningStore.getSnapshot)
  return selector(snapshot)
}

import { expressions } from '../data/expressions'
import { isDue } from './scheduler'
import type { AppState } from '../types'

const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

export const getLearningStats = (state: AppState) => {
  const records = Object.values(state.progress)
  const learned = records.filter((record) => record.seen > 0).length
  const produced = records.filter((record) => record.used > 0 || record.spoken > 0).length
  const due = records.filter((record) => record.seen > 0 && isDue(record.card)).length
  const totalReviews = state.activities.filter((record) => record.type === 'review').length
  const practiceCount = state.activities.filter((record) => record.type === 'chat' || record.type === 'voice').length

  // 连续天数只按发生过学习活动的本地日期计算，避免一次操作被重复计数
  const activeDays = new Set(state.activities.map((record) => dayKey(new Date(record.createdAt))))
  let streak = 0
  const cursor = new Date()
  for (let offset = 0; offset < 365; offset += 1) {
    if (!activeDays.has(dayKey(cursor))) break
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return {
    learned,
    produced,
    due,
    totalReviews,
    practiceCount,
    streak,
    librarySize: expressions.length,
    progressPercent: Math.round((learned / expressions.length) * 100),
  }
}

export const getWeeklyActivity = (state: AppState) => Array.from({ length: 7 }, (_, index) => {
  const date = new Date()
  date.setDate(date.getDate() - (6 - index))
  const key = dayKey(date)
  return {
    label: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
    count: state.activities.filter((record) => dayKey(new Date(record.createdAt)) === key).length,
  }
})

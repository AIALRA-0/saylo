import type { ExpressionCard, LearnerProfile } from '../types'

// 个人边界只控制主动课程推荐，表达地图仍保留完整内容以支持识别和查询
export const isAllowedInActiveLesson = (expression: ExpressionCard, comfort: LearnerProfile['comfort']) => {
  if (comfort === 'full') return true
  if (comfort === 'mild') return expression.risk !== 'red'
  return expression.risk === 'green'
}

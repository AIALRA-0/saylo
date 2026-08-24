import { CircleAlert, CircleCheck, Eye } from 'lucide-react'
import type { RiskTier } from '../types'

const labels: Record<RiskTier, string> = {
  green: '可以主动使用',
  yellow: '观察场景后使用',
  red: '先以听懂为主',
}

export function RiskBadge({ risk, compact = false }: { risk: RiskTier; compact?: boolean }) {
  const Icon = risk === 'green' ? CircleCheck : risk === 'yellow' ? Eye : CircleAlert
  return (
    <span className={`risk-badge risk-${risk}`} title={labels[risk]}>
      <Icon size={compact ? 13 : 15} />
      {!compact && labels[risk]}
    </span>
  )
}

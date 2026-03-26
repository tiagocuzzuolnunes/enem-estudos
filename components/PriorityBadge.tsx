import type { Priority } from '@/types'

const config: Record<Priority, { label: string; className: string }> = {
  high:   { label: 'Alta',  className: 'bg-red-100   text-red-700   border-red-200'   },
  medium: { label: 'Média', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  low:    { label: 'Baixa', className: 'bg-green-100 text-green-700 border-green-200' },
}

export default function PriorityBadge({ priority }: { priority: Priority }) {
  const { label, className } = config[priority]
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${className}`}>
      {label}
    </span>
  )
}

interface Props {
  value: number   // 0-100
  color: string   // hex
  height?: string
}

export default function ProgressBar({ value, color, height = 'h-2' }: Props) {
  return (
    <div className={`w-full bg-gray-200 rounded-full ${height} overflow-hidden`}>
      <div
        className={`${height} rounded-full transition-all duration-500`}
        style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }}
      />
    </div>
  )
}

interface Props {
  enemDate: string
}

export default function DaysRemaining({ enemDate }: Props) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(enemDate)
  target.setHours(0, 0, 0, 0)
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diff < 0) {
    return (
      <div className="bg-gray-100 rounded-2xl p-4 text-center">
        <p className="text-sm text-gray-500">O ENEM já aconteceu</p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white text-center shadow-md">
      <p className="text-sm font-medium opacity-80 mb-1">Faltam</p>
      <p className="text-5xl font-bold tracking-tight">{diff}</p>
      <p className="text-sm font-medium opacity-80 mt-1">dias para o ENEM</p>
    </div>
  )
}

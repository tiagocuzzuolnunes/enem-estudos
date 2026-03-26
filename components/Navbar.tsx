import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="font-bold text-lg text-gray-900 tracking-tight">
          📚 ENEM Estudos
        </Link>
      </div>
    </nav>
  )
}

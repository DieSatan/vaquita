import { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-3xl">🐄</span>
            <div>
              <h1 className="text-xl font-bold text-green-700 leading-none">Vaquita</h1>
              <p className="text-xs text-gray-500 leading-none">Divide cuentas sin drama</p>
            </div>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-100 py-6 mt-8">
        <div className="max-w-2xl mx-auto px-4 text-center space-y-2">
          <p className="text-sm text-gray-500 italic">
            🐄 <strong>Vaquita</strong>: chilenismo para "hacer una vaquita", juntar plata entre
            varios. Viene de <em>vaca</em> — antiguamente se juntaba plata para comprar un animal
            vacuno, hoy se usa para cualquier colecta grupal.
          </p>
          <p className="text-xs text-gray-400">
            Creado por <strong>Gustavo Aguilera P.</strong>
          </p>
        </div>
      </footer>
    </div>
  )
}

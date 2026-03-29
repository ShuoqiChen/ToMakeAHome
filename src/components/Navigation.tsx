'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const navItems = [
  { href: '/', label: 'Home', icon: '🏡' },
  { href: '/companion', label: 'Companion', icon: '🌿' },
  { href: '/journal', label: 'Journal', icon: '📖' },
  { href: '/progress', label: 'Progress', icon: '🌱' },
  { href: '/community', label: 'Community', icon: '🤝' },
  { href: '/challenges', label: 'Challenges', icon: '✨' },
]

export default function Navigation() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FAF7F2]/95 backdrop-blur-sm border-b border-[#D4A5A5]/30 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🏡</span>
          <span className="font-serif text-xl font-semibold text-[#8B6F5E]">ToMakeAHome</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.slice(1).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                pathname === item.href
                  ? 'bg-[#D4A5A5]/30 text-[#8B6F5E]'
                  : 'text-[#8B6F5E]/70 hover:bg-[#8FAF8C]/20 hover:text-[#8B6F5E]'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-[#8B6F5E]"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#FAF7F2] border-t border-[#D4A5A5]/30 px-4 py-3 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname === item.href
                  ? 'bg-[#D4A5A5]/30 text-[#8B6F5E]'
                  : 'text-[#8B6F5E]/70 hover:bg-[#8FAF8C]/20'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}

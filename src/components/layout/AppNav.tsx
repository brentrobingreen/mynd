'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Brain, PenLine, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/library', label: 'Library', icon: BookOpen },
  { href: '/brain', label: 'My Brain', icon: Brain },
  { href: '/journal', label: 'Journal', icon: PenLine },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function AppNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed left-0 top-0 h-full w-60 bg-[var(--sidebar-bg)] border-r border-[var(--border)] flex flex-col z-20">
      {/* Logo */}
      <div className="p-6 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-6 h-6 text-[var(--accent)]" />
          <span className="font-literary text-lg text-[var(--foreground)] tracking-tight">Mynd</span>
        </div>
      </div>

      {/* Nav links */}
      <div className="flex-1 py-4 px-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
              pathname.startsWith(href)
                ? 'bg-[var(--accent)] text-white font-medium'
                : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--muted-bg)]'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </div>

      {/* Sign out */}
      <div className="p-3 border-t border-[var(--border)]">
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--muted-bg)] w-full transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign out
          </button>
        </form>
      </div>
    </nav>
  )
}

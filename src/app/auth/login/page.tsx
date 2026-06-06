import { Suspense } from 'react'
import { BookOpen } from 'lucide-react'
import LoginForm from './LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <BookOpen className="w-8 h-8 text-[var(--accent)]" />
            <span className="font-literary text-2xl text-[var(--foreground)] tracking-tight">Resontheca</span>
          </div>
          <p className="text-[var(--muted)] text-sm">Your books know you. Now they can guide you.</p>
        </div>
        <Suspense fallback={<div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-8 h-64 animate-pulse" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
